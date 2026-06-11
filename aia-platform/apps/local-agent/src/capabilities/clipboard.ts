/**
 * Clipboard Capability — Read and write system clipboard content.
 *
 * Uses the 'clipboardy' package for cross-platform clipboard access.
 * Handles graceful fallback when clipboard is not available (headless/SSH sessions).
 */

/**
 * Read current clipboard text content.
 */
export async function readClipboard(): Promise<{ content: string; length: number }> {
  try {
    const clipboardy = await import('clipboardy');
    const content = await clipboardy.default.read();

    return {
      content,
      length: content.length,
    };
  } catch (error) {
    throw new Error(
      `Clipboard read failed: ${error instanceof Error ? error.message : 'Clipboard not available'}`,
    );
  }
}

/**
 * Write text to the system clipboard.
 */
export async function writeClipboard(
  text: string,
): Promise<{ written: boolean; length: number }> {
  if (!text && text !== '') {
    throw new Error('Clipboard write requires a text value');
  }

  // Limit clipboard content to 1MB to prevent issues
  const maxLength = 1_000_000;
  if (text.length > maxLength) {
    throw new Error(
      `Text too large for clipboard: ${text.length} chars (max ${maxLength})`,
    );
  }

  try {
    const clipboardy = await import('clipboardy');
    await clipboardy.default.write(text);

    return {
      written: true,
      length: text.length,
    };
  } catch (error) {
    throw new Error(
      `Clipboard write failed: ${error instanceof Error ? error.message : 'Clipboard not available'}`,
    );
  }
}
