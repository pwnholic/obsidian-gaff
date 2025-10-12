import { App, Modal, TFile } from 'obsidian';
import { Slot, Workspace } from '../types/geff';
import { SlotManager } from '../core/slotManager';
import { WorkspaceManager } from '../core/workspaceManager';
import { Notice } from './notice';
import { DataManager } from '../core/dataManager';

interface SlotItem {
  slot: Slot;
  index: number;
  file: TFile | null;
}

export class QuickMenu extends Modal {
  private slots: Slot[] = [];
  private activeWorkspace: Workspace | null = null;
  private selectedIndex: number = 0;
  private slotElements: HTMLElement[] = [];

  constructor(
    app: App,
    private slotManager: SlotManager,
    private workspaceManager: WorkspaceManager,
    private dataManager: DataManager,
    private notice: Notice
  ) {
    super(app);
  }

  onOpen(): void {
    super.onOpen();
    this.refreshData();
    this.display();
    this.setupKeyboardHandlers();
    // Auto-select first item
    if (this.slots.length > 0) {
      this.selectedIndex = 0;
      this.updateSelection();
    }
  }

  private refreshData(): void {
    this.slots = this.slotManager.getSlots();
    this.activeWorkspace = this.workspaceManager.getActiveWorkspace();
    console.log(
      'Geff: QuickMenu refreshData - slots count:',
      this.slots.length
    );
    console.log(
      'Geff: QuickMenu refreshData - active workspace:',
      this.activeWorkspace?.name || 'null'
    );
  }

  private display(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.slotElements = [];

    // Slots container
    const slotsContainer = contentEl.createDiv({ cls: 'geff-slots-container' });

    if (this.slots.length === 0) {
      slotsContainer.createEl('p', {
        text: 'No slots available. Add a note to get started.',
        cls: 'geff-empty-message',
      });
      return;
    }

    // Create slot items
    this.slots.forEach((slot, index) => {
      const file = this.app.vault.getAbstractFileByPath(slot.notePath);
      const slotItem: SlotItem = {
        slot,
        index,
        file: file instanceof TFile ? file : null,
      };

      const slotEl = this.createSlotItem(slotsContainer, slotItem);
      this.slotElements.push(slotEl);
    });

    // Add some basic styling
    this.addStyles();
  }

  private truncatePath(path: string, maxLength: number = 50): string {
    if (path.length <= maxLength) {
      return path;
    }

    // Split path by directories
    const parts = path.split('/');

    // If path has more than 2 parts, truncate middle parts
    if (parts.length > 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      return `${first}/../${last}`;
    }

    // For simple paths, just truncate with ellipsis
    return path.substring(0, maxLength - 3) + '...';
  }

  private createSlotItem(
    container: HTMLElement,
    slotItem: SlotItem
  ): HTMLElement {
    const { slot, index, file } = slotItem;

    const slotEl = container.createDiv({ cls: 'geff-slot-item' });

    // Note path (main content)
    const pathEl = slotEl.createDiv({ cls: 'geff-slot-path' });

    const displayPath = this.truncatePath(slot.notePath);

    if (file) {
      pathEl.textContent = displayPath;
      pathEl.addClass('geff-slot-valid');
    } else {
      pathEl.textContent = `${displayPath} (missing)`;
      pathEl.addClass('geff-slot-missing');
    }

    // Click handler
    slotEl.addEventListener('click', async () => {
      try {
        await this.slotManager.gotoSlot(index);
        this.close();
      } catch (error) {
        this.notice.showError(
          error instanceof Error ? error.message : String(error)
        );
      }
    });

    // Hover effect
    slotEl.addEventListener('mouseenter', () => {
      slotEl.addClass('geff-slot-hover');
    });

    slotEl.addEventListener('mouseleave', () => {
      slotEl.removeClass('geff-slot-hover');
    });

    return slotEl;
  }

