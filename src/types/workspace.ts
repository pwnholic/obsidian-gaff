export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  slots: Slot[];
}

export interface Slot {
  id: string;
  notePath: string;
  isMissing?: boolean;
}
