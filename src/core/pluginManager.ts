import { App, Plugin, Modal, Setting, SuggestModal } from 'obsidian';
import { DataManager } from './dataManager';
import { WorkspaceManager } from './workspaceManager';
import { SlotManager } from './slotManager';
import { EventHandler } from './eventHandler';
import { QuickMenu } from '../ui/quickMenu';
import { StatusBar } from '../ui/statusBar';
import { SettingsTab } from '../ui/settingsTab';
import { Notice } from '../ui/notice';
// import { KeyboardUtils } from '../utils/keyboard';
import { DEFAULT_HOTKEYS, SLOT_HOTKEYS } from '../utils/constants';
import { Workspace } from '../types/workspace';

interface WorkspaceSuggestion {
  workspace: Workspace;
  isActive: boolean;
}

class WorkspaceSelectionModal extends SuggestModal<WorkspaceSuggestion> {
  private workspaces: Workspace[] = [];
  private activeWorkspaceId: string | null = null;
  private onSelect: (workspace: Workspace) => void;

  constructor(
    app: App,
    workspaces: Workspace[],
    activeWorkspaceId: string | null,
    onSelect: (workspace: Workspace) => void
  ) {
    super(app);
    this.workspaces = workspaces;
    this.activeWorkspaceId = activeWorkspaceId;
    this.onSelect = onSelect;
    this.setPlaceholder('Select a workspace to switch to...');

    console.log(
      'Geff: WorkspaceSelectionModal constructor received workspaces:',
      workspaces.length
    );
    console.log(
      'Geff: WorkspaceSelectionModal workspaces:',
      workspaces.map((w) => ({ name: w.name, id: w.id, slots: w.slots.length }))
    );
  }

  getSuggestions(query: string): WorkspaceSuggestion[] {
    const filtered = this.workspaces
      .filter(
        (workspace) =>
          workspace.name.toLowerCase().includes(query.toLowerCase()) &&
          workspace.id !== this.activeWorkspaceId
      )
      .map((workspace) => ({
        workspace,
        isActive: workspace.id === this.activeWorkspaceId,
      }));

    console.log(
      'Geff: getSuggestions - total workspaces:',
      this.workspaces.length
    );
    console.log(
      'Geff: getSuggestions - activeWorkspaceId:',
      this.activeWorkspaceId
    );
    console.log('Geff: getSuggestions - query:', query);
    console.log('Geff: getSuggestions - filtered results:', filtered.length);
    console.log(
      'Geff: getSuggestions - filtered workspaces:',
      filtered.map((f) => f.workspace.name)
    );

    return filtered;
  }

  renderSuggestion(suggestion: WorkspaceSuggestion, el: HTMLElement): void {
    const { workspace, isActive } = suggestion;

    const container = el.createDiv({ cls: 'geff-workspace-suggestion' });
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.padding = '8px 12px';
    container.style.gap = '12px';

    // Workspace name
    const nameEl = container.createSpan({ cls: 'geff-workspace-name' });
    nameEl.textContent = workspace.name;
    nameEl.style.fontWeight = '500';

    if (isActive) {
      nameEl.style.color = 'var(--text-accent)';
      nameEl.textContent += ' (Current)';
    }

    // Slot count
    const slotCount = container.createSpan({ cls: 'geff-slot-count' });
    slotCount.textContent = `[${workspace.slots.length} slots]`;
    slotCount.style.fontSize = '0.8em';
    slotCount.style.color = 'var(--text-muted)';
    slotCount.style.marginLeft = 'auto';

    // Hover effect
    container.onmouseover = () => {
      container.style.backgroundColor = 'var(--background-modifier-hover)';
    };

    container.onmouseout = () => {
      container.style.backgroundColor = '';
    };
  }

  async onChooseSuggestion(
    suggestion: WorkspaceSuggestion,
    _evt: MouseEvent | KeyboardEvent
  ): Promise<void> {
    this.onSelect(suggestion.workspace);
  }
}

