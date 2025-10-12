import { ValidationUtils } from '../../src/utils/validation';

// Mock types for testing
interface MockSlot {
  id: string;
  notePath: string;
  isMissing?: boolean;
}

interface MockWorkspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  slots: MockSlot[];
}

interface MockGeffData {
  schemaVersion: number;
  activeWorkspaceId: string;
  workspaces: MockWorkspace[];
}

describe('ValidationUtils', () => {
  describe('validateGeffData', () => {
    it('should validate correct GeffData', () => {
      const validData: MockGeffData = {
        schemaVersion: 1,
        activeWorkspaceId: 'workspace_1',
        workspaces: [
          {
            id: 'workspace_1',
            name: 'Test Workspace',
            createdAt: '2025-10-12T11:00:00Z',
            updatedAt: '2025-10-12T11:00:00Z',
            slots: [
              {
                id: 'slot_1',
                notePath: 'test.md',
              },
            ],
          },
        ],
      };

      expect(ValidationUtils.validateGeffData(validData)).toBe(true);
    });

    it('should reject invalid GeffData', () => {
      const invalidData = {
        schemaVersion: '1', // Should be number
        activeWorkspaceId: 'workspace_1',
        workspaces: [], // Should be array of valid workspaces
      };

      expect(ValidationUtils.validateGeffData(invalidData)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(ValidationUtils.validateGeffData(null)).toBe(false);
      expect(ValidationUtils.validateGeffData(undefined)).toBe(false);
    });
  });

  describe('validateWorkspace', () => {
    it('should validate correct Workspace', () => {
      const validWorkspace: MockWorkspace = {
        id: 'workspace_1',
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots: [],
      };

      expect(ValidationUtils.validateWorkspace(validWorkspace)).toBe(true);
    });

    it('should reject invalid Workspace', () => {
      const invalidWorkspace = {
        id: 123, // Should be string
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots: 'not-array', // Should be array
      };

      expect(ValidationUtils.validateWorkspace(invalidWorkspace)).toBe(false);
    });
  });

  describe('validateSlot', () => {
    it('should validate correct Slot', () => {
      const validSlot: MockSlot = {
        id: 'slot_1',
        notePath: 'test.md',
      };

      expect(ValidationUtils.validateSlot(validSlot)).toBe(true);
    });

    it('should reject invalid Slot', () => {
      const invalidSlot = {
        id: 123, // Should be string
        notePath: 'test.md',
      };

      expect(ValidationUtils.validateSlot(invalidSlot)).toBe(false);
    });
  });

  describe('sanitizeWorkspaceName', () => {
    it('should remove invalid characters', () => {
      const input = 'Test<>:"/\\|?*Workspace';
      const expected = 'TestWorkspace';
      
      expect(ValidationUtils.sanitizeWorkspaceName(input)).toBe(expected);
    });

    it('should trim whitespace', () => {
      const input = '  Test Workspace  ';
      const expected = 'Test Workspace';
      
      expect(ValidationUtils.sanitizeWorkspaceName(input)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(ValidationUtils.sanitizeWorkspaceName('')).toBe('');
    });
  });

  describe('isValidNotePath', () => {
    it('should validate correct note paths', () => {
      expect(ValidationUtils.isValidNotePath('test.md')).toBe(true);
      expect(ValidationUtils.isValidNotePath('folder/test.md')).toBe(true);
      expect(ValidationUtils.isValidNotePath('deep/nested/path/test.md')).toBe(true);
    });

    it('should reject invalid note paths', () => {
      expect(ValidationUtils.isValidNotePath('')).toBe(false);
      expect(ValidationUtils.isValidNotePath('../outside.md')).toBe(false);
      expect(ValidationUtils.isValidNotePath('folder/../../outside.md')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = ValidationUtils.generateId();
      const id2 = ValidationUtils.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('validateSlotIndex', () => {
    it('should validate correct slot indices', () => {
      expect(ValidationUtils.validateSlotIndex(0, 9)).toBe(true);
      expect(ValidationUtils.validateSlotIndex(8, 9)).toBe(true);
      expect(ValidationUtils.validateSlotIndex(5, 9)).toBe(true);
    });

    it('should reject invalid slot indices', () => {
      expect(ValidationUtils.validateSlotIndex(-1, 9)).toBe(false);
      expect(ValidationUtils.validateSlotIndex(9, 9)).toBe(false);
      expect(ValidationUtils.validateSlotIndex(10, 9)).toBe(false);
      expect(ValidationUtils.validateSlotIndex(1.5, 9)).toBe(false);
    });
  });
});