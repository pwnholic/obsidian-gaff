import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TAbstractFile,
  Notice,
  Modal,
  SuggestModal,
  moment,
} from "obsidian";

// ----------------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------------

type OpenMode = "replace" | "split" | "split-horizontal" | "tab";

interface ModalKeybindings {
  down: string[];
  up: string[];
  open: string[];
  openVertical: string[];
  openHorizontal: string[];
  openTab: string[];
  remove: string[];
  swapDown: string[];
  swapUp: string[];
  close: string[];
}

interface GaffSettings {
  defaultWorkspace: string;
  maxHooks: number;
  showFolderPath: boolean;
  dynamicPin: "none" | "daily" | "inbox" | "custom";
  customDynamicPinPath: string;
  modalKeybindings: ModalKeybindings;
  workspaces: Record<string, string[]>;
  activeWorkspace: string;
}

const DEFAULT_SETTINGS: GaffSettings = {
  defaultWorkspace: "default",
  maxHooks: 9,
  showFolderPath: false,
  dynamicPin: "none",
  customDynamicPinPath: "_journal/YYYY/MMMM/DD.md",
  modalKeybindings: {
    down: ["j", "ArrowDown"],
    up: ["k", "ArrowUp"],
    open: ["Enter"],
    openVertical: ["Ctrl+v", "Cmd+v"],
    openHorizontal: ["Ctrl+h", "Cmd+h"],
    openTab: ["Ctrl+t", "Cmd+t"],
    remove: ["dd"],
    swapDown: ["Shift+J"],
    swapUp: ["Shift+K"],
    close: ["Escape", "q"],
  },
  workspaces: {
    default: [],
  },
  activeWorkspace: "default",
};

// ----------------------------------------------------------------------------
// Plugin Class
// ----------------------------------------------------------------------------

export default class GaffPlugin extends Plugin {
  settings: GaffSettings;
  statusBarItemEl: HTMLElement;

