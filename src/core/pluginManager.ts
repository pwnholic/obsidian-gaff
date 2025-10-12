import { App, Plugin, TFile, Modal, Setting } from 'obsidian';
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

      console.log('Obsidian Geff plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Obsidian Geff plugin:', error);
      this.notice.showError('Failed to load plugin');
    }
  }

  async onunload(): Promise<void> {
    try {
      // Unregister event handlers
      this.eventHandler.unregisterEventHandlers();

      // Clean up UI components
      // this.quickMenu?.destroy();
      this.statusBar?.unregister();

      console.log('Obsidian Geff plugin unloaded successfully');
    } catch (error) {
      console.error('Error unloading Obsidian Geff plugin:', error);
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
        id: 'switch-workspace',
        name: 'Switch Workspace',
        callback: () => this.handleSwitchWorkspace(),
      },
      {
        id: 'export-workspace',
        name: 'Export Workspace',
        callback: () => this.handleExportWorkspace(),
      },
      {
        id: 'import-workspace',
        name: 'Import Workspace',
        callback: () => this.handleImportWorkspace(),
      },
      {
        id: 'undo-last-action',
        name: 'Undo Last Action',
        callback: () => this.handleUndoLastAction(),
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
      'switch-workspace': 'Switch Workspace',
      'export-workspace': 'Export Workspace',
      'import-workspace': 'Import Workspace',
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
        case 'switch-workspace':
          await this.handleSwitchWorkspace();
          break;
        case 'export-workspace':
          await this.handleExportWorkspace();
          break;
        case 'import-workspace':
          await this.handleImportWorkspace();
          break;
        case 'undo-last-action':
          await this.handleUndoLastAction();
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
      const workspaces = this.workspaceManager.getAllWorkspaces();
      if (workspaces.length <= 1) {
        this.notice.showError('No other workspaces available');
        return;
      }

      // Simple implementation - switch to next workspace
      const activeWorkspace = this.workspaceManager.getActiveWorkspace();
      const currentIndex = workspaces.findIndex(
        (w) => w.id === activeWorkspace?.id
      );
      const nextIndex = (currentIndex + 1) % workspaces.length;
      const nextWorkspace = workspaces[nextIndex];

      await this.workspaceManager.switchWorkspace(nextWorkspace.id);
      this.notice.showSuccess(`Switched to workspace "${nextWorkspace.name}"`);
      this.statusBar.update();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleExportWorkspace(): Promise<void> {
    try {
      const activeWorkspace = this.workspaceManager.getActiveWorkspace();
      if (!activeWorkspace) {
        this.notice.showError('No active workspace');
        return;
      }

      const exportData = await this.workspaceManager.exportWorkspace(
        activeWorkspace.id
      );

      // Create file in vault
      const fileName = `${activeWorkspace.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
      await this.app.vault.create(fileName, exportData);

      this.notice.showSuccess(`Workspace exported to ${fileName}`);
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleImportWorkspace(): Promise<void> {
    try {
      // Simple implementation - prompt for file path
      const filePath = await this.promptForInput(
        'Enter path to workspace export file:'
      );
      if (!filePath) return;

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) {
        this.notice.showError('File not found');
        return;
      }

      const content = await this.app.vault.read(file);
      const workspace = await this.workspaceManager.importWorkspace(content);

      this.notice.showSuccess(`Workspace "${workspace.name}" imported`);
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

  private async handleUndoLastAction(): Promise<void> {
    try {
      await this.slotManager.undoLastAction();
      this.notice.showSuccess('Action undone');
      this.statusBar.update();
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
              btn
                .setButtonText('Cancel')
                .onClick(() => {
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