  private addStyles(): void {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .geff-quick-menu-title {
        text-align: center;
        margin-bottom: 20px;
        color: var(--text-normal);
        font-weight: 600;
      }
      
      .geff-slots-container {
        max-height: 400px;
        overflow-y: auto;
      }
      
      .geff-slot-item {
        padding: 12px 16px;
        margin: 4px 0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid var(--background-modifier-border);
      }
      
      .geff-slot-item:hover {
        background-color: var(--background-modifier-hover);
        border-color: var(--interactive-accent);
      }
      
      .geff-slot-selected {
        background-color: var(--interactive-accent);
        border-color: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      .geff-slot-selected .geff-slot-path {
        color: var(--text-on-accent);
      }
      
      .geff-slot-path {
        font-family: var(--font-monospace);
        font-size: 0.9em;
        word-break: break-all;
      }
      
      .geff-slot-valid {
        color: var(--text-normal);
      }
      
      .geff-slot-missing {
        color: var(--text-muted);
        font-style: italic;
      }
      
      .geff-empty-message {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 20px;
      }
      
      /* Center the modal */
      .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin: 0 !important;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
      }
      
      .modal-content {
        max-height: 80vh;
        overflow-y: auto;
      }
    `;

    document.head.appendChild(styleEl);
  }

  private setupKeyboardHandlers(): void {
    const settings = this.dataManager.getSettings();
    const hotkeys = settings.hotkeys;

    // Enter key
    this.scope.register([], 'Enter', () => {
      this.handleEnter();
      return false;
    });

    // Navigation hotkeys
    this.registerHotkey(hotkeys['quick-menu-down'], () =>
      this.moveSelectionDown()
    );
    this.registerHotkey(hotkeys['quick-menu-up'], () => this.moveSelectionUp());

    // Action hotkeys
    this.registerHotkey(hotkeys['quick-menu-horizontal'], () =>
      this.openHorizontalSplit()
    );
    this.registerHotkey(hotkeys['quick-menu-vertical'], () =>
      this.openVerticalSplit()
    );
    this.registerHotkey(hotkeys['quick-menu-new-tab'], () => this.openNewTab());

    // Arrow keys for navigation (fallback)
    this.scope.register([], 'ArrowDown', () => {
      this.moveSelectionDown();
      return false;
    });

    this.scope.register([], 'ArrowUp', () => {
      this.moveSelectionUp();
      return false;
    });
  }

  private registerHotkey(hotkey: string, callback: () => void): void {
    if (!hotkey) return;

    const parts = hotkey.toLowerCase().split('+');
    const modifiers: ('Ctrl' | 'Alt' | 'Shift' | 'Meta')[] = [];
    let key = '';

    parts.forEach((part) => {
      switch (part) {
        case 'ctrl':
          modifiers.push('Ctrl');
          break;
        case 'alt':
          modifiers.push('Alt');
          break;
        case 'shift':
          modifiers.push('Shift');
          break;
        case 'meta':
          modifiers.push('Meta');
          break;
        default:
          key = part;
          break;
      }
    });

    if (key) {
      this.scope.register(modifiers, key, () => {
        callback();
        return false;
      });
    }
  }

  private updateSelection(): void {
    // Remove previous selection
    this.slotElements.forEach((el, index) => {
      el.toggleClass('geff-slot-selected', index === this.selectedIndex);
    });

    // Scroll selected item into view
    if (this.slotElements[this.selectedIndex]) {
      this.slotElements[this.selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  private moveSelectionDown(): void {
    if (this.slots.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.slots.length;
    this.updateSelection();
  }

  private moveSelectionUp(): void {
    if (this.slots.length === 0) return;
    this.selectedIndex =
      this.selectedIndex === 0 ? this.slots.length - 1 : this.selectedIndex - 1;
    this.updateSelection();
  }

  private async handleEnter(): Promise<void> {
    if (this.slots.length === 0) return;

    try {
      await this.slotManager.gotoSlot(this.selectedIndex);
      this.close();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async openHorizontalSplit(): Promise<void> {
    if (this.slots.length === 0) return;

    const slot = this.slots[this.selectedIndex];
    const file = this.app.vault.getAbstractFileByPath(slot.notePath);

    if (file instanceof TFile) {
      // Open in horizontal split
      this.app.workspace.getLeaf('split').openFile(file);
      this.close();
    } else {
      this.notice.showError(`File not found: ${slot.notePath}`);
    }
  }

  private async openVerticalSplit(): Promise<void> {
    if (this.slots.length === 0) return;

    const slot = this.slots[this.selectedIndex];
    const file = this.app.vault.getAbstractFileByPath(slot.notePath);

    if (file instanceof TFile) {
      // Open in vertical split (new pane)
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
      this.close();
    } else {
      this.notice.showError(`File not found: ${slot.notePath}`);
    }
  }

  private async openNewTab(): Promise<void> {
    if (this.slots.length === 0) return;

    const slot = this.slots[this.selectedIndex];
    const file = this.app.vault.getAbstractFileByPath(slot.notePath);

    if (file instanceof TFile) {
      // Open in new tab
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file);
      this.close();
    } else {
      this.notice.showError(`File not found: ${slot.notePath}`);
    }
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.slotElements = [];
  }
}
