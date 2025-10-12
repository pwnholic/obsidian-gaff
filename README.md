# Obsidian Geff

> Quick navigation between notes using slots and workspaces, inspired by Harpoon

![Obsidian Geff Logo](https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=Geff)

Obsidian Geff is a powerful navigation plugin that allows you to quickly jump between your most important notes using numbered slots and organized workspaces. Inspired by the popular Harpoon plugin for Neovim, Geff brings fast, keyboard-driven navigation to Obsidian.

## Features

### Core Navigation
- **9 Quick Access Slots**: Assign your most-used notes to numbered slots (1-9)
- **Instant Navigation**: Jump to any slot with a single hotkey
- **Smart File Detection**: Automatically updates when files are renamed or moved
- **Missing File Handling**: Gracefully handles deleted or moved files

### Workspace Management
- **Multiple Workspaces**: Organize slots by project, topic, or workflow
- **Quick Switching**: Seamlessly switch between different workspaces
- **Import/Export**: Share workspaces or back them up easily
- **Auto-Recovery**: Automatic backup and recovery system

### ⌨️ Keyboard-First Design
- **Full Keyboard Control**: Never touch your mouse for navigation
- **Customizable Hotkeys**: Configure hotkeys to match your workflow
- **Quick Menu**: Fast, searchable interface with keyboard navigation
- **Number Keys**: Direct slot access with number keys 1-9

### User Interface
- **Clean Quick Menu**: Intuitive popup with file previews
- **Status Bar Integration**: See current workspace and slot count at a glance
- **Multi-language Support**: English and Bahasa Indonesia
- **Theme Aware**: Follows Obsidian's light/dark theme

### Data Safety
- **Automatic Backups**: Daily backups with configurable retention
- **JSON Storage**: Human-readable data format
- **Schema Validation**: Ensures data integrity
- **Recovery Tools**: Restore from backup if needed

## Quick Start

### Installation

1. **Community Plugins**: Install from Obsidian's Community Plugins browser
2. **Manual Install**: Download the latest release and extract to your vault's plugins folder
3. **Development**: Clone this repository and run `npm install && npm run build`

### Basic Usage

1. **Add Current Note**: Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac) to add the active note to the first available slot
2. **Open Quick Menu**: Press `Ctrl+E` to open the quick navigation menu
3. **Jump to Slot**: Press `Ctrl+1` through `Ctrl+9` to jump directly to any slot
4. **Create Workspace**: Use the command palette to create and manage workspaces

## ⌨️ Default Hotkeys

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Add Current Note | `Ctrl+Shift+A` | `Cmd+Shift+A` |
| Open Quick Menu | `Ctrl+E` | `Cmd+E` |
| Go to Slot 1-9 | `Ctrl+1-9` | `Cmd+1-9` |
| Create Workspace | `Ctrl+Shift+N` | `Cmd+Shift+N` |
| Switch Workspace | `Ctrl+Shift+S` | `Cmd+Shift+S` |

## Detailed Usage

### Slots

Slots are the core of Geff's navigation system. Each slot holds a reference to a single note file:

- **Maximum 9 slots** per workspace (configurable)
- **Persistent storage** - slots survive Obsidian restarts
- **Duplicate prevention** - can't add the same note twice
- **Missing file detection** - automatically marks deleted files

### Workspaces

Workspaces group related slots together:

- **Multiple workspaces** for different projects or contexts
- **Active workspace** shown in status bar
- **Quick switching** between workspaces
- **Export/import** for backup and sharing

### Quick Menu

The quick menu provides fast access to all slots:

- **Search** through slot names and paths
- **Keyboard navigation** with arrow keys
- **Number keys** for direct slot access
- **Context menu** with right-click for additional actions

## Configuration

### Settings

Access settings through `Settings → Community Plugins → Obsidian Geff`:

#### General
- **Auto-remove missing files**: Automatically clean up slots when files are deleted
- **Auto-backup**: Create automatic backups of your data
- **Show notifications**: Display success/error messages
- **Confirm delete actions**: Show confirmation before destructive actions

#### User Interface
- **UI Theme**: Choose between Default, Compact, or Minimal themes
- **Language**: English or Bahasa Indonesia
- **Maximum slots**: Configure how many slots per workspace (1-20)

#### Data Management
- **Data file path**: Custom location for the data file
- **Export/Import**: Manual data export and import
- **Reset options**: Reset settings or clear all data

## Advanced Features

### Data Format

Geff stores data in a human-readable JSON format:

```json
{
  "schemaVersion": 1,
  "activeWorkspaceId": "workspace_1",
  "workspaces": [
    {
      "id": "workspace_1",
      "name": "My Project",
      "createdAt": "2025-10-12T11:00:00Z",
      "updatedAt": "2025-10-12T11:15:00Z",
      "slots": [
        {
          "id": "slot_1",
          "notePath": "project/main.md"
        }
      ]
    }
  ]
}
```

### Backup System

- **Automatic backups** created daily
- **Configurable retention** (default: 10 backups)
- **Manual backup** creation
- **Easy restore** from any backup

### File Event Handling

Geff automatically responds to file system events:

- **File renames**: Automatically updates slot paths
- **File deletions**: Marks slots as missing or removes them
- **File moves**: Updates paths when files are moved between folders
- **File recovery**: Restores missing file indicators when files reappear

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/obsidian-geff.git
cd obsidian-geff

# Install dependencies
npm install

# Build the plugin
npm run build

# Run in development mode
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## Roadmap

### Version 1.1
- [ ] Multi-note per slot (grouping)
- [ ] Slot labels and comments
- [ ] Auto-workspace based on folder
- [ ] Session mode for temporary slots

### Version 1.2
- [ ] Custom themes for quick menu
- [ ] Workspace sharing between users
- [ ] Usage statistics and analytics
- [ ] Mobile gesture support

### Version 2.0
- [ ] Plugin integrations (Daily Notes, Templates, etc.)
- [ ] Advanced search and filtering
- [ ] Slot scheduling and reminders
- [ ] Cloud sync support

## Troubleshooting

### Common Issues

**Plugin doesn't load**
- Check Obsidian version compatibility (requires v1.5.0+)
- Ensure all files are in the correct directory
- Check Obsidian developer console for errors

**Hotkeys not working**
- Check for conflicts with other plugins
- Verify hotkey settings in Geff configuration
- Try resetting hotkeys to defaults

**Slots showing as missing**
- Use the "Validate All Slots" command
- Check if files were moved or renamed
- Manually update slot paths if needed

**Data not saving**
- Check file permissions in your vault
- Verify data file path in settings
- Try resetting data file location

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discord**: Join the Obsidian community for discussions
- **Documentation**: Check this README and inline help

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Harpoon**: Inspiration from the Neovim plugin
- **Obsidian Team**: For the amazing note-taking platform
- **Community**: For feedback, suggestions, and support

## Contact

- **GitHub**: [Your GitHub Profile](https://github.com/your-username)
- **Twitter**: [@YourTwitter](https://twitter.com/your-twitter)
- **Email**: your.email@example.com

---

**Made with passion for the Obsidian community**