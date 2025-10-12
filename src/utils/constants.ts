import { DEFAULT_SETTINGS, DEFAULT_HOTKEYS } from '../types/geff';

export { DEFAULT_SETTINGS, DEFAULT_HOTKEYS };

export const DEFAULT_WORKSPACE_NAME = 'Default Workspace';
export const SCHEMA_VERSION = 1;
export const BACKUP_PREFIX = 'geff_backup_';

export const SLOT_HOTKEYS = {
  1: 'Ctrl+1',
  2: 'Ctrl+2',
  3: 'Ctrl+3',
  4: 'Ctrl+4',
  5: 'Ctrl+5',
  6: 'Ctrl+6',
  7: 'Ctrl+7',
  8: 'Ctrl+8',
  9: 'Ctrl+9',
};

export const I18N = {
  en: {
    addCurrentNote: 'Add Current Note',
    removeNote: 'Remove Note',
    openQuickMenu: 'Open Quick Menu',
    createWorkspace: 'Create Workspace',
    renameWorkspace: 'Rename Workspace',
    deleteWorkspace: 'Delete Workspace',
    switchWorkspace: 'Switch Workspace',
    exportWorkspace: 'Export Workspace',
    importWorkspace: 'Import Workspace',
    gotoSlot: 'Go to Slot',
    workspaceActive: 'Workspace: {name}',
    slotCount: '{count} slots',
    noteAdded: 'Note added to slot {slot}',
    noteRemoved: 'Note removed from slot {slot}',
    workspaceCreated: 'Workspace "{name}" created',
    workspaceRenamed: 'Workspace renamed to "{name}"',
    workspaceDeleted: 'Workspace "{name}" deleted',
    workspaceSwitched: 'Switched to workspace "{name}"',
    confirmDelete: 'Are you sure you want to delete this?',
    fileMissing: 'File not found: {path}',
    invalidData: 'Invalid data format',
    backupCreated: 'Backup created',
    dataRestored: 'Data restored from backup',
  },
  id: {
    addCurrentNote: 'Tambah Catatan Aktif',
    removeNote: 'Hapus Catatan',
    openQuickMenu: 'Buka Menu Cepat',
    createWorkspace: 'Buat Workspace',
    renameWorkspace: 'Rename Workspace',
    deleteWorkspace: 'Hapus Workspace',
    switchWorkspace: 'Ganti Workspace',
    exportWorkspace: 'Ekspor Workspace',
    importWorkspace: 'Impor Workspace',
    gotoSlot: 'Go ke Slot',
    workspaceActive: 'Workspace: {name}',
    slotCount: '{count} slot',
    noteAdded: 'Catatan ditambahkan ke slot {slot}',
    noteRemoved: 'Catatan dihapus dari slot {slot}',
    workspaceCreated: 'Workspace "{name}" dibuat',
    workspaceRenamed: 'Workspace di-rename ke "{name}"',
    workspaceDeleted: 'Workspace "{name}" dihapus',
    workspaceSwitched: 'Beralih ke workspace "{name}"',
    confirmDelete: 'Apakah Anda yakin ingin menghapus ini?',
    fileMissing: 'File tidak ditemukan: {path}',
    invalidData: 'Format data tidak valid',
    backupCreated: 'Backup dibuat',
    dataRestored: 'Data dipulihkan dari backup',
  },
};
