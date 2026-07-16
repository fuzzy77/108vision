/**
 * Fuzzy Edit Engine — 9-strategy cascade for resilient string replacement.
 *
 * Inspired by OpenCode (MIT, sst/opencode) edit.ts.
 * Solves the #1 failure mode of LLM code editing: whitespace/indentation
 * mismatches causing silent no-ops or "not found" errors.
 *
 * Strategy cascade (first match wins):
 *  1. Exact match
 *  2. Line-trimmed (trailing whitespace stripped per line)
 *  3. Block anchor (first/last lines as anchors, fuzzy middle)
 *  4. Whitespace normalized (collapse all ws to single space)
 *  5. Indentation flexible (ignore leading indent differences)
 *  6. Escape normalized (unescape common escape sequences)
 *  7. Trimmed boundary (leading/trailing whitespace on the block)
 *  8. Context aware (50% middle-line match heuristic)
 *  9. Multi-occurrence (yield all exact occurrences)
 *
 * MIT License — attribution: sst/opencode
 */

export interface FuzzyReplaceResult {
  content: string;
  strategy: string;
  matchedText: string;
}

export interface FuzzyReplaceOptions {
  replaceAll?: boolean;
}

export function fuzzyReplace(
  content: string,
  oldString: string,
  newString: string,
  options: FuzzyReplaceOptions = {},
): FuzzyReplaceResult {
  const replacers = [
    simpleReplacer,
    lineTrimmedReplacer,
    blockAnchorReplacer,
    whitespaceNormalizedReplacer,
    indentationFlexibleReplacer,
    escapeNormalizedReplacer,
    trimmedBoundaryReplacer,
    contextAwareReplacer,
    multiOccurrenceReplacer,
  ];

  let multipleMatchesFound = false;

  for (const replacer of replacers) {
    for (const candidate of replacer(content, oldString)) {
      const idx = content.indexOf(candidate);
      if (idx === -1) continue;

      if (isDisproportionateMatch(candidate, oldString)) continue;

      if (options.replaceAll) {
        return {
          content: content.replaceAll(candidate, newString),
          strategy: replacer.name,
          matchedText: candidate,
        };
      }

      const lastIdx = content.lastIndexOf(candidate);
      if (idx !== lastIdx) {
        multipleMatchesFound = true;
        continue;
      }

      return {
        content: content.slice(0, idx) + newString + content.slice(idx + candidate.length),
        strategy: replacer.name,
        matchedText: candidate,
      };
    }
  }

  if (multipleMatchesFound) {
    throw new FuzzyEditError(
      'MULTIPLE_MATCHES',
      `Found multiple matches for the search string. Use replaceAll or provide more context.`,
    );
  }

  throw new FuzzyEditError(
    'NOT_FOUND',
    `Could not find oldString in file (tried 9 strategies). First 80 chars: "${oldString.slice(0, 80)}"`,
  );
}

export class FuzzyEditError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'MULTIPLE_MATCHES',
    message: string,
  ) {
    super(message);
    this.name = 'FuzzyEditError';
  }
}

// --- Strategy 1: Exact match ---

function* simpleReplacer(content: string, find: string): Generator<string> {
  if (content.includes(find)) {
    yield find;
  }
}

// --- Strategy 2: Line-trimmed (strip trailing whitespace per line) ---

function* lineTrimmedReplacer(content: string, find: string): Generator<string> {
  const contentLines = content.split('\n');
  const findLines = find.split('\n');

  if (findLines.length === 1) {
    const trimmedFind = find.trim();
    if (!trimmedFind) return;
    for (let i = 0; i < contentLines.length; i++) {
      if (contentLines[i]!.trim() === trimmedFind) {
        yield contentLines[i]!;
      }
    }
    return;
  }

  const trimmedFindLines = findLines.map((l) => l.trimEnd());

  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    let matches = true;
    for (let j = 0; j < findLines.length; j++) {
      if (contentLines[i + j]!.trimEnd() !== trimmedFindLines[j]!) {
        matches = false;
        break;
      }
    }
    if (matches) {
      yield contentLines.slice(i, i + findLines.length).join('\n');
    }
  }
}

