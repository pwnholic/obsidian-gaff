import { App, Notice as ObsidianNotice } from 'obsidian';
import { I18N } from '../utils/constants';

export class Notice {
  constructor(private app: App) {}

  showSuccess(message: string, duration: number = 3000): void {
    const settings = this.getSettings();
    if (settings.notifications) {
      new ObsidianNotice(this.formatMessage(message), duration);
    }
  }

  showError(message: string, duration: number = 5000): void {
    new ObsidianNotice(`[ERROR] ${this.formatMessage(message)}`, duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    const settings = this.getSettings();
    if (settings.notifications) {
      new ObsidianNotice(`[INFO] ${this.formatMessage(message)}`, duration);
    }
  }

  showWarning(message: string, duration: number = 4000): void {
    const settings = this.getSettings();
    if (settings.notifications) {
      new ObsidianNotice(`[WARN] ${this.formatMessage(message)}`, duration);
    }
  }

  private formatMessage(message: string): string {
    const settings = this.getSettings();
    const lang = settings.language;

    // Check if message is a key in I18N
    if (I18N[lang] && (I18N[lang] as any)[message]) {
      return (I18N[lang] as any)[message];
    }

    return message;
  }

  private getSettings() {
    // This would be injected or passed in a real implementation
    return {
      notifications: true,
      language: 'en' as 'en' | 'id',
    };
  }
}
