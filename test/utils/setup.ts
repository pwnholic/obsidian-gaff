// Jest setup file for utility tests (no Obsidian dependency)

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