import { App, SuggestModal, TFile } from 'obsidian';
import { Slot, Workspace } from '../types/geff';
import { SlotManager } from '../core/slotManager';
import { WorkspaceManager } from '../core/workspaceManager';
import { Notice } from './notice';
// import { KeyboardUtils } from '../utils/keyboard';

interface SlotSuggestion {
  slot: Slot;
  index: number;
  file: TFile | null;
}

export class QuickMenu extends SuggestModal<SlotSuggestion> {
  private slots: Slot[] = [];
  private activeWorkspace: Workspace | null = null;

  constructor(
    app: App,
    private slotManager: SlotManager,
    private workspaceManager: WorkspaceManager,
    private notice: Notice
  ) {
    super(app);
    this.setPlaceholder(
      'Type to search slots or use arrow keys to navigate...'
    );
    this.setupKeyboardHandlers();
  }

  open(): void {
    this.refreshData();
    super.open();
  }

  onOpen(): void {
    super.onOpen();
    this.refreshData();
  }

  private refreshData(): void {
    this.slots = this.slotManager.getSlots();
    this.activeWorkspace = this.workspaceManager.getActiveWorkspace();
  }

  // Returns all available suggestions.
  getSuggestions(query: string): SlotSuggestion[] {
    const suggestions: SlotSuggestion[] = [];

    this.slots.forEach((slot, index) => {
      const file = this.app.vault.getAbstractFileByPath(
        slot.notePath
      ) as TFile | null;
      const fileName = file?.basename || slot.notePath;

      // Filter by query
      if (query && !fileName.toLowerCase().includes(query.toLowerCase())) {
        return;
      }

      suggestions.push({
        slot,
        index,
        file,
      });
    });

    return suggestions;
  }

  // Renders each suggestion item.
  renderSuggestion(suggestion: SlotSuggestion, el: HTMLElement): void {
    const { slot, index, file } = suggestion;

    const container = el.createDiv({ cls: 'geff-suggestion' });
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.padding = '8px 12px';
    container.style.gap = '12px';

    // Slot number
    const slotNumber = container.createSpan({ cls: 'geff-slot-number' });
    slotNumber.textContent = `${index + 1}.`;
    slotNumber.style.fontWeight = 'bold';
    slotNumber.style.color = 'var(--text-accent)';
    slotNumber.style.minWidth = '20px';

    // File info
    const fileInfo = container.createDiv({ cls: 'geff-file-info' });
    fileInfo.style.flex = '1';

    const fileName = fileInfo.createDiv({ cls: 'geff-file-name' });
    fileName.textContent = file?.basename || slot.notePath;
    fileName.style.fontWeight = '500';

    if (file?.path) {
      const filePath = fileInfo.createDiv({ cls: 'geff-file-path' });
      filePath.textContent = file.path;
      filePath.style.fontSize = '0.8em';
      filePath.style.color = 'var(--text-muted)';
    }

    // Status indicator
    const status = container.createSpan({ cls: 'geff-status' });
    if (slot.isMissing || !file) {
      status.textContent = '[X]';
      status.setAttribute('title', 'File not found');
    } else {
      status.textContent = '[F]';
      status.setAttribute('title', 'File exists');
    }

    // Hover effect
    container.onmouseover = () => {
      container.style.backgroundColor = 'var(--background-modifier-hover)';
    };

    container.onmouseout = () => {
      container.style.backgroundColor = '';
    };
  }

