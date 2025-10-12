import { App, TFile } from 'obsidian';
import { GeffData, GeffSettings, DEFAULT_SETTINGS } from '../types/geff';
import { ValidationUtils } from '../utils/validation';
import { BackupUtils } from '../utils/backup';
import {
  DATA_FILE,
  SCHEMA_VERSION,
  DEFAULT_WORKSPACE_NAME,
} from '../utils/constants';

export class DataManager {
  private data: GeffData;
  private settings: GeffSettings;
  private backupUtils: BackupUtils;

  constructor(private app: App) {
    this.backupUtils = new BackupUtils(app);
    this.settings = { ...DEFAULT_SETTINGS };
    this.data = this.createDefaultData();
  }

  async load(): Promise<void> {
    try {
      console.log('Geff: Loading data from file:', DATA_FILE);
      const dataFile = this.app.vault.getAbstractFileByPath(DATA_FILE);

      if (dataFile instanceof TFile) {
        console.log('Geff: Data file found, reading content...');
        const content = await this.app.vault.read(dataFile);
        console.log('Geff: Raw content length:', content.length);

        const parsedData = JSON.parse(content);
        console.log(
          'Geff: Parsed data, workspaces count:',
          parsedData.workspaces?.length || 0
        );

        if (ValidationUtils.validateGeffData(parsedData)) {
          this.data = this.migrateDataIfNeeded(parsedData);
          console.log(
            'Geff: Data loaded successfully, active workspace:',
            this.data.activeWorkspaceId
          );
        } else {
          console.warn('Geff: Invalid data format, creating default data');
          this.data = this.createDefaultData();
          await this.save();
        }
      } else {
        console.log('Geff: No data file found, creating default data');
        this.data = this.createDefaultData();
        await this.save();
      }
    } catch (error) {
      console.error('Geff: Failed to load data:', error);
      this.data = this.createDefaultData();
      await this.save();
    }
  }

  async save(): Promise<void> {
    try {
      this.data.updatedAt = new Date().toISOString();

      const content = JSON.stringify(this.data, null, 2);

      // Debug logging
      console.log('Geff: Saving data to file:', DATA_FILE);
      console.log(
        'Geff: Data content preview:',
        content.substring(0, 200) + '...'
      );
      console.log('Geff: Workspaces to save:', this.data.workspaces.length);
      console.log('Geff: Active workspace ID:', this.data.activeWorkspaceId);

      // Use vault.adapter.write for more reliable file writing
      await this.app.vault.adapter.write(DATA_FILE, content);

      // Verify the file was written correctly
      const verifyFile = this.app.vault.getAbstractFileByPath(DATA_FILE);
      if (verifyFile instanceof TFile) {
        const verifyContent = await this.app.vault.read(verifyFile);
        const verifyData = JSON.parse(verifyContent);
        console.log(
          'Geff: Verification - workspaces after save:',
          verifyData.workspaces?.length || 0
        );
      }

      console.log('Geff: Data saved and verified successfully');

      if (this.settings.autoBackup) {
        await this.backupUtils.createBackup(this.data);
        await this.backupUtils.cleanupOldBackups();
      }
    } catch (error) {
      console.error('Geff: Failed to save data:', error);
      throw new Error('Failed to save data');
    }
  }

  getData(): GeffData {
    return { ...this.data };
  }

  setData(data: GeffData): void {
    if (ValidationUtils.validateGeffData(data)) {
      this.data = data;
    } else {
      throw new Error('Invalid data format');
    }
  }

  getSettings(): GeffSettings {
    return { ...this.settings };
  }

  setSettings(settings: Partial<GeffSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  private createDefaultData(): GeffData {
    const defaultWorkspaceId = ValidationUtils.generateId();
    return {
      schemaVersion: SCHEMA_VERSION,
      activeWorkspaceId: defaultWorkspaceId,
      workspaces: [
        {
          id: defaultWorkspaceId,
          name: DEFAULT_WORKSPACE_NAME,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slots: [],
        },
      ],
    };
  }

  private migrateDataIfNeeded(data: any): GeffData {
    if (data.schemaVersion === SCHEMA_VERSION) {
      return data;
    }

    // Add migration logic here for future schema versions
    console.log(
      `Migrating data from schema version ${data.schemaVersion} to ${SCHEMA_VERSION}`
    );

    return {
      ...data,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  async exportData(): Promise<string> {
    return JSON.stringify(this.data, null, 2);
  }

  async importData(jsonContent: string): Promise<void> {
    try {
      const importedData = JSON.parse(jsonContent);

      if (!ValidationUtils.validateGeffData(importedData)) {
        throw new Error('Invalid data format');
      }

      this.setData(importedData);
      await this.save();
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  }

  async resetToDefault(): Promise<void> {
    this.data = this.createDefaultData();
    await this.save();
  }
}