  async onload() {
    await this.loadSettings();

    if (!this.settings.workspaces[this.settings.activeWorkspace]) {
      this.settings.workspaces[this.settings.activeWorkspace] = [];
    }

    this.addSettingTab(new GaffSettingTab(this.app, this));

    this.statusBarItemEl = this.addStatusBarItem();
    this.updateStatusBar();

    this.addCommand({
      id: "gaff-add-remove-active",
      name: "Add/Remove Active File",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          if (!checking) this.toggleFileInGaff(activeFile);
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "gaff-open-menu",
      name: "Open Menu",
      callback: () => new GaffModal(this.app, this).open(),
    });

    for (let i = 1; i <= 9; i++) {
      this.addCommand({
        id: `gaff-go-to-file-${i}`,
        name: `Go to File ${i}`,
        callback: () => this.goToFile(i),
      });
    }

    this.addCommand({
      id: "gaff-switch-workspace",
      name: "Switch Workspace",
      callback: () => new WorkspaceSuggestModal(this.app, this).open(),
    });

    this.addCommand({
      id: "gaff-clear-workspace",
      name: "Clear Current Workspace",
      callback: async () => {
        this.settings.workspaces[this.settings.activeWorkspace] = [];
        await this.saveSettings();
        new Notice(`Workspace '${this.settings.activeWorkspace}' cleared!`);
      },
    });

    this.addCommand({
      id: "gaff-delete-workspace",
      name: "Delete Current Workspace",
      callback: async () => {
        const wsToDelete = this.settings.activeWorkspace;
        if (wsToDelete === "default") {
          new Notice("Cannot delete the 'default' workspace. You can only clear it.");
          return;
        }
        delete this.settings.workspaces[wsToDelete];
        this.settings.activeWorkspace = "default";
        await this.saveSettings();
        new Notice(`Workspace '${wsToDelete}' deleted! Switched to 'default'.`);
      },
    });

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.handleFileRename(file, oldPath)),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => this.handleFileDelete(file)),
    );
  }

  onunload() {}

  async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

    // Deep merge modalKeybindings so new keys don't end up undefined from old data.json
    if (loadedData?.modalKeybindings) {
      this.settings.modalKeybindings = Object.assign(
        {},
        DEFAULT_SETTINGS.modalKeybindings,
        loadedData.modalKeybindings,
      );
    }

    // Migrate legacy openSplit to openVertical
    if (loadedData?.modalKeybindings?.openSplit && !loadedData?.modalKeybindings?.openVertical) {
      this.settings.modalKeybindings.openVertical = loadedData.modalKeybindings.openSplit;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStatusBar();
  }

  updateStatusBar() {
    if (this.statusBarItemEl) {
      this.statusBarItemEl.setText(`[${this.settings.activeWorkspace}]`);
    }
  }

  // ----------------------------------------------------------------------------
  // Core Logic
  // ----------------------------------------------------------------------------

  getDynamicPinPath(): string | null {
    switch (this.settings.dynamicPin) {
      case "daily":
        return `_journal/${moment().format("YYYY/MMMM/DD")}.md`;
      case "custom":
        return moment().format(this.settings.customDynamicPinPath);
      case "inbox": {
        const inboxFiles = this.app.vault
          .getFiles()
          .filter((f) => f.path.startsWith("_inbox/") && f.extension === "md");
        if (inboxFiles.length > 0) {
          inboxFiles.sort((a, b) => b.stat.mtime - a.stat.mtime);
          return inboxFiles[0].path;
        }
        return null;
      }
      default:
        return null;
    }
  }

  async toggleFileInGaff(file: TFile) {
    const ws = this.settings.workspaces[this.settings.activeWorkspace] || [];
    const idx = ws.indexOf(file.path);

    if (idx > -1) {
      ws.splice(idx, 1);
      new Notice(`Removed: ${file.basename}`);
    } else {
      if (ws.length >= this.settings.maxHooks) {
        new Notice(`Gaff full! (Max ${this.settings.maxHooks})`);
        return;
      }
      ws.push(file.path);
      new Notice(`Gaffed: ${file.basename}`);
    }

    this.settings.workspaces[this.settings.activeWorkspace] = ws;
    await this.saveSettings();
  }

  async goToFile(index: number) {
    const ws = this.settings.workspaces[this.settings.activeWorkspace] || [];
    let targetPath: string | null = null;

    if (this.settings.dynamicPin !== "none") {
      targetPath = index === 1 ? this.getDynamicPinPath() : ws[index - 2];
    } else {
      targetPath = ws[index - 1];
    }

    if (!targetPath) {
      new Notice(`Slot ${index} is empty`);
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(targetPath);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf(false).openFile(file);
    } else if (index === 1 && this.settings.dynamicPin !== "none") {
      this.createAndOpenFile(targetPath);
    } else {
      new Notice(`File not found: ${targetPath}`);
    }
  }

  async createAndOpenFile(path: string) {
    const parts = path.split("/");
    const folderPath = parts.slice(0, -1).join("/");

    if (folderPath) {
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      if (!folder) {
        await this.app.vault.createFolder(folderPath);
      }
    }

    const file = await this.app.vault.create(path, "");
    await this.app.workspace.getLeaf(false).openFile(file);
    new Notice(`Created: ${path}`);
  }

  // ----------------------------------------------------------------------------
  // Vault Event Handlers
  // ----------------------------------------------------------------------------

  async handleFileRename(file: TAbstractFile, oldPath: string) {
    let changed = false;
    for (const files of Object.values(this.settings.workspaces)) {
      const idx = files.indexOf(oldPath);
      if (idx > -1) {
        files[idx] = file.path;
        changed = true;
      }
    }
    if (changed) await this.saveSettings();
  }

  async handleFileDelete(file: TAbstractFile) {
    let changed = false;
    for (const files of Object.values(this.settings.workspaces)) {
      const idx = files.indexOf(file.path);
      if (idx > -1) {
        files.splice(idx, 1);
        changed = true;
      }
    }
    if (changed) await this.saveSettings();
  }
}

// ----------------------------------------------------------------------------
// Workspace Suggest Modal
// ----------------------------------------------------------------------------

class WorkspaceSuggestModal extends SuggestModal<string> {
  plugin: GaffPlugin;

  constructor(app: App, plugin: GaffPlugin) {
    super(app);
    this.plugin = plugin;
    this.setPlaceholder("Switch or Create Workspace...");
  }

  getSuggestions(query: string): string[] {
    const workspaces = Object.keys(this.plugin.settings.workspaces);
    const match = query.toLowerCase();
    const suggestions = workspaces.filter((w) => w.toLowerCase().includes(match));

    if (query && !workspaces.includes(query)) {
      suggestions.unshift(`Create new: ${query}`);
    }
    return suggestions;
  }

