declare module 'systray2' {
  interface SystrayItem {
    title: string;
    tooltip: string;
    checked: boolean;
    enabled: boolean;
  }

  interface SystrayClickAction {
    item?: { title?: string };
  }

  export default class SysTray {
    constructor(config: {
      copyDirectory: string;
      icon: string;
      title: string;
      tooltip: string;
      items: Array<SystrayItem | unknown>;
    });
    onClick(callback: (action: SystrayClickAction) => void): void;
    sendAction(action: unknown): void;
    kill(): void;
  }

  export const separator: unknown;
}
