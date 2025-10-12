import { App, TFile } from 'obsidian';
import { GeffData } from '../types/geff';
import { BACKUP_PREFIX } from './constants';

export class BackupUtils {
  constructor(private app: App) {}

  async createBackup(data: GeffData): Promise<string> {
    const backupFileName = `${BACKUP_PREFIX}latest.json`;

    // Add timestamp to the backup data for tracking when it was created
    const backupData = {
      ...data,
      backupCreatedAt: new Date().toISOString(),
      backupType: 'auto',
    };

    try {
      const backupContent = JSON.stringify(backupData, null, 2);

      const existingFile = this.app.vault.getAbstractFileByPath(backupFileName);

      if (existingFile) {
        // Overwrite existing backup file
        await this.app.vault.modify(existingFile as TFile, backupContent);
        console.log('Geff: Backup updated:', backupFileName);
      } else {
        // Create new backup file
        await this.app.vault.create(backupFileName, backupContent);
        console.log('Geff: Backup created:', backupFileName);
      }

      return backupFileName;
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
    // With single backup file approach, no cleanup needed
    // Keeping this method for compatibility but it's now a no-op
    console.log('Geff: Single backup file mode - no cleanup needed');
  }

  async hasValidDataFile(dataFilePath: string): Promise<boolean> {
    const dataFile = this.app.vault.getAbstractFileByPath(dataFilePath);
    return dataFile instanceof TFile;
  }
}