  renderSuggestion(value: string, el: HTMLElement) {
    const isCreate = value.startsWith("Create new: ");
    el.createEl("div", { text: isCreate ? value : `${value}` });
    if (value === this.plugin.settings.activeWorkspace) {
      el.addClass("gaff-workspace-active");
    }
  }

  async onChooseSuggestion(item: string) {
    let targetWs = item;
    if (item.startsWith("Create new: ")) {
      targetWs = item.replace("Create new: ", "");
      this.plugin.settings.workspaces[targetWs] = [];
      new Notice(`Created new workspace: ${targetWs}`);
    }

    this.plugin.settings.activeWorkspace = targetWs;
    await this.plugin.saveSettings();
    new Notice(`Switched to workspace: ${targetWs}`);
  }
}

// ----------------------------------------------------------------------------
// Gaff UI Modal
// ----------------------------------------------------------------------------

interface DisplayItem {
  path: string;
  isDynamic: boolean;
}

class GaffModal extends Modal {
  plugin: GaffPlugin;
  selectedIndex: number = 0;
  keyBuffer: string = "";
  bufferTimeout: ReturnType<typeof setTimeout> | null = null;
  boundKeydown: (e: KeyboardEvent) => void;

  constructor(app: App, plugin: GaffPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    // Restore selection to currently active file
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      const list = this.getDisplayList();
      const idx = list.findIndex((item) => item.path === activeFile.path);
      if (idx > -1) this.selectedIndex = idx;
    }