  // Perform action on the selected suggestion.
  async onChooseSuggestion(
    suggestion: SlotSuggestion,
    _evt: MouseEvent | KeyboardEvent
  ): Promise<void> {
    try {
      await this.slotManager.gotoSlot(suggestion.index);
      this.notice.showSuccess(`Opened slot ${suggestion.index + 1}`, 3000);
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private setupKeyboardHandlers(): void {
    // Override default keyboard handling
    // this.scope.unregister();

    // Register custom key handlers
    this.scope.register([], '1', () => this.handleSlotKey(0));
    this.scope.register([], '2', () => this.handleSlotKey(1));
    this.scope.register([], '3', () => this.handleSlotKey(2));
    this.scope.register([], '4', () => this.handleSlotKey(3));
    this.scope.register([], '5', () => this.handleSlotKey(4));
    this.scope.register([], '6', () => this.handleSlotKey(5));
    this.scope.register([], '7', () => this.handleSlotKey(6));
    this.scope.register([], '8', () => this.handleSlotKey(7));
    this.scope.register([], '9', () => this.handleSlotKey(8));

    // Add current note to slot
    this.scope.register(['Shift'], 'a', () => this.handleAddCurrentNote());

    // Remove from slot
    this.scope.register(['Shift'], 'r', () => this.handleRemoveFromSlot());

    // Undo
    this.scope.register(['Shift'], 'u', () => this.handleUndo());
  }

  private handleSlotKey(slotIndex: number): boolean {
    if (slotIndex < this.slots.length) {
      this.close();
      this.slotManager.gotoSlot(slotIndex).catch((error) => {
        this.notice.showError(error.message);
      });
      return true;
    }
    return false;
  }

  private async handleAddCurrentNote(): Promise<void> {
    try {
      await this.slotManager.addCurrentNote();
      this.notice.showSuccess('Current note added to slot');
      this.refreshData();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleRemoveFromSlot(): Promise<void> {
    try {
      if (this.slots.length === 0) {
        this.notice.showError('No slots to remove');
        return;
      }

      await this.slotManager.removeNote(this.slots.length - 1);
      this.notice.showSuccess('Note removed from slot');
      this.refreshData();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async handleUndo(): Promise<void> {
    try {
      await this.slotManager.undoLastAction();
      this.notice.showSuccess('Action undone');
      this.refreshData();
    } catch (error) {
      this.notice.showError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private handleContextMenu(evt: {
    clientX: number;
    clientY: number;
    preventDefault: () => void;
  }): void {
    evt.preventDefault();

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'geff-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${evt.clientX}px`;
    menu.style.top = `${evt.clientY}px`;
    menu.style.backgroundColor = 'var(--background-primary)';
    menu.style.border = '1px solid var(--background-modifier-border)';
    menu.style.borderRadius = '4px';
    menu.style.padding = '4px 0';
    menu.style.zIndex = '1000';
    menu.style.boxShadow = 'var(--shadow-s)';

    const menuItems = [
      { text: 'Open', action: () => this.openSelectedSlot() },
      { text: 'Remove', action: () => this.removeSelectedSlot() },
      {
        text: 'Reveal in File Explorer',
        action: () => this.revealSelectedSlot(),
      },
    ];

    menuItems.forEach((item) => {
      const menuItem = menu.createDiv();
      menuItem.textContent = item.text;
      menuItem.style.padding = '8px 16px';
      menuItem.style.cursor = 'pointer';

      menuItem.onmouseover = () => {
        menuItem.style.backgroundColor = 'var(--background-modifier-hover)';
      };

      menuItem.onmouseout = () => {
        menuItem.style.backgroundColor = '';
      };

      menuItem.onclick = () => {
        item.action();
        document.body.removeChild(menu);
      };
    });

    document.body.appendChild(menu);

    // Close menu when clicking outside
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  private async openSelectedSlot(): Promise<void> {
    const selected = this.resultContainerEl.querySelector('.is-selected');
    if (selected) {
      const index = Array.from(this.resultContainerEl.children).indexOf(
        selected
      );
      if (index >= 0 && index < this.slots.length) {
        await this.slotManager.gotoSlot(index);
        this.close();
      }
    }
  }

  private async removeSelectedSlot(): Promise<void> {
    const selected = this.resultContainerEl.querySelector('.is-selected');
    if (selected) {
      const index = Array.from(this.resultContainerEl.children).indexOf(
        selected
      );
      if (index >= 0 && index < this.slots.length) {
        await this.slotManager.removeNote(index);
        this.refreshData();
      }
    }
  }

  private async revealSelectedSlot(): Promise<void> {
    const selected = this.resultContainerEl.querySelector('.is-selected');
    if (selected) {
      const index = Array.from(this.resultContainerEl.children).indexOf(
        selected
      );
      if (index >= 0 && index < this.slots.length) {
        const slot = this.slots[index];
        const file = this.app.vault.getAbstractFileByPath(slot.notePath);
        if (file) {
          // Reveal in file explorer (Obsidian API)
          // this.app.revealLeaf(file);
        }
      }
    }
  }
}
