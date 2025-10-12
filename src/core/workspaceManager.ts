import { App } from 'obsidian';
import { Workspace } from '../types/geff';
import { ValidationUtils } from '../utils/validation';
import { DataManager } from './dataManager';

export class WorkspaceManager {
  constructor(
    private app: App,
    private dataManager: DataManager
  ) {}

  async createWorkspace(name: string): Promise<Workspace> {
    const sanitizedName = ValidationUtils.sanitizeWorkspaceName(name);

    if (!sanitizedName) {
      throw new Error('Workspace name cannot be empty');
    }

    const data = this.dataManager.getData();

    // Check for duplicate names
    if (data.workspaces.some((w) => w.name === sanitizedName)) {
      throw new Error('Workspace with this name already exists');
    }

    const newWorkspace: Workspace = {
      id: ValidationUtils.generateId(),
      name: sanitizedName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slots: [],
    };

    data.workspaces.push(newWorkspace);
    this.dataManager.setData(data);
    await this.dataManager.save();

    return newWorkspace;
  }

  async renameWorkspace(
    workspaceId: string,
    newName: string
  ): Promise<Workspace> {
    const sanitizedName = ValidationUtils.sanitizeWorkspaceName(newName);

    if (!sanitizedName) {
      throw new Error('Workspace name cannot be empty');
    }

    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check for duplicate names (excluding current workspace)
    if (
      data.workspaces.some(
        (w) => w.name === sanitizedName && w.id !== workspaceId
      )
    ) {
      throw new Error('Workspace with this name already exists');
    }

    workspace.name = sanitizedName;
    workspace.updatedAt = new Date().toISOString();

    this.dataManager.setData(data);
    await this.dataManager.save();

    return workspace;
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const data = this.dataManager.getData();
    const workspaceIndex = data.workspaces.findIndex(
      (w) => w.id === workspaceId
    );

    if (workspaceIndex === -1) {
      throw new Error('Workspace not found');
    }

    // Don't allow deletion if it's the only workspace
    if (data.workspaces.length === 1) {
      throw new Error('Cannot delete the last workspace');
    }

    // If deleting the active workspace, switch to another one
    if (data.activeWorkspaceId === workspaceId) {
      const remainingWorkspaces = data.workspaces.filter(
        (w) => w.id !== workspaceId
      );
      data.activeWorkspaceId = remainingWorkspaces[0].id;
    }

    data.workspaces.splice(workspaceIndex, 1);
    this.dataManager.setData(data);
    await this.dataManager.save();
  }

  async switchWorkspace(workspaceId: string): Promise<Workspace> {
    const data = this.dataManager.getData();
    const workspace = data.workspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    data.activeWorkspaceId = workspaceId;
    this.dataManager.setData(data);
    await this.dataManager.save();

    return workspace;
  }

  getActiveWorkspace(): Workspace | null {
    const data = this.dataManager.getData();
    return data.workspaces.find((w) => w.id === data.activeWorkspaceId) || null;
  }

  getAllWorkspaces(): Workspace[] {
    const data = this.dataManager.getData();
    return [...data.workspaces];
  }

  getWorkspaceById(workspaceId: string): Workspace | null {
    const data = this.dataManager.getData();
    return data.workspaces.find((w) => w.id === workspaceId) || null;
  }

  async validateWorkspaceFiles(workspaceId: string): Promise<string[]> {
    const workspace = this.getWorkspaceById(workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const missingFiles: string[] = [];

    for (const slot of workspace.slots) {
      const file = this.app.vault.getAbstractFileByPath(slot.notePath);
      if (!file) {
        missingFiles.push(slot.notePath);
      }
    }

    return missingFiles;
  }
}
