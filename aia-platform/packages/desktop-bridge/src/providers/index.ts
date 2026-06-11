/**
 * Provider factory — auto-selects the correct OS provider.
 *
 * Callers never import a platform provider directly; they use
 * `createProvider()` which returns the right implementation.
 */

import type { DesktopProvider } from '../types.js';

/**
 * Instantiate the correct provider for the current OS.
 *
 * @throws {Error} If the current platform is not supported.
 */
export async function createProvider(): Promise<DesktopProvider> {
  const platform = process.platform;

  if (platform === 'win32') {
    const { WindowsProvider } = await import('./windows.js');
    return new WindowsProvider();
  }

  if (platform === 'darwin') {
    const { MacOSProvider } = await import('./macos.js');
    return new MacOSProvider();
  }

  throw new Error(
    `@aia/desktop-bridge does not support platform "${platform}". ` +
    'Supported platforms: win32, darwin (macOS — stub).',
  );
}

export type { DesktopProvider };