export class PluginManager {
  private dataManager!: DataManager;
  private workspaceManager!: WorkspaceManager;
  private slotManager!: SlotManager;
  private eventHandler!: EventHandler;
  private quickMenu!: QuickMenu;
  private statusBar!: StatusBar;
  private settingsTab!: SettingsTab;
  private notice: Notice;

  constructor(
    private plugin: Plugin,
    private app: App
  ) {
    this.notice = new Notice(app);
  }

  async onload(): Promise<void> {
    try {
      // Initialize core managers
      this.dataManager = new DataManager(this.app);

      // Initialize settings from plugin data
      const pluginData = await this.plugin.loadData();
      this.dataManager.initializeSettings(pluginData?.settings);

      this.workspaceManager = new WorkspaceManager(this.app, this.dataManager);
      this.slotManager = new SlotManager(
        this.app,
        this.dataManager,
        this.workspaceManager
      );
      this.eventHandler = new EventHandler(
        this.app,
        this.dataManager,
        this.slotManager,
        this.workspaceManager
      );

      // Load data
      await this.dataManager.load();

      // Initialize UI components
      this.quickMenu = new QuickMenu(
        this.app,
        this.slotManager,
        this.workspaceManager,
        this.dataManager,
        this.notice
      );
      this.statusBar = new StatusBar(
        this.app,
        this.plugin,
        this.workspaceManager,
        this.slotManager
      );
      this.settingsTab = new SettingsTab(
        this.app,
        this.plugin,
        this.dataManager,
        this.notice
      );

      // Register UI elements
      this.statusBar.register();
      this.plugin.addSettingTab(this.settingsTab);

      // Register event handlers
      this.eventHandler.registerEventHandlers();

      // Register commands
      this.registerCommands();

      // Register hotkeys
      this.registerHotkeys();

      // Validate slots on load
      await this.eventHandler.validateAllSlots();

      console.log('Geff plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Geff plugin:', error);
      this.notice.showError('Failed to load plugin');
    }
  }

  async onunload(): Promise<void> {
    try {
      // Save data before unloading
      console.log('Geff: Saving data before plugin unload...');
      await this.dataManager.save();

      // Unregister event handlers
      this.eventHandler.unregisterEventHandlers();

      // Clean up UI components
      // this.quickMenu?.destroy();
      this.statusBar?.unregister();

      console.log('Geff plugin unloaded successfully');
    } catch (error) {
      console.error('Error unloading Geff plugin:', error);
    }
  }

  private registerCommands(): void {
    const commands = [
      {
        id: 'add-current-note',
        name: 'Add Current Note',
        callback: () => this.handleAddCurrentNote(),
      },
      {
        id: 'remove-note',
        name: 'Remove Note from Slot',
        callback: () => this.handleRemoveNote(),
      },
      {
        id: 'open-quick-menu',
        name: 'Open Quick Menu',
        callback: () => this.handleOpenQuickMenu(),
      },
      {
        id: 'create-workspace',
        name: 'Create Workspace',
        callback: () => this.handleCreateWorkspace(),
      },
      {
        id: 'rename-workspace',
        name: 'Rename Workspace',
        callback: () => this.handleRenameWorkspace(),
      },
      {
        id: 'delete-workspace',
        name: 'Delete Workspace',
        callback: () => this.handleDeleteWorkspace(),
      },
      {
        id: 'select-workspace',
        name: 'Select Workspace',
        callback: () => this.handleSwitchWorkspace(),
      },
    ];

    // Add slot navigation commands
    for (let i = 1; i <= 9; i++) {
      commands.push({
        id: `goto-slot-${i}`,
        name: `Go to Slot ${i}`,
        callback: () => this.handleGotoSlot(i - 1),
      });
    }

    commands.forEach((command) => {
      this.plugin.addCommand(command);
    });
  }

