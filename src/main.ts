import { Plugin } from 'obsidian';
import { PluginManager } from './core/pluginManager';

export default class ObsidianGaffPlugin extends Plugin {
  private pluginManager: PluginManager | null = null;

  async onload(): Promise<void> {
    console.log('Loading Obsidian Geff plugin...');

    try {
      this.pluginManager = new PluginManager(this, this.app);
      await this.pluginManager.onload();

      // Add some basic CSS for the plugin
      this.addStyles();
      
      console.log('Obsidian Geff plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Obsidian Geff plugin:', error);
    }
  }

  async onunload(): Promise<void> {
    console.log('Unloading Obsidian Geff plugin...');

    try {
      if (this.pluginManager) {
        await this.pluginManager.onunload();
        this.pluginManager = null;
      }
      
      console.log('Obsidian Geff plugin unloaded successfully');
    } catch (error) {
      console.error('Error unloading Obsidian Geff plugin:', error);
    }
  }

  private addStyles(): void {
    // Add custom CSS for the plugin
    const style = document.createElement('style');
    style.textContent = `
      /* Quick Menu Styles */
      .geff-suggestion {
        transition: background-color 0.2s ease;
      }
      
      .geff-suggestion.is-selected {
        background-color: var(--background-modifier-hover);
      }
      
      .geff-slot-number {
        font-family: var(--font-monospace);
      }
      
      .geff-context-menu {
        animation: fadeIn 0.1s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Status Bar Styles */
      .geff-status-bar {
        cursor: pointer;
        transition: color 0.2s ease;
      }
      
      .geff-status-bar:hover {
        color: var(--text-accent);
      }
      
      /* Compact Theme */
      .geff-compact .geff-suggestion {
        padding: 4px 8px;
        font-size: 0.9em;
      }
      
      /* Minimal Theme */
      .geff-minimal .geff-suggestion {
        padding: 6px 10px;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      
      .geff-minimal .geff-suggestion:last-child {
        border-bottom: none;
      }
      
      /* Missing file indicator */
      .geff-missing {
        opacity: 0.6;
        font-style: italic;
      }
      
      /* Workspace indicator */
      .geff-workspace-indicator {
        font-weight: 500;
        color: var(--text-accent);
      }
    `;
    
    document.head.appendChild(style);
  }
}