import { GeffData, Workspace, Slot } from '../types/geff';

export class ValidationUtils {
  static validateGeffData(data: any): data is GeffData {
    if (!data || typeof data !== 'object') return false;

    if (typeof data.schemaVersion !== 'number') return false;
    if (typeof data.activeWorkspaceId !== 'string') return false;
    if (!Array.isArray(data.workspaces)) return false;

    return data.workspaces.every(ValidationUtils.validateWorkspace);
  }

  static validateWorkspace(workspace: any): workspace is Workspace {
    if (!workspace || typeof workspace !== 'object') return false;

    if (typeof workspace.id !== 'string') return false;
    if (typeof workspace.name !== 'string') return false;
    if (typeof workspace.createdAt !== 'string') return false;
    if (typeof workspace.updatedAt !== 'string') return false;
    if (!Array.isArray(workspace.slots)) return false;

    return workspace.slots.every(ValidationUtils.validateSlot);
  }

  static validateSlot(slot: any): slot is Slot {
    if (!slot || typeof slot !== 'object') return false;

    if (typeof slot.id !== 'string') return false;
    if (typeof slot.notePath !== 'string') return false;

    return true;
  }

  static sanitizeWorkspaceName(name: string): string {
    return name.trim().replace(/[<>:"/\\|?*]/g, '');
  }

  static isValidNotePath(path: string): boolean {
    return typeof path === 'string' && path.length > 0 && !path.includes('..');
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static validateSlotIndex(index: number, maxSlots: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < maxSlots;
  }
}
