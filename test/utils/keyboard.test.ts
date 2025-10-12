import { KeyboardUtils } from '../../src/utils/keyboard';

// Mock Platform for testing
const mockPlatform = {
  isMacOS: false,
};

// Mock the Platform module
jest.mock('../../src/utils/keyboard', () => {
  const originalModule = jest.requireActual('../../src/utils/keyboard');
  return {
    ...originalModule,
    // Override Platform if needed
  };
});

describe('KeyboardUtils', () => {
  beforeEach(() => {
    // Mock Platform.isMacOS to false for consistent testing
    Object.defineProperty(require('obsidian').Platform, 'isMacOS', {
      value: false,
      writable: true,
    });
  });

  describe('getModifierKey', () => {
    it('should return Ctrl on non-Mac platforms', () => {
      expect(KeyboardUtils.getModifierKey()).toBe('Ctrl');
    });
  });

  describe('formatHotkey', () => {
    it('should replace Ctrl with platform-specific modifier', () => {
      expect(KeyboardUtils.formatHotkey('Ctrl+A')).toBe('Ctrl+A');
    });

    it('should handle multiple modifiers', () => {
      expect(KeyboardUtils.formatHotkey('Ctrl+Shift+A')).toBe('Ctrl+Shift+A');
    });
  });

  describe('parseHotkey', () => {
    it('should parse simple hotkey', () => {
      const result = KeyboardUtils.parseHotkey('Ctrl+A');
      expect(result).toEqual({
        ctrl: true,
        alt: false,
        shift: false,
        meta: false,
        key: 'a',
      });
    });

    it('should parse complex hotkey', () => {
      const result = KeyboardUtils.parseHotkey('Ctrl+Shift+Alt+A');
      expect(result).toEqual({
        ctrl: true,
        alt: true,
        shift: true,
        meta: false,
        key: 'a',
      });
    });

    it('should parse Cmd hotkey', () => {
      const result = KeyboardUtils.parseHotkey('Cmd+A');
      expect(result).toEqual({
        ctrl: false,
        alt: false,
        shift: false,
        meta: true,
        key: 'a',
      });
    });
  });

  describe('matchesEvent', () => {
    it('should match keyboard event to hotkey', () => {
      const event = {
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        key: 'a',
      } as KeyboardEvent;

      expect(KeyboardUtils.matchesEvent(event, 'Ctrl+A')).toBe(true);
    });

    it('should not match different modifiers', () => {
      const event = {
        ctrlKey: true,
        altKey: true,
        shiftKey: false,
        metaKey: false,
        key: 'a',
      } as KeyboardEvent;

      expect(KeyboardUtils.matchesEvent(event, 'Ctrl+A')).toBe(false);
    });

    it('should be case insensitive', () => {
      const event = {
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        key: 'A',
      } as KeyboardEvent;

      expect(KeyboardUtils.matchesEvent(event, 'Ctrl+a')).toBe(true);
    });
  });

  describe('isSlotKey', () => {
    it('should return true for number keys 1-9', () => {
      expect(KeyboardUtils.isSlotKey('1')).toBe(true);
      expect(KeyboardUtils.isSlotKey('5')).toBe(true);
      expect(KeyboardUtils.isSlotKey('9')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(KeyboardUtils.isSlotKey('0')).toBe(false);
      expect(KeyboardUtils.isSlotKey('a')).toBe(false);
      expect(KeyboardUtils.isSlotKey('Enter')).toBe(false);
    });
  });

  describe('getSlotNumber', () => {
    it('should extract slot number from key', () => {
      expect(KeyboardUtils.getSlotNumber('5')).toBe(5);
      expect(KeyboardUtils.getSlotNumber('1')).toBe(1);
      expect(KeyboardUtils.getSlotNumber('9')).toBe(9);
    });

    it('should return null for non-numeric keys', () => {
      expect(KeyboardUtils.getSlotNumber('a')).toBe(null);
      expect(KeyboardUtils.getSlotNumber('0')).toBe(null);
    });
  });

  describe('getSlotHotkey', () => {
    it('should generate slot hotkey', () => {
      expect(KeyboardUtils.getSlotHotkey(1)).toBe('Ctrl+1');
      expect(KeyboardUtils.getSlotHotkey(5)).toBe('Ctrl+5');
      expect(KeyboardUtils.getSlotHotkey(9)).toBe('Ctrl+9');
    });
  });

  describe('isNavigationKey', () => {
    it('should return true for navigation keys', () => {
      expect(KeyboardUtils.isNavigationKey('ArrowUp')).toBe(true);
      expect(KeyboardUtils.isNavigationKey('ArrowDown')).toBe(true);
      expect(KeyboardUtils.isNavigationKey('Enter')).toBe(true);
      expect(KeyboardUtils.isNavigationKey('Escape')).toBe(true);
      expect(KeyboardUtils.isNavigationKey('Tab')).toBe(true);
    });

    it('should return false for non-navigation keys', () => {
      expect(KeyboardUtils.isNavigationKey('a')).toBe(false);
      expect(KeyboardUtils.isNavigationKey('1')).toBe(false);
    });
  });

  describe('isEscapeKey', () => {
    it('should return true for Escape key', () => {
      expect(KeyboardUtils.isEscapeKey('Escape')).toBe(true);
      expect(KeyboardUtils.isEscapeKey('escape')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(KeyboardUtils.isEscapeKey('Enter')).toBe(false);
      expect(KeyboardUtils.isEscapeKey('a')).toBe(false);
    });
  });

  describe('isEnterKey', () => {
    it('should return true for Enter key', () => {
      expect(KeyboardUtils.isEnterKey('Enter')).toBe(true);
      expect(KeyboardUtils.isEnterKey('enter')).toBe(true);
    });

    it('should return false for other keys', () => {
      expect(KeyboardUtils.isEnterKey('Escape')).toBe(false);
      expect(KeyboardUtils.isEnterKey('a')).toBe(false);
    });
  });
});