export interface Slot {
  id: string;
  notePath: string;
  isMissing?: boolean;
}

export interface SlotAction {
  type: 'add' | 'remove';
  slot: Slot;
  timestamp: number;
}
