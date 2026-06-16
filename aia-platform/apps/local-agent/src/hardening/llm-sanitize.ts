/**
 * LLM input sanitization — OWASP LLM Top 10 baseline.
 * Blocks obvious prompt-injection patterns before gateway call.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(your|the)\s+(system|safety)/i,
  /you\s+are\s+now\s+(DAN|jailbreak)/i,
  /<\s*script[\s>]/i,
  /```\s*system/i,
  /\bexec\s*\(\s*['"]/i,
];

export interface SanitizeResult {
  safe: boolean;
  sanitized: string;
  warnings: string[];
}

export function sanitizeLlmInput(input: string): SanitizeResult {
  const warnings: string[] = [];
  let sanitized = input.replace(/\0/g, '');

  if (sanitized.length > 32_000) {
    sanitized = sanitized.slice(0, 32_000);
    warnings.push('Input troncato a 32k caratteri');
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        safe: false,
        sanitized,
        warnings: ['Pattern prompt-injection rilevato — richiesta bloccata'],
      };
    }
  }

  return { safe: true, sanitized, warnings };
}