  private registerHotkeys(): void {
    // const settings = this.dataManager.getSettings();

    // Register main hotkeys
    Object.entries(DEFAULT_HOTKEYS).forEach(([commandId, hotkey]) => {
      this.plugin.addCommand({
        id: commandId,
        name: this.getCommandName(commandId),
        hotkeys: [
          {
            modifiers: this.parseModifiers(hotkey),
            key: this.parseKey(hotkey),
          },
        ],
        callback: () => this.handleCommand(commandId),
      });
    });

    // Register slot hotkeys
    Object.entries(SLOT_HOTKEYS).forEach(([slotNum, hotkey]) => {
      this.plugin.addCommand({
        id: `goto-slot-${slotNum}`,
        name: `Go to Slot ${slotNum}`,
        hotkeys: [
          {
            modifiers: this.parseModifiers(hotkey),
            key: this.parseKey(hotkey),
          },
        ],
        callback: () => this.handleGotoSlot(parseInt(slotNum) - 1),
      });
    });
  }

  private parseModifiers(
    hotkey: string
  ): ('Mod' | 'Shift' | 'Alt' | 'Ctrl' | 'Meta')[] {
    const parts = hotkey.toLowerCase().split('+');
    const modifiers: ('Mod' | 'Shift' | 'Alt' | 'Ctrl' | 'Meta')[] = [];

    if (parts.includes('ctrl') || parts.includes('cmd')) modifiers.push('Mod');
    if (parts.includes('shift')) modifiers.push('Shift');
    if (parts.includes('alt')) modifiers.push('Alt');

    return modifiers;
  }

  private parseKey(hotkey: string): string {
    const parts = hotkey.split('+');
    return parts[parts.length - 1];
  }

  private getCommandName(commandId: string): string {
    const names: Record<string, string> = {
      'add-current-note': 'Add Current Note',
      'remove-note': 'Remove Note',
      'open-quick-menu': 'Open Quick Menu',
      'create-workspace': 'Create Workspace',
      'rename-workspace': 'Rename Workspace',
      'delete-workspace': 'Delete Workspace',
      'select-workspace': 'Select Workspace',
      'switch-workspace': 'Switch to Next Workspace',
    };
    return names[commandId] || commandId;
  }

  private async handleCommand(commandId: string): Promise<void> {
    try {
      switch (commandId) {
        case 'add-current-note':
          await this.handleAddCurrentNote();
          break;
        case 'remove-note':
          await this.handleRemoveNote();
          break;
        case 'open-quick-menu':
          this.handleOpenQuickMenu();
          break;
        case 'create-workspace':
          await this.handleCreateWorkspace();
          break;
        case 'rename-workspace':
          await this.handleRenameWorkspace();
          break;
        case 'delete-workspace':
          await this.handleDeleteWorkspace();
          break;
        case 'select-workspace':
          await this.handleSwitchWorkspace();
          break;
      }
    } catch (error) {
      console.error(`Error handling command ${commandId}:`, error);
      this.notice.showError('Command failed');
    }
  }

