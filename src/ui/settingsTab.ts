import { App, PluginSettingTab, Setting, TFile } from 'obsidian';
import { DataManager } from '../core/dataManager';
import { GeffSettings } from '../types/geff';
import { Notice as GaffNotice } from './notice';
import { DEFAULT_SETTINGS } from '../utils/constants';

export class SettingsTab extends PluginSettingTab {
  private notice: GaffNotice;

  constructor(
    app: App,
    plugin: any,
    private dataManager: DataManager,
    notice: GaffNotice
  ) {
    super(app, plugin);
    this.notice = notice;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsidian Geff Settings' });

    // General Settings
    containerEl.createEl('h3', { text: 'General' });

    new Setting(containerEl)
      .setName('Auto-remove missing files')
      .setDesc('Automatically remove slots when files are deleted or moved')
      .addToggle((toggle) =>
        toggle
          .setValue(this.dataManager.getSettings().autoRemoveMissing)
          .onChange(async (value) => {
            await this.updateSetting('autoRemoveMissing', value);
          })
      );

    new Setting(containerEl)
      .setName('Auto-backup')
      .setDesc('Create automatic backups when data changes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.dataManager.getSettings().autoBackup)
          .onChange(async (value) => {
            await this.updateSetting('autoBackup', value);
          })
      );

    new Setting(containerEl)
      .setName('Show notifications')
      .setDesc('Show notifications for add/remove actions and errors')
      .addToggle((toggle) =>
        toggle
          .setValue(this.dataManager.getSettings().notifications)
          .onChange(async (value) => {
            await this.updateSetting('notifications', value);
          })
      );

    new Setting(containerEl)
      .setName('Confirm delete actions')
      .setDesc('Show confirmation dialog before deleting workspaces or slots')
      .addToggle((toggle) =>
        toggle
          .setValue(this.dataManager.getSettings().confirmDelete)
          .onChange(async (value) => {
            await this.updateSetting('confirmDelete', value);
          })
      );

    // UI Settings
    containerEl.createEl('h3', { text: 'User Interface' });

    new Setting(containerEl)
      .setName('UI Theme')
      .setDesc('Choose the visual theme for the quick menu')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('default', 'Default')
          .addOption('compact', 'Compact')
          .addOption('minimal', 'Minimal')
          .setValue(this.dataManager.getSettings().uiTheme)
          .onChange(async (value: string) => {
            await this.updateSetting(
              'uiTheme',
              value as 'default' | 'compact' | 'minimal'
            );
          })
      );

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Choose the interface language')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('en', 'English')
          .addOption('id', 'Bahasa Indonesia')
          .setValue(this.dataManager.getSettings().language)
          .onChange(async (value: string) => {
            await this.updateSetting('language', value as 'en' | 'id');
          })
      );

    new Setting(containerEl)
      .setName('Maximum slots')
      .setDesc('Maximum number of slots per workspace (1-20)')
      .addSlider((slider) =>
        slider
          .setLimits(1, 20, 1)
          .setValue(this.dataManager.getSettings().maxSlots)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.updateSetting('maxSlots', value);
          })
      );

    // Data Management
    containerEl.createEl('h3', { text: 'Data Management' });

    new Setting(containerEl)
      .setName('Data file path')
      .setDesc('Path to the data file (relative to vault root)')
      .addText((text) =>
        text
          .setPlaceholder('geff_data.json')
          .setValue(this.dataManager.getSettings().dataPath)
          .onChange(async (value) => {
            await this.updateSetting('dataPath', value);
          })
      );

    new Setting(containerEl)
      .setName('Export data')
      .setDesc('Export all plugin data to a JSON file')
      .addButton((button) =>
        button.setButtonText('Export').onClick(async () => {
          await this.exportData();
        })
      );

    new Setting(containerEl)
      .setName('Import data')
      .setDesc('Import plugin data from a JSON file')
      .addButton((button) =>
        button.setButtonText('Import').onClick(async () => {
          await this.importData();
        })
      );

    // Advanced Settings
    containerEl.createEl('h3', { text: 'Advanced' });

    new Setting(containerEl)
      .setName('Telemetry')
      .setDesc('Share anonymous usage data to help improve the plugin')
      .addToggle((toggle) =>
        toggle
          .setValue(this.dataManager.getSettings().telemetry)
          .onChange(async (value) => {
            await this.updateSetting('telemetry', value);
          })
      );

    // Reset Section
    containerEl.createEl('h3', { text: 'Reset' });

    new Setting(containerEl)
      .setName('Reset to defaults')
      .setDesc('Reset all settings to default values')
      .addButton((button) =>
        button
          .setButtonText('Reset Settings')
          .setWarning()
          .onClick(async () => {
            await this.resetSettings();
          })
      );

    new Setting(containerEl)
      .setName('Clear all data')
      .setDesc('Delete all workspaces and slots (irreversible)')
      .addButton((button) =>
        button
          .setButtonText('Clear All Data')
          .setWarning()
          .onClick(async () => {
            await this.clearAllData();
          })
      );

    // Info Section
    containerEl.createEl('h3', { text: 'Information' });

    const infoDiv = containerEl.createDiv();
    infoDiv.style.marginTop = '10px';
    infoDiv.style.padding = '10px';
    infoDiv.style.backgroundColor = 'var(--background-secondary)';
    infoDiv.style.borderRadius = '5px';

    infoDiv.createEl('p', {
      text: `Schema Version: ${this.dataManager.getData().schemaVersion}`,
    });

    infoDiv.createEl('p', {
      text: `Active Workspace: ${this.dataManager.getData().activeWorkspaceId}`,
    });

    const workspaces = this.dataManager.getData().workspaces;
    infoDiv.createEl('p', {
      text: `Total Workspaces: ${workspaces.length}`,
    });

    const totalSlots = workspaces.reduce((sum, ws) => sum + ws.slots.length, 0);
    infoDiv.createEl('p', {
      text: `Total Slots: ${totalSlots}`,
    });
  }

  private async updateSetting(
    key: keyof GeffSettings,
    value: any
  ): Promise<void> {
    try {
      this.dataManager.setSettings({ [key]: value });
      this.notice.showSuccess('Setting updated');
    } catch {
      this.notice.showError('Failed to update setting');
    }
  }

  private async exportData(): Promise<void> {
    try {
      const data = await this.dataManager.exportData();
      const fileName = `geff_export_${new Date().toISOString().slice(0, 10)}.json`;
      await this.app.vault.create(fileName, data);
      this.notice.showSuccess(`Data exported to ${fileName}`);
    } catch {
      this.notice.showError('Failed to export data');
    }
  }

  private async importData(): Promise<void> {
    try {
      const files = this.app.vault
        .getFiles()
        .filter((file) => file.name.endsWith('.json'))
        .map((file) => file.path);

      if (files.length === 0) {
        this.notice.showError('No JSON files found');
        return;
      }

      // Simple implementation - use first JSON file
      // In a real implementation, you'd show a file picker
      const selectedFile = files[0];
      const file = this.app.vault.getAbstractFileByPath(selectedFile);

      if (!(file instanceof TFile)) {
        this.notice.showError('Invalid file selected');
        return;
      }

      const content = await this.app.vault.read(file);
      await this.dataManager.importData(content);
      this.notice.showSuccess('Data imported successfully');
      this.display(); // Refresh settings display
    } catch {
      this.notice.showError('Failed to import data');
    }
  }

  private async resetSettings(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to reset all settings to defaults?'
    );
    if (!confirmed) return;

    try {
      this.dataManager.setSettings(DEFAULT_SETTINGS);
      this.notice.showSuccess('Settings reset to defaults');
      this.display(); // Refresh settings display
    } catch {
      this.notice.showError('Failed to reset settings');
    }
  }

  private async clearAllData(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete all workspaces and slots? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await this.dataManager.resetToDefault();
      this.notice.showSuccess('All data cleared');
      this.display(); // Refresh settings display
    } catch {
      this.notice.showError('Failed to clear data');
    }
  }
}
