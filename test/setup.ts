// Jest setup file for Obsidian Geff plugin tests

// Mock Obsidian API
const mockObsidian = {
  App: jest.fn(),
  Plugin: jest.fn(),
  TFile: jest.fn(),
  TFolder: jest.fn(),
  WorkspaceLeaf: jest.fn(),
  TAbstractFile: jest.fn(),
  Notice: jest.fn().mockImplementation((message, duration) => {
    console.log(`[NOTICE] ${message} (${duration}ms)`);
  }),
  SuggestModal: jest.fn(),
  SettingTab: jest.fn(),
  Setting: jest.fn(),
  Platform: {
    isMacOS: false,
  },
};

jest.mock('obsidian', () => mockObsidian);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up test environment
beforeEach(() => {
  jest.clearAllMocks();
});