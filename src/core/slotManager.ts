import { App, TFile } from 'obsidian';
import { Slot, SlotAction } from '../types/geff';
import { ValidationUtils } from '../utils/validation';
import { DataManager } from './dataManager';
import { WorkspaceManager } from './workspaceManager';

export class SlotManager {
  private lastAction: SlotAction | null = null;

  constructor(
    private app: App,
    private dataManager: DataManager,
    private workspaceManager: WorkspaceManager
  ) {}

  async addCurrentNote(slotIndex?: number): Promise<Slot> {
    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) {
      throw new Error('No active file');
    }

    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    const settings = this.dataManager.getSettings();
    const maxSlots = settings.maxSlots;

    // Validate slot index
    if (
      slotIndex !== undefined &&
      !ValidationUtils.validateSlotIndex(slotIndex, maxSlots)
    ) {
      throw new Error(
        `Invalid slot index. Must be between 0 and ${maxSlots - 1}`
      );
    }

    const notePath = activeFile.path;

    // Check if note already exists in any slot
    const existingSlotIndex = activeWorkspace.slots.findIndex(
      (s) => s.notePath === notePath
    );
    if (existingSlotIndex !== -1) {
      throw new Error('Note already exists in slot ' + (existingSlotIndex + 1));
    }

    const newSlot: Slot = {
      id: ValidationUtils.generateId(),
      notePath,
    };

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === activeWorkspace.id);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Store action for undo
    this.lastAction = {
      type: 'add',
      slot: newSlot,
      timestamp: Date.now(),
    };

    if (slotIndex !== undefined) {
      // Insert at specific index
      if (slotIndex >= workspace.slots.length) {
        workspace.slots.push(newSlot);
      } else {
        workspace.slots.splice(slotIndex, 0, newSlot);
      }
    } else {
      // Add to first available slot or end
      if (workspace.slots.length < maxSlots) {
        workspace.slots.push(newSlot);
      } else {
        throw new Error('All slots are full');
      }
    }

    workspace.updatedAt = new Date().toISOString();
    this.dataManager.setData(data);
    await this.dataManager.save();

    return newSlot;
  }

  async removeNote(slotIndex: number): Promise<Slot> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    if (
      !ValidationUtils.validateSlotIndex(
        slotIndex,
        activeWorkspace.slots.length
      )
    ) {
      throw new Error('Invalid slot index');
    }

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === activeWorkspace.id);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const removedSlot = workspace.slots[slotIndex];

    // Store action for undo
    this.lastAction = {
      type: 'remove',
      slot: removedSlot,
      timestamp: Date.now(),
    };

    workspace.slots.splice(slotIndex, 1);
    workspace.updatedAt = new Date().toISOString();

    this.dataManager.setData(data);
    await this.dataManager.save();

    return removedSlot;
  }

  async gotoSlot(slotIndex: number): Promise<TFile | null> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    if (
      !ValidationUtils.validateSlotIndex(
        slotIndex,
        activeWorkspace.slots.length
      )
    ) {
      throw new Error('Invalid slot index');
    }

    const slot = activeWorkspace.slots[slotIndex];
    const file = this.app.vault.getAbstractFileByPath(slot.notePath);

    if (!(file instanceof TFile)) {
      throw new Error('File not found: ' + slot.notePath);
    }

    await this.app.workspace.getLeaf().openFile(file);
    return file;
  }

  async undoLastAction(): Promise<void> {
    if (!this.lastAction) {
      throw new Error('No action to undo');
    }

    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === activeWorkspace.id);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (this.lastAction.type === 'add') {
      // Remove the added slot
      const slotIndex = workspace.slots.findIndex(
        (s) => s.id === this.lastAction!.slot.id
      );
      if (slotIndex !== -1) {
        workspace.slots.splice(slotIndex, 1);
      }
    } else if (this.lastAction.type === 'remove') {
      // Add back the removed slot
      workspace.slots.push(this.lastAction.slot);
    }

    workspace.updatedAt = new Date().toISOString();
    this.dataManager.setData(data);
    await this.dataManager.save();

    this.lastAction = null;
  }

  getSlots(): Slot[] {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    return activeWorkspace ? [...activeWorkspace.slots] : [];
  }

  getSlot(slotIndex: number): Slot | null {
    const slots = this.getSlots();
    return ValidationUtils.validateSlotIndex(slotIndex, slots.length)
      ? slots[slotIndex]
      : null;
  }

  async updateSlotPath(slotId: string, newPath: string): Promise<void> {
    if (!ValidationUtils.isValidNotePath(newPath)) {
      throw new Error('Invalid note path');
    }

    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === activeWorkspace.id);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const slot = workspace.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error('Slot not found');
    }

    slot.notePath = newPath;
    slot.isMissing = false;
    workspace.updatedAt = new Date().toISOString();

    this.dataManager.setData(data);
    await this.dataManager.save();
  }

  async markSlotMissing(
    slotId: string,
    isMissing: boolean = true
  ): Promise<void> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === activeWorkspace.id);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const slot = workspace.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error('Slot not found');
    }

    slot.isMissing = isMissing;
    workspace.updatedAt = new Date().toISOString();

    this.dataManager.setData(data);
    await this.dataManager.save();
  }

  async removeMissingSlots(): Promise<Slot[]> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) {
      throw new Error('No active workspace');
    }

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === activeWorkspace.id);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const missingSlots = workspace.slots.filter((s) => s.isMissing);
    workspace.slots = workspace.slots.filter((s) => !s.isMissing);
    workspace.updatedAt = new Date().toISOString();

    this.dataManager.setData(data);
    await this.dataManager.save();

    return missingSlots;
  }

  hasUndoAction(): boolean {
    return this.lastAction !== null;
  }

  getLastAction(): SlotAction | null {
    return this.lastAction;
  }
}
