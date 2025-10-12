import { App, TFile } from 'obsidian';
import { GeffData } from '../types/geff';

export class BackupUtils {
  constructor(private app: App) {}

  async createBackup(data: GeffData, dataFilePath: string): Promise<string> {
    try {
      // Check if current data is different from existing file data
      const hasChanges = await this.hasDataChanged(data, dataFilePath);

      if (!hasChanges) {
        console.log('Geff: No data changes detected, skipping backup');
        return dataFilePath;
      }

      // Add timestamp to the backup data for tracking when it was created
      const backupData = {
        ...data,
        backupCreatedAt: new Date().toISOString(),
        backupType: 'auto',
      };

      const backupContent = JSON.stringify(backupData, null, 2);

      // Always use adapter.write to overwrite the file (works for both new and existing files)
      await this.app.vault.adapter.write(dataFilePath, backupContent);
      console.log(
        'Geff: Backup updated to data file (changes detected):',
        dataFilePath
      );

      return dataFilePath;
    } catch (error) {
      console.error('Failed to create backup to data file:', error);
      // Don't fail the entire operation if backup fails
      console.warn('Continuing without backup');
      return '';
    }
  }

  private async hasDataChanged(
    newData: GeffData,
    dataFilePath: string
  ): Promise<boolean> {
    try {
      const existingFile = this.app.vault.getAbstractFileByPath(dataFilePath);

      if (!(existingFile instanceof TFile)) {
        // File doesn't exist, consider this as a change
        return true;
      }

      const existingContent = await this.app.vault.read(existingFile);
      const existingData = JSON.parse(existingContent);

      // Remove backup-related fields for comparison
      const { backupCreatedAt, backupType, ...cleanExistingData } =
        existingData;
      const cleanNewData = { ...newData };

      // Compare the actual data (excluding backup metadata)
      const existingJson = JSON.stringify(cleanExistingData, null, 2);
      const newJson = JSON.stringify(cleanNewData, null, 2);

      return existingJson !== newJson;
    } catch (error) {
      // If we can't read the existing file, assume there are changes
      console.warn(
        'Geff: Could not compare with existing data, assuming changes:',
        error
      );
      return true;
    }
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