    this.renderUI();
    this.boundKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.boundKeydown, true);
  }

  onClose() {
    document.removeEventListener("keydown", this.boundKeydown, true);
    this.contentEl.empty();
  }

  // ----------------------------------------------------------------------------
  // Keyboard Handling
  // ----------------------------------------------------------------------------

  private normalizeKeyEvent(e: KeyboardEvent): string {
    let key = e.key.toLowerCase();
    if (key === " ") key = "space";

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.metaKey) parts.push("cmd");
    if (e.altKey) parts.push("alt");
    if (e.shiftKey) parts.push("shift");
    parts.push(key);

    return parts.join("+");
  }

  handleKeydown(e: KeyboardEvent) {
    const kb = this.plugin.settings.modalKeybindings;
    const fullKey = this.normalizeKeyEvent(e);

    const match = (binding: string[]) =>
      binding.some((b) => b.toLowerCase() === fullKey);

    const consume = () => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (match(kb.close)) { this.close(); consume(); return; }
    if (match(kb.down)) { this.navigate(1); consume(); return; }
    if (match(kb.up)) { this.navigate(-1); consume(); return; }
    if (match(kb.open)) { this.openSelected("replace"); consume(); return; }
    if (match(kb.openVertical)) { this.openSelected("split"); consume(); return; }
    if (match(kb.openHorizontal)) { this.openSelected("split-horizontal"); consume(); return; }
    if (match(kb.openTab)) { this.openSelected("tab"); consume(); return; }
    if (match(kb.swapDown)) { this.swap(1); consume(); return; }
    if (match(kb.swapUp)) { this.swap(-1); consume(); return; }

    // Sequence matching (e.g. dd) — only for unmodified keys
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      this.keyBuffer += e.key.toLowerCase();

      for (const seq of kb.remove) {
        if (this.keyBuffer.endsWith(seq.toLowerCase())) {
          this.removeSelected();
          this.keyBuffer = "";
          consume();
          return;
        }
      }

      const isPartial = kb.remove.some((seq) =>
        seq.toLowerCase().startsWith(this.keyBuffer),
      );
      if (isPartial) consume();

      if (this.bufferTimeout) clearTimeout(this.bufferTimeout);
      this.bufferTimeout = setTimeout(() => { this.keyBuffer = ""; }, 500);
    }
  }

  // ----------------------------------------------------------------------------
  // Display List
  // ----------------------------------------------------------------------------

  getDisplayList(): DisplayItem[] {
    const wsFiles = this.plugin.settings.workspaces[this.plugin.settings.activeWorkspace] || [];
    const list: DisplayItem[] = [];

    if (this.plugin.settings.dynamicPin !== "none") {
      const dynPath = this.plugin.getDynamicPinPath();
      list.push({
        path: dynPath || "(Dynamic slot empty)",
        isDynamic: true,
      });
    }

    for (const p of wsFiles) {
      list.push({ path: p, isDynamic: false });
    }

    return list;
  }

  // ----------------------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------------------

  renderUI() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("gaff-modal");

    contentEl.createEl("div", {
      cls: "gaff-modal-header",
      text: `Workspace: ${this.plugin.settings.activeWorkspace}`,
    });

    const displayList = this.getDisplayList();

    if (displayList.length === 0) {
      contentEl.createEl("p", {
        cls: "gaff-modal-empty",
        text: "No files hooked. Use Add/Remove Active File command.",
      });
      return;
    }

    const listEl = contentEl.createEl("div", { cls: "gaff-modal-list" });

    displayList.forEach((item, index) => {
      const itemEl = listEl.createEl("div", { cls: "gaff-modal-item" });
      if (index === this.selectedIndex) {
        itemEl.addClass("gaff-modal-item--selected");
      }

      const indexCls = item.isDynamic
        ? "gaff-modal-item__index gaff-modal-item__index--dynamic"
        : "gaff-modal-item__index";
      itemEl.createEl("span", { cls: indexCls, text: `${index + 1}` });

      const infoEl = itemEl.createEl("div", { cls: "gaff-modal-item__info" });

      const pathParts = item.path.split("/");
      const fileName = pathParts.pop() || item.path;
      const folderPath = pathParts.join("/");

      const nameEl = infoEl.createEl("span", {
        cls: "gaff-modal-item__name",
        text: fileName,
      });

      if (item.isDynamic) {
        nameEl.createEl("span", {
          cls: "gaff-modal-item__dynamic-tag",
          text: ` [${this.plugin.settings.dynamicPin}]`,
        });
      }

      if (this.plugin.settings.showFolderPath && folderPath) {
        infoEl.createEl("span", {
          cls: "gaff-modal-item__path",
          text: `${folderPath}/`,
        });
      }

      itemEl.addEventListener("click", () => {
        this.selectedIndex = index;
        this.openSelected("replace");
      });

      itemEl.addEventListener("auxclick", (e) => {
        if (e.button === 1) {
          this.selectedIndex = index;
          this.openSelected("tab");
        }
      });
    });

    const kb = this.plugin.settings.modalKeybindings;
    const footerEl = contentEl.createEl("div", { cls: "gaff-modal-footer" });
    footerEl.innerHTML = [
      `<code>${kb.down[0]}/${kb.up[0]}</code> move`,
      `<code>${kb.open[0]}</code> open`,
      `<code>${kb.remove[0]}</code> remove`,
      `<code>${kb.swapDown[0]}/${kb.swapUp[0]}</code> swap`,
    ].join(" · ");
  }

  // ----------------------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------------------

  navigate(direction: number) {
    const list = this.getDisplayList();
    if (list.length === 0) return;

    this.selectedIndex = (this.selectedIndex + direction + list.length) % list.length;
    this.renderUI();
  }

  async swap(direction: number) {
    const list = this.getDisplayList();
    if (list.length <= 1) return;

    const current = list[this.selectedIndex];
    const newIndex = this.selectedIndex + direction;
    if (newIndex < 0 || newIndex >= list.length) return;

    const target = list[newIndex];
    if (current.isDynamic || target.isDynamic) return;

    const offset = this.plugin.settings.dynamicPin !== "none" ? 1 : 0;
    const wsIdx1 = this.selectedIndex - offset;
    const wsIdx2 = newIndex - offset;

    const wsFiles = this.plugin.settings.workspaces[this.plugin.settings.activeWorkspace] || [];
    [wsFiles[wsIdx1], wsFiles[wsIdx2]] = [wsFiles[wsIdx2], wsFiles[wsIdx1]];

    this.plugin.settings.workspaces[this.plugin.settings.activeWorkspace] = wsFiles;
    await this.plugin.saveSettings();

    this.selectedIndex = newIndex;
    this.renderUI();
  }

  async removeSelected() {
    const list = this.getDisplayList();
    if (list.length === 0) return;

    const item = list[this.selectedIndex];
    if (item.isDynamic) {
      new Notice("Cannot remove dynamic pinned slot.");
      return;
    }

    const offset = this.plugin.settings.dynamicPin !== "none" ? 1 : 0;
    const wsIdx = this.selectedIndex - offset;

    const wsFiles = this.plugin.settings.workspaces[this.plugin.settings.activeWorkspace] || [];
    wsFiles.splice(wsIdx, 1);

    this.plugin.settings.workspaces[this.plugin.settings.activeWorkspace] = wsFiles;
    await this.plugin.saveSettings();

    const newList = this.getDisplayList();
    if (this.selectedIndex >= newList.length) {
      this.selectedIndex = Math.max(0, newList.length - 1);
    }

    this.renderUI();
  }

  async openSelected(mode: OpenMode) {
    const list = this.getDisplayList();
    if (this.selectedIndex < 0 || this.selectedIndex >= list.length) return;

    const path = list[this.selectedIndex].path;
    const file = this.plugin.app.vault.getAbstractFileByPath(path);

    if (file instanceof TFile) {
      this.close();

      let leaf;
      switch (mode) {
        case "split":
          leaf = this.plugin.app.workspace.getLeaf("split");
          break;
        case "split-horizontal":
          leaf = this.plugin.app.workspace.getLeaf("split", "horizontal");
          break;
        case "tab":
          leaf = this.plugin.app.workspace.getLeaf("tab");
          break;
        default:
          leaf = this.plugin.app.workspace.getLeaf(false);
      }

      await leaf.openFile(file);
    } else if (list[this.selectedIndex].isDynamic) {
      this.close();
      await this.plugin.createAndOpenFile(path);
    } else {
      new Notice(`File not found: ${path}`);
    }
  }
}