  private async handleAddCurrentNote(): Promise<void> {
    try {
      await this.slotManager.addCurrentNote();
      this.notice.showSuccess(`Note added to slot`);
      this.statusBar.update();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleRemoveNote(): Promise<void> {
    try {
      // For now, remove from last slot. Could be enhanced with selection
      const slots = this.slotManager.getSlots();
      if (slots.length === 0) {
        this.notice.showError('No slots to remove');
        return;
      }

      await this.slotManager.removeNote(slots.length - 1);
      this.notice.showSuccess('Note removed from slot');
      this.statusBar.update();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private handleOpenQuickMenu(): void {
    this.quickMenu.open();
  }

  private async handleCreateWorkspace(): Promise<void> {
    try {
      const name = await this.promptForInput('Enter workspace name:');
      if (!name) return;

      const workspace = await this.workspaceManager.createWorkspace(name);
      this.notice.showSuccess(`Workspace "${workspace.name}" created`);
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleRenameWorkspace(): Promise<void> {
    try {
      const activeWorkspace = this.workspaceManager.getActiveWorkspace();
      if (!activeWorkspace) {
        this.notice.showError('No active workspace');
        return;
      }

      const newName = await this.promptForInput(
        'Enter new workspace name:',
        activeWorkspace.name
      );
      if (!newName) return;

      const workspace = await this.workspaceManager.renameWorkspace(
        activeWorkspace.id,
        newName
      );
      this.notice.showSuccess(`Workspace renamed to "${workspace.name}"`);
      this.statusBar.update();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleDeleteWorkspace(): Promise<void> {
    try {
      const activeWorkspace = this.workspaceManager.getActiveWorkspace();
      if (!activeWorkspace) {
        this.notice.showError('No active workspace');
        return;
      }

      const confirmed = await this.promptForConfirmation(
        `Are you sure you want to delete workspace "${activeWorkspace.name}"?`
      );
      if (!confirmed) return;

      await this.workspaceManager.deleteWorkspace(activeWorkspace.id);
      this.notice.showSuccess(`Workspace "${activeWorkspace.name}" deleted`);
      this.statusBar.update();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleSwitchWorkspace(): Promise<void> {
    try {
      console.log('Geff: handleSwitchWorkspace - starting...');
      const workspaces = this.workspaceManager.getAllWorkspaces();
      const activeWorkspace = this.workspaceManager.getActiveWorkspace();

      console.log(
        'Geff: handleSwitchWorkspace - workspaces count:',
        workspaces.length
      );
      console.log(
        'Geff: handleSwitchWorkspace - active workspace:',
        activeWorkspace?.name || 'null'
      );

      if (workspaces.length <= 1) {
        this.notice.showError('No other workspaces available');
        return;
      }

      // Show workspace selection modal
      console.log(
        'Geff: Creating WorkspaceSelectionModal with workspaces:',
        workspaces.length
      );
      console.log(
        'Geff: Workspaces being sent to modal:',
        workspaces.map((w) => ({
          name: w.name,
          id: w.id,
          slots: w.slots.length,
        }))
      );

      const modal = new WorkspaceSelectionModal(
        this.app,
        workspaces,
        activeWorkspace?.id || null,
        async (selectedWorkspace) => {
          try {
            await this.workspaceManager.switchWorkspace(selectedWorkspace.id);
            this.notice.showSuccess(
              `Switched to workspace "${selectedWorkspace.name}"`
            );
            this.statusBar.update();
          } catch (error) {
            this.notice.showError(
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      );

      modal.open();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleGotoSlot(slotIndex: number): Promise<void> {
    try {
      await this.slotManager.gotoSlot(slotIndex);
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async promptForInput(
    message: string,
    defaultValue: string = ''
  ): Promise<string> {
    return new Promise((resolve) => {
      class InputModal extends Modal {
        private input!: HTMLInputElement;
        private resolved = false;

        constructor(app: App) {
          super(app);
        }

        onOpen() {
          const { contentEl } = this;
          contentEl.createEl('h3', { text: message });

          new Setting(contentEl)
            .addText((text) => {
              this.input = text.inputEl;
              this.input.value = defaultValue;
              this.input.focus();
              this.input.select();
            })
            .addButton((btn) =>
              btn.setButtonText('Cancel').onClick(() => {
                if (!this.resolved) {
                  this.resolved = true;
                  resolve('');
                  this.close();
                }
              })
            )
            .addButton((btn) =>
              btn
                .setButtonText('OK')
                .setCta()
                .onClick(() => {
                  if (!this.resolved) {
                    this.resolved = true;
                    resolve(this.input.value);
                    this.close();
                  }
                })
            );

          // Handle Enter key
          this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              if (!this.resolved) {
                this.resolved = true;
                resolve(this.input.value);
                this.close();
              }
            } else if (e.key === 'Escape') {
              if (!this.resolved) {
                this.resolved = true;
                resolve('');
                this.close();
              }
            }
          });
        }

        onClose() {
          const { contentEl } = this;
          contentEl.empty();
          if (!this.resolved) {
            this.resolved = true;
            resolve('');
          }
        }
      }

      new InputModal(this.app).open();
    });
  }

  private async promptForConfirmation(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = confirm(message);
      resolve(confirmed);
    });
  }
}
