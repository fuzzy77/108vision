/**
 * Terminal Markdown Renderer — Converts Markdown to ANSI-styled terminal output.
 *
 * Lightweight, zero-dependency renderer for interactive shell display.
 * Supports: bold, italic, code, headers, lists, blockquotes, code blocks.
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const ITALIC = '\x1b[3m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

export function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // Code block toggle
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        const label = codeBlockLang ? ` ${codeBlockLang}` : '';
        output.push(`  ${DIM}┌──${label}${'─'.repeat(Math.max(0, 40 - label.length))}${RESET}`);
      } else {
        inCodeBlock = false;
        codeBlockLang = '';
        output.push(`  ${DIM}└${'─'.repeat(43)}${RESET}`);
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(`  ${DIM}│${RESET} ${line}`);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      output.push(`  ${BOLD}${CYAN}${line.slice(4)}${RESET}`);
      continue;
    }
    if (line.startsWith('## ')) {
      output.push(`  ${BOLD}${GREEN}${line.slice(3)}${RESET}`);
      continue;
    }
    if (line.startsWith('# ')) {
      output.push(`\n  ${BOLD}${GREEN}${line.slice(2)}${RESET}`);
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      output.push(`  ${DIM}│${RESET} ${ITALIC}${line.slice(2)}${RESET}`);
      continue;
    }

    // Unordered lists
    if (/^\s*[-*]\s/.test(line)) {
      const content = line.replace(/^\s*[-*]\s/, '');
      const indent = line.match(/^\s*/)?.[0] ?? '';
      output.push(`  ${indent}${YELLOW}•${RESET} ${renderInline(content)}`);
      continue;
    }

    // Ordered lists
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
      if (match) {
        output.push(`  ${match[1]}${YELLOW}${match[2]}.${RESET} ${renderInline(match[3] ?? '')}`);
        continue;
      }
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      output.push(`  ${DIM}${'─'.repeat(44)}${RESET}`);
      continue;
    }

    // Regular paragraph
    output.push(`  ${renderInline(line)}`);
  }

  return output.join('\n');
}

function renderInline(text: string): string {
  // Bold + italic (***text***)
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, `${BOLD}${ITALIC}$1${RESET}`);
  // Bold (**text**)
  text = text.replace(/\*\*(.+?)\*\*/g, `${BOLD}$1${RESET}`);
  // Italic (*text*)
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, `${ITALIC}$1${RESET}`);
  // Inline code (`text`)
  text = text.replace(/`([^`]+)`/g, `${MAGENTA}$1${RESET}`);
  // Links [text](url) — show text only
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, `${CYAN}$1${RESET}`);
  return text;
}

/**
 * Render a tool execution progress spinner line.
 */
export function renderToolStart(tool: string, detail?: string): string {
  const desc = detail ? `: ${detail}` : '';
  return `  ${YELLOW}⠋${RESET} ${tool}${desc}`;
}

export function renderToolDone(tool: string, detail?: string, durationMs?: number): string {
  const desc = detail ? `: ${detail}` : '';
  const dur = durationMs != null ? ` ${GRAY}(${formatDuration(durationMs)})${RESET}` : '';
  return `  ${GREEN}✓${RESET} ${tool}${desc}${dur}`;
}

export function renderToolError(tool: string, error: string): string {
  return `  \x1b[31m✗${RESET} ${tool}: ${error}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
