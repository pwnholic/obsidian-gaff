import { App, Plugin } from 'obsidian';
import { WorkspaceManager } from '../core/workspaceManager';
import { SlotManager } from '../core/slotManager';

export class StatusBar {
  private statusBarEl: HTMLElement | null = null;

  constructor(
    private app: App,
    private plugin: Plugin,
    private workspaceManager: WorkspaceManager,
    private slotManager: SlotManager
  ) {}

  register(): void {
    this.statusBarEl = this.plugin.addStatusBarItem();
    this.update();
  }

  unregister(): void {
    if (this.statusBarEl) {
      this.statusBarEl.remove();
      this.statusBarEl = null;
    }
  }

  update(): void {
    if (!this.statusBarEl) return;

    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    const slots = this.slotManager.getSlots();

    let text = '';

    if (activeWorkspace) {
      text = `[W] ${activeWorkspace.name}`;
    } else {
      text = '[W] No Workspace';
    }

    if (slots.length > 0) {
      text += ` | [S] ${slots.length}`;
    }

    this.statusBarEl.textContent = text;
    this.statusBarEl.setAttribute('title', 'Click to open Quick Menu');

    // Add click handler
    this.statusBarEl.onclick = () => {
      this.app.workspace.trigger('geff:open-quick-menu');
    };

    // Add some basic styling
    this.statusBarEl.style.cursor = 'pointer';
    this.statusBarEl.style.padding = '0 8px';
  }

  setWorkspace(workspaceName: string): void {
    if (!this.statusBarEl) return;

    const slots = this.slotManager.getSlots();
    let text = `[W] ${workspaceName}`;

    if (slots.length > 0) {
      text += ` | [S] ${slots.length}`;
    }

    this.statusBarEl.textContent = text;
  }

  setSlotCount(count: number): void {
    if (!this.statusBarEl) return;

    const activeWorkspace = this.workspaceManager.getActiveWorkspace();
    let text = '';

    if (activeWorkspace) {
      text = `[W] ${activeWorkspace.name}`;
    } else {
      text = '[W] No Workspace';
    }

    if (count > 0) {
      text += ` | [S] ${count}`;
    }

    this.statusBarEl.textContent = text;
  }
}
