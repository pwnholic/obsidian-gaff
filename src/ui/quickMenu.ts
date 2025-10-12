import { App, Modal, TFile } from 'obsidian';
import { Slot, Workspace } from '../types/geff';
import { SlotManager } from '../core/slotManager';
import { WorkspaceManager } from '../core/workspaceManager';
import { Notice } from './notice';

interface SlotItem {
  slot: Slot;
  index: number;
  file: TFile | null;
}

export class QuickMenu extends Modal {
  private slots: Slot[] = [];
  private activeWorkspace: Workspace | null = null;

  constructor(
    app: App,
    private slotManager: SlotManager,
    private workspaceManager: WorkspaceManager,
    private notice: Notice
  ) {
    super(app);
  }

  onOpen(): void {
    super.onOpen();
    this.refreshData();
    this.display();
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

    // Title
    contentEl.createEl('h2', {
      text: this.activeWorkspace
        ? `${this.activeWorkspace.name} Slots`
        : 'Quick Menu',
      cls: 'geff-quick-menu-title',
    });

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

      this.createSlotItem(slotsContainer, slotItem);
    });

    // Add some basic styling
    this.addStyles();
  }

  private createSlotItem(container: HTMLElement, slotItem: SlotItem): void {
    const { slot, index, file } = slotItem;

    const slotEl = container.createDiv({ cls: 'geff-slot-item' });

    // Note path (main content)
    const pathEl = slotEl.createDiv({ cls: 'geff-slot-path' });

    if (file) {
      pathEl.textContent = slot.notePath;
      pathEl.addClass('geff-slot-valid');
    } else {
      pathEl.textContent = `${slot.notePath} (missing)`;
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

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