// --- Strategy 3: Block anchor (first+last line as anchors, fuzzy middle) ---

function* blockAnchorReplacer(content: string, find: string): Generator<string> {
  const findLines = find.split('\n');
  if (findLines.length < 3) return;

  const contentLines = content.split('\n');
  const firstAnchor = findLines[0]!.trim();
  const lastAnchor = findLines[findLines.length - 1]!.trim();
  const expectedLen = findLines.length;
  const tolerance = Math.ceil(expectedLen * 0.25);

  const candidates: Array<{ start: number; end: number; score: number }> = [];

  for (let i = 0; i < contentLines.length; i++) {
    if (contentLines[i]!.trim() !== firstAnchor) continue;

    const minEnd = i + expectedLen - tolerance;
    const maxEnd = i + expectedLen + tolerance;

    for (let e = Math.max(i + 2, minEnd); e <= Math.min(contentLines.length - 1, maxEnd); e++) {
      if (contentLines[e]!.trim() !== lastAnchor) continue;

      const middleContent = contentLines.slice(i + 1, e);
      const middleFind = findLines.slice(1, -1);
      const score = computeMiddleSimilarity(middleContent, middleFind);

      if (score >= 0.65) {
        candidates.push({ start: i, end: e, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const c of candidates) {
    yield contentLines.slice(c.start, c.end + 1).join('\n');
  }
}

// --- Strategy 4: Whitespace normalized (collapse to single space) ---

function* whitespaceNormalizedReplacer(content: string, find: string): Generator<string> {
  const normalizedFind = find.replace(/\s+/g, ' ').trim();
  if (!normalizedFind) return;

  const findLines = find.split('\n');

  if (findLines.length === 1) {
    const contentLines = content.split('\n');
    for (const line of contentLines) {
      if (line.replace(/\s+/g, ' ').trim() === normalizedFind) {
        yield line;
      }
    }
    return;
  }

  const contentLines = content.split('\n');
  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    const block = contentLines.slice(i, i + findLines.length).join('\n');
    if (block.replace(/\s+/g, ' ').trim() === normalizedFind) {
      yield block;
    }
  }
}

// --- Strategy 5: Indentation flexible (ignore leading indent) ---

function* indentationFlexibleReplacer(content: string, find: string): Generator<string> {
  const findLines = find.split('\n');
  if (findLines.length < 2) return;

  const contentLines = content.split('\n');
  const findStripped = stripMinIndent(findLines);

  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    const candidateLines = contentLines.slice(i, i + findLines.length);
    const candidateStripped = stripMinIndent(candidateLines);

    if (candidateStripped.length !== findStripped.length) continue;

    let matches = true;
    for (let j = 0; j < findStripped.length; j++) {
      if (candidateStripped[j] !== findStripped[j]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      yield candidateLines.join('\n');
    }
  }
}

// --- Strategy 6: Escape normalized ---

function* escapeNormalizedReplacer(content: string, find: string): Generator<string> {
  const unescaped = unescapeString(find);
  if (unescaped === find) return;

  if (content.includes(unescaped)) {
    yield unescaped;
    return;
  }

  const contentLines = content.split('\n');
  const findLines = unescaped.split('\n');

  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    const block = contentLines.slice(i, i + findLines.length).join('\n');
    if (unescapeString(block) === unescaped) {
      yield block;
    }
  }
}

// --- Strategy 7: Trimmed boundary ---

function* trimmedBoundaryReplacer(content: string, find: string): Generator<string> {
  const trimmed = find.trim();
  if (trimmed === find) return;
  if (!trimmed) return;

  if (content.includes(trimmed)) {
    yield trimmed;
    return;
  }

  const contentLines = content.split('\n');
  const trimmedLines = trimmed.split('\n');

  for (let i = 0; i <= contentLines.length - trimmedLines.length; i++) {
    const block = contentLines.slice(i, i + trimmedLines.length).join('\n');
    if (block.trim() === trimmed) {
      yield block;
    }
  }
}

// --- Strategy 8: Context aware (50% middle-line heuristic) ---

function* contextAwareReplacer(content: string, find: string): Generator<string> {
  const findLines = find.split('\n');
  if (findLines.length < 3) return;

  const contentLines = content.split('\n');
  const firstTrimmed = findLines[0]!.trim();
  const lastTrimmed = findLines[findLines.length - 1]!.trim();

  for (let i = 0; i < contentLines.length; i++) {
    if (contentLines[i]!.trim() !== firstTrimmed) continue;

    const end = i + findLines.length - 1;
    if (end >= contentLines.length) continue;
    if (contentLines[end]!.trim() !== lastTrimmed) continue;

    const middleContent = contentLines.slice(i + 1, end);
    const middleFind = findLines.slice(1, -1);

    if (middleContent.length !== middleFind.length) continue;

    let matchCount = 0;
    for (let j = 0; j < middleFind.length; j++) {
      if (middleContent[j]!.trim() === middleFind[j]!.trim()) {
        matchCount++;
      }
    }

    if (matchCount >= Math.ceil(middleFind.length * 0.5)) {
      yield contentLines.slice(i, end + 1).join('\n');
    }
  }
}

// --- Strategy 9: Multi-occurrence (yield all exact occurrences) ---

function* multiOccurrenceReplacer(content: string, find: string): Generator<string> {
  let idx = content.indexOf(find);
  while (idx !== -1) {
    yield find;
    idx = content.indexOf(find, idx + 1);
  }
}

// --- Helpers ---

function isDisproportionateMatch(matched: string, original: string): boolean {
  const matchedLines = matched.split('\n').length;
  const originalLines = original.split('\n').length;
  const maxLines = Math.max(originalLines + 3, originalLines * 2);
  if (matchedLines > maxLines) return true;

  const matchedLen = matched.trim().length;
  const originalLen = original.trim().length;
  const maxLen = Math.max(originalLen + 500, originalLen * 4);
  return matchedLen > maxLen;
}

function stripMinIndent(lines: string[]): string[] {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return lines;

  const minIndent = Math.min(
    ...nonEmpty.map((l) => {
      const match = l.match(/^(\s*)/);
      return match ? match[1]!.length : 0;
    }),
  );

  return lines.map((l) => l.slice(minIndent));
}

function unescapeString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\`/g, '`')
    .replace(/\\\$/g, '$');
}

function computeMiddleSimilarity(contentLines: string[], findLines: string[]): number {
  if (findLines.length === 0) return 1;

  let totalScore = 0;
  const maxLen = Math.max(contentLines.length, findLines.length);

  for (let i = 0; i < maxLen; i++) {
    const cl = contentLines[i]?.trim() ?? '';
    const fl = findLines[i]?.trim() ?? '';

    if (cl === fl) {
      totalScore += 1;
    } else if (cl && fl) {
      totalScore += levenshteinSimilarity(cl, fl);
    }
  }

  return totalScore / maxLen;
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  // Short-circuit for very different lengths
  if (Math.abs(a.length - b.length) > maxLen * 0.5) return 0;

  // Bounded Levenshtein — cap at 200 chars for performance
  const aa = a.length > 200 ? a.slice(0, 200) : a;
  const bb = b.length > 200 ? b.slice(0, 200) : b;

  const matrix: number[][] = [];
  for (let i = 0; i <= aa.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= bb.length; j++) {
      if (i === 0) {
        matrix[i]![j] = j;
      } else {
        const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j - 1]! + cost,
        );
      }
    }
  }

  const distance = matrix[aa.length]![bb.length]!;
  return 1 - distance / Math.max(aa.length, bb.length);
}
