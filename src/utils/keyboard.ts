import { Platform } from 'obsidian';

export class KeyboardUtils {
  static getModifierKey(): string {
    return Platform.isMacOS ? 'Cmd' : 'Ctrl';
  }

  static formatHotkey(hotkey: string): string {
    return hotkey.replace(/Ctrl/g, this.getModifierKey());
  }

  static parseHotkey(hotkey: string): {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
    key: string;
  } {
    const parts = hotkey.toLowerCase().split('+');
    return {
      ctrl: parts.includes('ctrl') || parts.includes('cmd'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd'),
      key: parts[parts.length - 1],
    };
  }

  static matchesEvent(
    event: {
      ctrlKey: boolean;
      altKey: boolean;
      shiftKey: boolean;
      metaKey: boolean;
      key: string;
    },
    hotkey: string
  ): boolean {
    const parsed = this.parseHotkey(hotkey);

    return (
      event.ctrlKey === parsed.ctrl &&
      event.altKey === parsed.alt &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta &&
      event.key.toLowerCase() === parsed.key.toLowerCase()
    );
  }

  static isSlotKey(key: string): boolean {
    return /^[1-9]$/.test(key);
  }

  static getSlotNumber(key: string): number | null {
    const match = key.match(/[1-9]/);
    return match ? parseInt(match[0]) : null;
  }

  static getSlotHotkey(slotNumber: number): string {
    const modifier = this.getModifierKey();
    return `${modifier}+${slotNumber}`;
  }

  static isNavigationKey(key: string): boolean {
    return [
      'arrowup',
      'arrowdown',
      'arrowleft',
      'arrowright',
      'enter',
      'escape',
      'tab',
    ].includes(key.toLowerCase());
  }

  static isEscapeKey(key: string): boolean {
    return key.toLowerCase() === 'escape';
  }

  static isEnterKey(key: string): boolean {
    return key.toLowerCase() === 'enter';
  }
}
