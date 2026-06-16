/**
 * Output guardrails — basic PII detection in LLM responses.
 */

const PII_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: 'phone_it', pattern: /\b(?:\+39\s?)?3\d{2}[\s.-]?\d{6,7}\b/g },
  { name: 'codice_fiscale', pattern: /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi },
  { name: 'iban_it', pattern: /\bIT\d{2}[A-Z]\d{10}[A-Z0-9]{12}\b/gi },
];

export interface PiiScanResult {
  hasPii: boolean;
  types: string[];
  redacted: string;
}

export function scanAndRedactPii(text: string, redact = false): PiiScanResult {
  const types = new Set<string>();
  let redacted = text;

  for (const { name, pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      types.add(name);
      if (redact) {
        redacted = redacted.replace(pattern, `[REDACTED_${name.toUpperCase()}]`);
      }
    }
  }

  return {
    hasPii: types.size > 0,
    types: [...types],
    redacted,
  };
}

export function formatPiiNotice(types: string[]): string {
  if (types.length === 0) return '';
  return `\n\n---\n⚠️ Output potrebbe contenere PII (${types.join(', ')}). Verifica prima di condividere.`;
}