// ----------------------------------------------------------------------------
// Settings Tab
// ----------------------------------------------------------------------------

class GaffSettingTab extends PluginSettingTab {
  plugin: GaffPlugin;

  constructor(app: App, plugin: GaffPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Gaff Settings" });

    new Setting(containerEl)
      .setName("Max Hooked Files")
      .setDesc("Maximum number of files per workspace (1-9).")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.maxHooks)).onChange(async (value) => {
          const parsed = Math.min(9, Math.max(1, parseInt(value) || 1));
          this.plugin.settings.maxHooks = parsed;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Dynamic Pinned Slot")
      .setDesc("Pin a dynamic file to Slot 1 (pushes other files down).")
      .addDropdown((drop) =>
        drop
          .addOption("none", "None")
          .addOption("daily", "Today's Daily Note")
          .addOption("inbox", "Latest Inbox Note")
          .addOption("custom", "Custom Path Template")
          .setValue(this.plugin.settings.dynamicPin)
          .onChange(async (value: GaffSettings["dynamicPin"]) => {
            this.plugin.settings.dynamicPin = value;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    if (this.plugin.settings.dynamicPin === "custom") {
      new Setting(containerEl)
        .setName("Custom Dynamic Path")
        .setDesc("Moment.js date tokens supported (e.g. _journal/YYYY/MMMM/DD.md).")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.customDynamicPinPath)
            .onChange(async (value) => {
              this.plugin.settings.customDynamicPinPath = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    new Setting(containerEl)
      .setName("Show Folder Path")
      .setDesc("Show folder path in the modal below file names.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showFolderPath).onChange(async (value) => {
          this.plugin.settings.showFolderPath = value;
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl("h3", { text: "Modal Keybindings" });
    containerEl.createEl("p", {
      text: "Comma-separated keys for each action. Example: j, ArrowDown",
      cls: "setting-item-description",
    });

    const keybindingEntries: [string, keyof ModalKeybindings][] = [
      ["Move Down", "down"],
      ["Move Up", "up"],
      ["Open File", "open"],
      ["Open Vertical Split", "openVertical"],
      ["Open Horizontal Split", "openHorizontal"],
      ["Open New Tab", "openTab"],
      ["Remove File", "remove"],
      ["Swap Down", "swapDown"],
      ["Swap Up", "swapUp"],
      ["Close Modal", "close"],
    ];

    for (const [name, key] of keybindingEntries) {
      new Setting(containerEl).setName(name).addText((text) =>
        text
          .setValue(this.plugin.settings.modalKeybindings[key].join(", "))
          .onChange(async (value) => {
            this.plugin.settings.modalKeybindings[key] = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "");
            await this.plugin.saveSettings();
          }),
      );
    }
  }
}
