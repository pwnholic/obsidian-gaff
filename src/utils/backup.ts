import { App, TFile } from 'obsidian';
import { GeffData } from '../types/geff';
import { BACKUP_PREFIX, DATA_FILE } from './constants';

export class BackupUtils {
  constructor(private app: App) {}

  async createBackup(data: GeffData): Promise<string> {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const backupFileName = `${BACKUP_PREFIX}${date}_${time}.json`;

    try {
      // Check if file already exists and modify name if needed
      let finalFileName = backupFileName;
      let counter = 1;
      
      while (this.app.vault.getAbstractFileByPath(finalFileName)) {
        finalFileName = `${BACKUP_PREFIX}${date}_${time}_${counter}.json`;
        counter++;
      }

      const backupContent = JSON.stringify(data, null, 2);
      const backupFile = await this.app.vault.create(
        finalFileName,
        backupContent
      );
      return backupFile.path;
    } catch (error) {
      console.error('Failed to create backup:', error);
      // Don't fail the entire operation if backup fails
      console.warn('Continuing without backup');
      return '';
    }
  }

  async getBackupFiles(): Promise<TFile[]> {
    const files = this.app.vault.getFiles();
    return files.filter(
      (file) =>
        file.name.startsWith(BACKUP_PREFIX) && file.name.endsWith('.json')
    );
  }

  async restoreFromBackup(backupPath: string): Promise<GeffData> {
    try {
      const backupFile = this.app.vault.getAbstractFileByPath(backupPath);
      if (!(backupFile instanceof TFile)) {
        throw new Error('Backup file not found');
      }

      const content = await this.app.vault.read(backupFile);
      const data = JSON.parse(content);
      return data;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw new Error('Failed to restore from backup');
    }
  }

  async cleanupOldBackups(keepCount: number = 10): Promise<void> {
    const backupFiles = await this.getBackupFiles();

    if (backupFiles.length <= keepCount) return;

    // Sort by modification time (newest first)
    backupFiles.sort((a, b) => b.stat.mtime - a.stat.mtime);

    // Delete oldest backups
    const filesToDelete = backupFiles.slice(keepCount);
    for (const file of filesToDelete) {
      try {
        await this.app.vault.delete(file);
      } catch (error) {
        console.error(`Failed to delete backup file ${file.path}:`, error);
      }
    }
  }

  async hasValidDataFile(): Promise<boolean> {
    const dataFile = this.app.vault.getAbstractFileByPath(DATA_FILE);
    return dataFile instanceof TFile;
  }
}
