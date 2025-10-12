import { App, TFile, TAbstractFile } from 'obsidian';
import { DataManager } from './dataManager';
import { SlotManager } from './slotManager';
import { WorkspaceManager } from './workspaceManager';

export class EventHandler {
  private isHandlingEvent = false;

  constructor(
    private app: App,
    private dataManager: DataManager,
    private slotManager: SlotManager,
    private workspaceManager: WorkspaceManager
  ) {}

  registerEventHandlers(): void {
    // File rename event
    this.app.vault.on('rename', this.handleFileRename.bind(this));

    // File delete event
    this.app.vault.on('delete', this.handleFileDelete.bind(this));

    // File create event (for recovery)
    this.app.vault.on('create', this.handleFileCreate.bind(this));
  }

  unregisterEventHandlers(): void {
    // Obsidian automatically cleans up event listeners when plugin is unloaded
  }

  private async handleFileRename(
    file: TAbstractFile,
    oldPath: string
  ): Promise<void> {
    if (this.isHandlingEvent || !(file instanceof TFile)) return;

    this.isHandlingEvent = true;

    try {
      await this.updateSlotPaths(oldPath, file.path);
    } catch (error) {
      console.error('Error handling file rename:', error);
    } finally {
      this.isHandlingEvent = false;
    }
  }

  private async handleFileDelete(file: TAbstractFile): Promise<void> {
    if (this.isHandlingEvent || !(file instanceof TFile)) return;

    this.isHandlingEvent = true;

    try {
      await this.markSlotsAsMissing(file.path);
    } catch (error) {
      console.error('Error handling file delete:', error);
    } finally {
      this.isHandlingEvent = false;
    }
  }

  private async handleFileCreate(file: TAbstractFile): Promise<void> {
    if (this.isHandlingEvent || !(file instanceof TFile)) return;

    this.isHandlingEvent = true;

    try {
      await this.checkForRecoveredFile(file.path);
    } catch (error) {
      console.error('Error handling file create:', error);
    } finally {
      this.isHandlingEvent = false;
    }
  }

  private async updateSlotPaths(
    oldPath: string,
    newPath: string
  ): Promise<void> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) return;

    const slots = activeWorkspace.slots;
    let updated = false;

    for (const slot of slots) {
      if (slot.notePath === oldPath) {
        await this.slotManager.updateSlotPath(slot.id, newPath);
        updated = true;
      }
    }

    if (updated) {
      console.log(`Updated slot path from ${oldPath} to ${newPath}`);
    }
  }

  private async markSlotsAsMissing(filePath: string): Promise<void> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) return;

    const slots = activeWorkspace.slots;
    let marked = false;

    for (const slot of slots) {
      if (slot.notePath === filePath) {
        await this.slotManager.markSlotMissing(slot.id, true);
        marked = true;
      }
    }

    if (marked) {
      console.log(`Marked slot as missing: ${filePath}`);

      // Auto-remove missing files if setting is enabled
      const settings = this.dataManager.getSettings();
      if (settings.autoRemoveMissing) {
        await this.slotManager.removeMissingSlots();
      }
    }
  }

  private async checkForRecoveredFile(filePath: string): Promise<void> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) return;

    const slots = activeWorkspace.slots;

    for (const slot of slots) {
      if (slot.notePath === filePath && slot.isMissing) {
        await this.slotManager.markSlotMissing(slot.id, false);
        console.log(`Recovered missing file: ${filePath}`);
      }
    }
  }

  async validateAllSlots(): Promise<string[]> {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    if (!activeWorkspace) return [];

    const missingFiles: string[] = [];
    const slots = activeWorkspace.slots;

    for (const slot of slots) {
      const file = this.app.vault.getAbstractFileByPath(slot.notePath);
      if (!file) {
        missingFiles.push(slot.notePath);
        await this.slotManager.markSlotMissing(slot.id, true);
      } else if (slot.isMissing) {
        // File exists but slot is marked as missing, recover it
        await this.slotManager.markSlotMissing(slot.id, false);
      }
    }

    return missingFiles;
  }

  async handleVaultChange(): Promise<void> {
    // Called when vault path changes or vault is switched
    try {
      const missingFiles = await this.validateAllSlots();

      if (missingFiles.length > 0) {
        console.log(
          `Found ${missingFiles.length} missing files after vault change`
        );

        const settings = this.dataManager.getSettings();
        if (settings.autoRemoveMissing) {
          const removedSlots = await this.slotManager.removeMissingSlots();
          console.log(`Auto-removed ${removedSlots.length} missing slots`);
        }
      }
    } catch (error) {
      console.error('Error handling vault change:', error);
    }
  }

  async cleanupMissingFiles(): Promise<number> {
    const missingFiles = await this.validateAllSlots();

    if (missingFiles.length === 0) return 0;

    const removedSlots = await this.slotManager.removeMissingSlots();
    return removedSlots.length;
  }
}
