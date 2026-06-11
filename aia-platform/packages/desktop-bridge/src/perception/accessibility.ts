/**
 * Accessibility reader — wraps the provider's UI tree traversal with
 * higher-level helpers for searching and extracting text.
 */

import type { DesktopProvider, UIElement } from '../types.js';

export class AccessibilityReader {
  constructor(private readonly provider: DesktopProvider) {}

  /**
   * Return the full UI element tree for the specified window.
   * @param depth Maximum tree depth to retrieve (default: 5).
   */
  async getTree(handle: number, depth = 5): Promise<UIElement[]> {
    return this.provider.getUITree(handle, depth);
  }

  /**
   * Flatten the UI tree and extract all text-like content.
   * Useful for quick "what text is visible in this window?" checks.
   */
  async extractText(handle: number): Promise<string> {
    const tree = await this.getTree(handle, 8);
    const texts: string[] = [];
    collectText(tree, texts);
    return texts
      .filter((t) => t.trim().length > 0)
      .join('\n');
  }

  /**
   * Find elements in the UI tree whose name or value matches a query string
   * (case-insensitive).
   */
  async findByName(handle: number, name: string): Promise<UIElement[]> {
    const tree = await this.getTree(handle, 8);
    const matches: UIElement[] = [];
    const q = name.toLowerCase();
    searchElements(tree, (el) => {
      if (
        el.name.toLowerCase().includes(q) ||
        el.value.toLowerCase().includes(q) ||
        el.automationId?.toLowerCase().includes(q)
      ) {
        matches.push(el);
      }
    });
    return matches;
  }

  /**
   * Find elements by role (e.g. "button", "textfield").
   */
  async findByRole(handle: number, role: string): Promise<UIElement[]> {
    const tree = await this.getTree(handle, 8);
    const matches: UIElement[] = [];
    const r = role.toLowerCase();
    searchElements(tree, (el) => {
      if (el.role.toLowerCase() === r) matches.push(el);
    });
    return matches;
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function collectText(elements: UIElement[], out: string[]): void {
  for (const el of elements) {
    if (el.name) out.push(el.name);
    if (el.value && el.value !== el.name) out.push(el.value);
    if (el.children.length > 0) collectText(el.children, out);
  }
}

function searchElements(
  elements: UIElement[],
  predicate: (el: UIElement) => void,
): void {
  for (const el of elements) {
    predicate(el);
    if (el.children.length > 0) searchElements(el.children, predicate);
  }
}
