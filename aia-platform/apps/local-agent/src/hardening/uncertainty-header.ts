/**
 * Uncertainty Header — surfaces the highest uncertainty marker in a response.
 * Implements Principio 4 (Ownership/Epistemic Integrity).
 */

export type UncertaintyLevel = 'verified' | 'likely' | 'unverified' | 'unknown';

const MARKERS: { pattern: RegExp; level: UncertaintyLevel; priority: number }[] = [
  { pattern: /\[ignoto\]/i, level: 'unknown', priority: 4 },
  { pattern: /\[non verificato\]/i, level: 'unverified', priority: 3 },
  { pattern: /\[probabile\]/i, level: 'likely', priority: 2 },
  { pattern: /\[verificato\]/i, level: 'verified', priority: 1 },
];

const ICONS: Record<UncertaintyLevel, string> = {
  verified: '✅',
  likely: '🟡',
  unverified: '🟠',
  unknown: '🔴',
};

const LABELS: Record<UncertaintyLevel, string> = {
  verified: 'Risposta verificata',
  likely: 'Contiene inferenze probabili',
  unverified: 'Contiene affermazioni non verificate — conferma prima di agire',
  unknown: 'L\'AI ha dichiarato di non sapere qualcosa — verifica',
};

export function detectHighestUncertainty(text: string): UncertaintyLevel | null {
  let highest: { level: UncertaintyLevel; priority: number } | null = null;

  for (const marker of MARKERS) {
    if (marker.pattern.test(text)) {
      if (!highest || marker.priority > highest.priority) {
        highest = { level: marker.level, priority: marker.priority };
      }
    }
  }

  return highest?.level ?? null;
}

export function formatUncertaintyHeader(level: UncertaintyLevel | null): string | null {
  if (!level || level === 'verified') return null;
  return `${ICONS[level]} ${LABELS[level]}`;
}

export function prependUncertaintyHeader(response: string): string {
  const level = detectHighestUncertainty(response);
  const header = formatUncertaintyHeader(level);
  if (!header) return response;
  return `${header}\n${'─'.repeat(50)}\n${response}`;
}
