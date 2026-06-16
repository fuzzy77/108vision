export const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[90m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
} as const;

export function bold(s: string): string {
  return `${C.bold}${s}${C.reset}`;
}

export function dim(s: string): string {
  return `${C.dim}${s}${C.reset}`;
}

export function green(s: string): string {
  return `${C.green}${s}${C.reset}`;
}

export function yellow(s: string): string {
  return `${C.yellow}${s}${C.reset}`;
}

export function red(s: string): string {
  return `${C.red}${s}${C.reset}`;
}

export function cyan(s: string): string {
  return `${C.cyan}${s}${C.reset}`;
}

export function box(title: string, lines: string[], width = 72): string {
  const inner = width - 4;
  const hr = '─'.repeat(inner);
  const out: string[] = [
    `  ${C.cyan}┌${hr}┐${C.reset}`,
    `  ${C.cyan}│${C.reset} ${bold(title.padEnd(inner - 1))}${C.cyan}│${C.reset}`,
    `  ${C.cyan}├${hr}┤${C.reset}`,
  ];
  for (const line of lines) {
    const trimmed = line.length > inner ? `${line.slice(0, inner - 1)}…` : line;
    out.push(`  ${C.cyan}│${C.reset} ${trimmed.padEnd(inner)} ${C.cyan}│${C.reset}`);
  }
  out.push(`  ${C.cyan}└${hr}┘${C.reset}`);
  return out.join('\n');
}
