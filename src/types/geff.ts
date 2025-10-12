import { Workspace } from './workspace';

export interface GeffData {
  schemaVersion: number;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  updatedAt?: string;
}

export interface GeffSettings {
  autoRemoveMissing: boolean;
  autoBackup: boolean;
  dataPath: string;
  uiTheme: 'default' | 'compact' | 'minimal';
  language: 'en' | 'id';
  maxSlots: number;
  notifications: boolean;
  confirmDelete: boolean;
  hotkeys: {
    'quick-menu-down': string;
    'quick-menu-up': string;
    'quick-menu-horizontal': string;
    'quick-menu-vertical': string;
    'quick-menu-new-tab': string;
  };
}

export interface GeffPluginData {
  settings: GeffSettings;
  data: GeffData;
}

export type CommandId =
  | 'add-current-note'
  | 'remove-note'
  | 'open-quick-menu'
  | 'goto-slot'
  | 'create-workspace'
  | 'rename-workspace'
  | 'delete-workspace'
  | 'select-workspace'
  | 'export-workspace'
  | 'import-workspace';

export interface HotkeyMapping {
  [key: string]: string;
}

// Re-export types from workspace for convenience
export type { Slot, Workspace } from './workspace';

export const DEFAULT_SETTINGS: GeffSettings = {
  autoRemoveMissing: true,
  autoBackup: false,
  dataPath: 'geff_data.json',
  uiTheme: 'default',
  language: 'en',
  maxSlots: 9,
  notifications: true,
  confirmDelete: true,
  hotkeys: {
    'quick-menu-down': 'Alt+J',
    'quick-menu-up': 'Alt+K',
    'quick-menu-horizontal': 'Ctrl+H',
    'quick-menu-vertical': 'Ctrl+V',
    'quick-menu-new-tab': 'Ctrl+T',
  },
};

export const DEFAULT_HOTKEYS = {
  'add-current-note': 'Ctrl+Shift+A',
  'remove-note': 'Ctrl+Shift+R',
  'open-quick-menu': 'Ctrl+E',
  'create-workspace': 'Ctrl+Shift+N',
  'rename-workspace': 'Ctrl+Shift+M',
  'delete-workspace': 'Ctrl+Shift+D',
  'export-workspace': 'Ctrl+Shift+X',
  'import-workspace': 'Ctrl+Shift+I',
  'quick-menu-down': 'Alt+J',
  'quick-menu-up': 'Alt+K',
  'quick-menu-horizontal': 'Ctrl+H',
  'quick-menu-vertical': 'Ctrl+V',
  'quick-menu-new-tab': 'Ctrl+T',
};
