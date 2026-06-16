import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { parseCommandDefinition } from '../schemas.js';
import type { CommandDefinition } from '../types.js';

const SUPPORTED_EXTENSIONS = new Set(['.yml', '.yaml', '.json']);

export function isCommandFile(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.has(extname(fileName).toLowerCase());
}

/** Parse a command definition from a YAML or JSON file */
export function parseCommandFile(filePath: string): CommandDefinition {
  const rawText = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  let doc: unknown;
  if (ext === '.json') {
    doc = JSON.parse(rawText) as unknown;
  } else {
    doc = parseYaml(rawText) as unknown;
  }

  return parseCommandDefinition(doc);
}
