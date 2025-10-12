# Changelog

All notable changes to Obsidian Geff will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-12

### Added
- **Core Navigation System**
  - 9 quick access slots for note navigation
  - Instant slot jumping with hotkeys (Ctrl/Cmd + 1-9)
  - Quick menu with search and keyboard navigation
  - Add/remove notes from slots

- **Workspace Management**
  - Multiple workspace support
  - Create, rename, delete, and switch workspaces
  - Import/export workspace functionality
  - Active workspace indicator in status bar

- **File Event Handling**
  - Automatic path updates on file rename/move
  - Missing file detection and handling
  - Auto-recovery when files reappear
  - Vault change detection and validation

- **User Interface**
  - Clean quick menu with file previews
  - Status bar integration
  - Context menu for slot actions
  - Multi-language support (English/Indonesian)
  - Theme-aware styling (light/dark mode)

- **Data Management**
  - JSON-based storage with schema validation
  - Automatic backup system
  - Data export/import functionality
  - Recovery tools for corrupted data

- **Settings & Customization**
  - Comprehensive settings tab
  - Configurable hotkeys
  - UI theme options (default/compact/minimal)
  - Auto-remove missing files toggle
  - Maximum slots configuration (1-20)
  - Notification preferences

- **Keyboard Shortcuts**
  - Ctrl/Cmd + Shift + A: Add current note
  - Ctrl/Cmd + E: Open quick menu
  - Ctrl/Cmd + 1-9: Jump to slot
  - Ctrl/Cmd + Shift + N: Create workspace
  - Ctrl/Cmd + Shift + S: Switch workspace
  - Full customization support

- **Developer Features**
  - Comprehensive unit test suite
  - ESLint and Prettier configuration
  - TypeScript with strict type checking
  - GitHub Actions CI/CD pipeline
  - Automated testing and builds

- **Safety & Reliability**
  - Data validation on every save/load
  - Automatic backup creation
  - Corruption recovery
  - Confirmation dialogs for destructive actions
  - Error handling and user feedback

### Technical Details
- **Minimum Obsidian Version**: 1.5.0
- **TypeScript Version**: 5.3.3
- **Build System**: ESBuild
- **Testing Framework**: Jest
- **Code Quality**: ESLint + Prettier
- **CI/CD**: GitHub Actions

### Documentation
- Comprehensive README with usage examples
- API documentation for developers
- Troubleshooting guide
- Contributing guidelines
- Development setup instructions

## [Unreleased]

### Planned
- Multi-note per slot (grouping)
- Slot labels and comments
- Auto-workspace based on folder structure
- Session mode for temporary slots
- Custom quick menu themes
- Workspace sharing between users
- Usage statistics and analytics
- Mobile gesture support
- Plugin integrations (Daily Notes, Templates)
- Advanced search and filtering
- Cloud sync support

---

## Version History

### v0.x.x (Development)
- Initial development and testing
- Feature implementation and refinement
- Beta testing and feedback incorporation
- Performance optimization
- Bug fixes and stability improvements

---

## Migration Guide

### From v0.x to v1.0.0
No migration required - v1.0.0 maintains backward compatibility with all v0.x data formats.

### Future Migrations
When schema changes are introduced in future versions, automatic migration will be handled seamlessly. Data backups will be created before any migration process.

---

## Support

For questions, bug reports, or feature requests:
- GitHub Issues: [Create an issue](https://github.com/your-username/obsidian-geff/issues)
- Documentation: [README.md](README.md)
- Community: Obsidian Discord server

---

*Last updated: 2025-10-12*