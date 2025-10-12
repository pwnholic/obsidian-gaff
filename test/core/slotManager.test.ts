import { SlotManager } from '../../src/core/slotManager';
import { DataManager } from '../../src/core/dataManager';
import { WorkspaceManager } from '../../src/core/workspaceManager';
import { App, TFile } from 'obsidian';
import { GeffData, Workspace } from '../../src/types/geff';

// Mock dependencies
jest.mock('../../src/core/dataManager');
jest.mock('../../src/core/workspaceManager');
jest.mock('obsidian');

describe('SlotManager', () => {
  let slotManager: SlotManager;
  let mockApp: jest.Mocked<App>;
  let mockDataManager: jest.Mocked<DataManager>;
  let mockWorkspaceManager: jest.Mocked<WorkspaceManager>;
  let mockFile: jest.Mocked<TFile>;

  beforeEach(() => {
    // Create mock objects
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(),
        getLeaf: jest.fn(),
      },
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
    } as any;

    mockFile = {
      path: 'test.md',
    } as any;

    mockDataManager = {
      getData: jest.fn(),
      setData: jest.fn(),
      save: jest.fn(),
      getSettings: jest.fn(),
    } as any;

    mockWorkspaceManager = {
      getActiveWorkspace: jest.fn(),
    } as any;

    slotManager = new SlotManager(mockApp, mockDataManager, mockWorkspaceManager);
  });

  describe('addCurrentNote', () => {
    it('should add current note to slot', async () => {
      // Setup mocks
      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
        id: 'workspace_1',
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots: [],
      });

      mockDataManager.getData.mockReturnValue({
        schemaVersion: 1,
        activeWorkspaceId: 'workspace_1',
        workspaces: [
          {
            id: 'workspace_1',
            name: 'Test Workspace',
            createdAt: '2025-10-12T11:00:00Z',
            updatedAt: '2025-10-12T11:00:00Z',
            slots: [],
          },
        ],
      });

      mockDataManager.getSettings.mockReturnValue({
        maxSlots: 9,
      } as any);

      // Execute
      const result = await slotManager.addCurrentNote();

      // Verify
      expect(result).toEqual({
        id: expect.any(String),
        notePath: 'test.md',
      });
      expect(mockDataManager.save).toHaveBeenCalled();
    });

    it('should throw error when no active file', async () => {
      mockApp.workspace.getActiveFile.mockReturnValue(null);

      await expect(slotManager.addCurrentNote()).rejects.toThrow('No active file');
    });

    it('should throw error when note already exists in slot', async () => {
      mockApp.workspace.getActiveFile.mockReturnValue(mockFile);
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
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
      });

      await expect(slotManager.addCurrentNote()).rejects.toThrow('Note already exists in slot 1');
    });
  });

  describe('removeNote', () => {
    it('should remove note from slot', async () => {
      const slotToRemove = {
        id: 'slot_1',
        notePath: 'test.md',
      };

      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
        id: 'workspace_1',
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots: [slotToRemove],
      });

      mockDataManager.getData.mockReturnValue({
        schemaVersion: 1,
        activeWorkspaceId: 'workspace_1',
        workspaces: [
          {
            id: 'workspace_1',
            name: 'Test Workspace',
            createdAt: '2025-10-12T11:00:00Z',
            updatedAt: '2025-10-12T11:00:00Z',
            slots: [slotToRemove],
          },
        ],
      });

      const result = await slotManager.removeNote(0);

      expect(result).toEqual(slotToRemove);
      expect(mockDataManager.save).toHaveBeenCalled();
    });

    it('should throw error for invalid slot index', async () => {
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
        id: 'workspace_1',
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots: [],
      });

      await expect(slotManager.removeNote(0)).rejects.toThrow('Invalid slot index');
    });
  });

  describe('gotoSlot', () => {
    it('should open file in slot', async () => {
      const mockLeaf = {
        openFile: jest.fn(),
      };

      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
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
      });

      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockApp.workspace.getLeaf.mockReturnValue(mockLeaf as any);

      const result = await slotManager.gotoSlot(0);

      expect(result).toBe(mockFile);
      expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
    });

    it('should throw error when file not found', async () => {
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
        id: 'workspace_1',
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots: [
          {
            id: 'slot_1',
            notePath: 'nonexistent.md',
          },
        ],
      });

      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

      await expect(slotManager.gotoSlot(0)).rejects.toThrow('File not found: nonexistent.md');
    });
  });

  describe('getSlots', () => {
    it('should return slots from active workspace', () => {
      const slots = [
        { id: 'slot_1', notePath: 'test1.md' },
        { id: 'slot_2', notePath: 'test2.md' },
      ];

      mockWorkspaceManager.getActiveWorkspace.mockReturnValue({
        id: 'workspace_1',
        name: 'Test Workspace',
        createdAt: '2025-10-12T11:00:00Z',
        updatedAt: '2025-10-12T11:00:00Z',
        slots,
      } as any);

      const result = slotManager.getSlots();

      expect(result).toEqual(slots);
    });

    it('should return empty array when no active workspace', () => {
      mockWorkspaceManager.getActiveWorkspace.mockReturnValue(null);

      const result = slotManager.getSlots();

      expect(result).toEqual([]);
    });
  });
});