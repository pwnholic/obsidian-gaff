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
};
