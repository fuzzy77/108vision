/**
 * smart-chunk.ts
 * Smart chunking module for 108 AI Desktop Agent.
 * Reduces large file/output content to only the relevant parts before sending to LLM.
 *
 * No external dependencies — pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ChunkResult {
  /** The reduced content to send to the LLM */
  content: string;
  /** Characters in the original input */
  originalSize: number;
  /** Characters after chunking */
  reducedSize: number;
  /** Percentage of characters saved (0–100) */
  reductionPercent: number;
  /** Which strategy was applied */
  strategy: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_CHARS = 8_000;

const STOPWORDS_IT = new Set([
  "il", "lo", "la", "le", "i", "gli", "un", "una", "di", "da", "in",
  "per", "con", "su", "tra", "fra", "che", "cosa", "come", "dove",
  "quando", "questo", "quello", "mio", "tuo", "suo", "nei", "nel",
  "nella", "del", "della", "dei", "delle", "cerca", "trova", "mostra",
  "dimmi", "fammi", "voglio", "puoi", "file", "tutti",
]);

const STOPWORDS_EN = new Set([
  "the", "a", "an", "in", "on", "at", "to", "for", "of", "with", "from",
  "by", "is", "are", "was", "were", "find", "show", "get", "tell", "me",
  "my", "this", "that", "what", "where", "when", "how", "all", "file",
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract meaningful keywords from a user query by stripping stopwords,
 * punctuation, and very short tokens.
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => {
      if (token.length < 2) return false;
      if (STOPWORDS_IT.has(token)) return false;
      if (STOPWORDS_EN.has(token)) return false;
      return true;
    });
}

/**
 * Detect the likely type of structured content.
 * Returns one of: "json" | "csv" | "log" | "code" | "markdown" | "unknown"
 */
function detectStructure(content: string): "json" | "csv" | "log" | "code" | "markdown" | "unknown" {
  const trimmed = content.trimStart();

  // JSON
  if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.endsWith("}") || trimmed.endsWith("]")) {
    try {
      JSON.parse(content);
      return "json";
    } catch {
      // not valid JSON — fall through
    }
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    // might be truncated JSON — try a heuristic
    if ((content.match(/\{/g) ?? []).length > 2 && (content.match(/:/g) ?? []).length > 2) {
      return "json";
    }
  }

  // CSV — first line has commas, second line also has the same number of commas
  const lines = content.split("\n");
  if (lines.length >= 2) {
    const firstCommas = (lines[0]!.match(/,/g) ?? []).length;
    const secondCommas = (lines[1]!.match(/,/g) ?? []).length;
    if (firstCommas >= 2 && firstCommas === secondCommas) return "csv";
  }

  // Log files — multiple lines with common log patterns
  const logPattern = /\d{2}[:/\-]\d{2}[:/\-]\d{2,4}|ERROR|WARN|INFO|DEBUG|TRACE|\[ERROR\]|\[WARN\]/;
  const logMatches = lines.slice(0, 20).filter((l) => logPattern.test(l)).length;
  if (logMatches >= 3) return "log";

  // Markdown
  if (/^#{1,6} /m.test(content) && /\*\*|__|\[.+\]\(.+\)/.test(content)) return "markdown";

  // Code — rough heuristic: function/class/import keywords
  const codeKeywords = /\b(function|class|import|export|const|let|var|def|public|private|protected|return|if|for|while)\b/;
  const codeLines = lines.slice(0, 30).filter((l) => codeKeywords.test(l)).length;
  if (codeLines >= 3) return "code";

  return "unknown";
}

/**
 * Build a human-readable omission marker.
 */
function omissionMarker(count: number): string {
  return `\n... [${count} line${count === 1 ? "" : "s"} omitted] ...\n`;
}

/**
 * Truncate a string to maxChars, appending a note if truncated.
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + `\n... [truncated, ${text.length - maxChars} chars omitted]`;
}

// ---------------------------------------------------------------------------
// Strategy: chunkHeadTail
// ---------------------------------------------------------------------------

/**
 * Simple head + tail strategy.
 * Returns the first `headLines` lines, an omission marker, and the last `tailLines` lines.
 */
export function chunkHeadTail(
  content: string,
  headLines = 50,
  tailLines = 30,
): string {
  const lines = content.split("\n");
  const total = lines.length;

  if (total <= headLines + tailLines) {
    // No need to cut
    return content;
  }

  const head = lines.slice(0, headLines);
  const tail = lines.slice(total - tailLines);
  const omitted = total - headLines - tailLines;

  return [...head, omissionMarker(omitted), ...tail].join("\n");
}

// ---------------------------------------------------------------------------
// Strategy: chunkByRelevantLines
// ---------------------------------------------------------------------------

interface LineRange {
  start: number;
  end: number;
  score: number;
}

/**
 * Grep for query keywords, include context lines around each match,
 * deduplicate overlapping ranges, and add omission markers between gaps.
 */
export function chunkByRelevantLines(
  content: string,
  query: string,
  contextLines = 5,
): string {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) {
    return chunkHeadTail(content);
  }

  const lines = content.split("\n");
  const total = lines.length;

  // For each line compute a relevance score (number of keyword hits)
  const lineScores: number[] = new Array(total).fill(0);
  for (let i = 0; i < total; i++) {
    const lower = lines[i]!.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) lineScores[i]!++;
    }
  }

  // Collect ranges around matching lines
  const rawRanges: LineRange[] = [];
  for (let i = 0; i < total; i++) {
    if (lineScores[i]! > 0) {
      rawRanges.push({
        start: Math.max(0, i - contextLines),
        end: Math.min(total - 1, i + contextLines),
        score: lineScores[i]!,
      });
    }
  }

  if (rawRanges.length === 0) {
    // No keyword matches — fall back to head/tail
    return chunkHeadTail(content);
  }

  // Sort by start index
  rawRanges.sort((a, b) => a.start - b.start);

  // Merge overlapping or adjacent ranges
  const merged: LineRange[] = [];
  for (const range of rawRanges) {
    if (merged.length === 0) {
      merged.push({ ...range });
    } else {
      const last = merged[merged.length - 1]!;
      if (range.start <= last.end + 1) {
        // Overlapping or adjacent — extend
        last.end = Math.max(last.end, range.end);
        last.score = Math.max(last.score, range.score);
      } else {
        merged.push({ ...range });
      }
    }
  }

  // Build output with omission markers
  const parts: string[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) {
      const omitted = range.start - cursor;
      parts.push(omissionMarker(omitted));
    }
    parts.push(lines.slice(range.start, range.end + 1).join("\n"));
    cursor = range.end + 1;
  }
  if (cursor < total) {
    parts.push(omissionMarker(total - cursor));
  }

  const result = parts.join("");

  // If result is still too large, keep only the top-scoring sections
  if (result.length > DEFAULT_MAX_CHARS * 2) {
    // Re-rank merged sections by score and trim
    const scoredParts = merged
      .map((range) => ({
        text: lines.slice(range.start, range.end + 1).join("\n"),
        score: range.score,
      }))
      .sort((a, b) => b.score - a.score);

    let budget = DEFAULT_MAX_CHARS;
    const kept: string[] = [];
    for (const sp of scoredParts) {
      if (budget <= 0) break;
      kept.push(truncate(sp.text, budget));
      budget -= sp.text.length;
    }
    return kept.join("\n...\n");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Strategy: chunkByStructure
// ---------------------------------------------------------------------------

/**
 * Structure-aware chunking.
 * Handles JSON, CSV, code, logs, and Markdown.
 */
export function chunkByStructure(content: string, maxChars = DEFAULT_MAX_CHARS): string {
  const structure = detectStructure(content);

  switch (structure) {
    case "json":
      return chunkJson(content, maxChars);
    case "csv":
      return chunkCsv(content, maxChars);
    case "log":
      return chunkLog(content, maxChars);
    case "code":
      return chunkCode(content, maxChars);
    case "markdown":
      return chunkMarkdown(content, maxChars);
    default:
      return chunkHeadTail(content);
  }
}

/** JSON: keep top-level structure, first item of arrays, truncate deep values */
function chunkJson(content: string, maxChars: number): string {
  try {
    const parsed = JSON.parse(content);
    const reduced = reduceJsonValue(parsed, 0, 3);
    const result = JSON.stringify(reduced, null, 2);
    return truncate(result, maxChars);
  } catch {
    // Invalid JSON — fall back to head/tail
    return chunkHeadTail(content);
  }
}

function reduceJsonValue(value: unknown, depth: number, maxDepth: number): unknown {
  if (depth >= maxDepth) {
    if (typeof value === "string" && value.length > 80) {
      return value.slice(0, 80) + "...[truncated]";
    }
    if (Array.isArray(value) && value.length > 0) {
      return [`[array with ${value.length} items, first:]`, reduceJsonValue(value[0], depth + 1, maxDepth)];
    }
    if (value !== null && typeof value === "object") {
      return `{object with keys: ${Object.keys(value as object).join(", ")}}`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    const sample = value.slice(0, 1).map((item) => reduceJsonValue(item, depth + 1, maxDepth));
    if (value.length > 1) {
      return [...sample, `... [${value.length - 1} more items]`];
    }
    return sample;
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = reduceJsonValue(v, depth + 1, maxDepth);
    }
    return result;
  }

  if (typeof value === "string" && value.length > 200) {
    return value.slice(0, 200) + "...[truncated]";
  }

  return value;
}

/** CSV: keep header + first 10 rows + last 5 rows */
function chunkCsv(content: string, maxChars: number): string {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  if (lines.length <= 16) return truncate(content, maxChars);

  const header = lines[0];
  const dataLines = lines.slice(1);
  const first10 = dataLines.slice(0, 10);
  const last5 = dataLines.slice(-5);
  const omitted = dataLines.length - 15;

  const result = [
    header,
    ...first10,
    omissionMarker(omitted),
    ...last5,
  ].join("\n");

  return truncate(result, maxChars);
}

/** Log files: keep first 10 + last 20 + all ERROR/WARN lines */
function chunkLog(content: string, maxChars: number): string {
  const lines = content.split("\n");
  const total = lines.length;

  if (total <= 30) return truncate(content, maxChars);

  const first10 = lines.slice(0, 10);
  const last20 = lines.slice(-20);
  const errorWarningLines: string[] = [];

  const errorWarnPattern = /\b(ERROR|WARN|FATAL|CRITICAL|Exception|Error:)\b/i;
  for (let i = 10; i < total - 20; i++) {
    if (errorWarnPattern.test(lines[i]!)) {
      errorWarningLines.push(`[line ${i + 1}] ${lines[i]!}`);
    }
  }

  const parts: string[] = [
    "=== First 10 lines ===",
    ...first10,
  ];

  if (errorWarningLines.length > 0) {
    parts.push(`\n=== ERROR/WARN lines (${errorWarningLines.length} found) ===`);
    parts.push(...errorWarningLines.slice(0, 50)); // cap at 50 to avoid blowup
    if (errorWarningLines.length > 50) {
      parts.push(`... [${errorWarningLines.length - 50} more error/warn lines omitted]`);
    }
  }

  const middleOmitted = total - 30 - (errorWarningLines.length > 0 ? 0 : 0);
  if (middleOmitted > 0) {
    parts.push(omissionMarker(middleOmitted));
  }

  parts.push("=== Last 20 lines ===", ...last20);

  return truncate(parts.join("\n"), maxChars);
}

/**
 * Code files: keep imports, class/function/type signatures, skip large bodies.
 * Language-agnostic heuristic.
 */
function chunkCode(content: string, maxChars: number): string {
  const lines = content.split("\n");
  const kept: string[] = [];
  let i = 0;
  let skippedBodyLines = 0;

  // Patterns for "signature" lines we always keep
  const signaturePattern = /^\s*(import |export |from |class |interface |type |enum |function |const |let |var |def |public |private |protected |abstract |async function|module\.exports|@)/;
  // Brace/indent tracking for body skipping — very simplified
  const bodyStartPattern = /\{?\s*$|:\s*$/;
  const closingPattern = /^\s*\}(\s*,|\s*;)?\s*$|^\s*end\s*$/;

  while (i < lines.length) {
    const line = lines[i]!;

    if (signaturePattern.test(line)) {
      if (skippedBodyLines > 0) {
        kept.push(omissionMarker(skippedBodyLines));
        skippedBodyLines = 0;
      }
      kept.push(line);

      // If line opens a body (ends with {), peek ahead:
      // if body is short (< 10 lines), include it entirely
      // otherwise skip to closing brace
      if (bodyStartPattern.test(line) && line.includes("{")) {
        let depth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
        let j = i + 1;
        const bodyStart = j;
        while (j < lines.length && depth > 0) {
          depth += (lines[j]!.match(/\{/g) ?? []).length;
          depth -= (lines[j]!.match(/\}/g) ?? []).length;
          j++;
        }
        const bodyLength = j - bodyStart;
        if (bodyLength <= 10) {
          // Include the whole body
          for (let k = bodyStart; k < j; k++) kept.push(lines[k]!);
          i = j;
          continue;
        } else {
          // Skip the body, just show the closing brace
          kept.push(`  ... [body: ${bodyLength} lines] ...`);
          if (j > 0 && j <= lines.length) {
            kept.push(lines[j - 1]!); // closing brace
          }
          skippedBodyLines = 0;
          i = j;
          continue;
        }
      }
    } else if (closingPattern.test(line)) {
      if (skippedBodyLines > 0) {
        kept.push(omissionMarker(skippedBodyLines));
        skippedBodyLines = 0;
      }
      kept.push(line);
    } else {
      skippedBodyLines++;
    }

    i++;
  }

  if (skippedBodyLines > 0) {
    kept.push(omissionMarker(skippedBodyLines));
  }

  return truncate(kept.join("\n"), maxChars);
}

/**
 * Markdown: keep headings and their immediate content, truncate long sections.
 */
function chunkMarkdown(content: string, maxChars: number): string {
  const lines = content.split("\n");
  const kept: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (/^#{1,6} /.test(line)) {
      // Heading — always keep it
      kept.push(line);
      i++;

      // Collect content until next heading, keep up to 10 lines
      const sectionLines: string[] = [];
      while (i < lines.length && !/^#{1,6} /.test(lines[i]!)) {
        sectionLines.push(lines[i]!);
        i++;
      }

      if (sectionLines.length <= 10) {
        kept.push(...sectionLines);
      } else {
        kept.push(...sectionLines.slice(0, 10));
        kept.push(`... [${sectionLines.length - 10} more lines in this section]`);
      }
    } else {
      kept.push(line);
      i++;
    }
  }

  return truncate(kept.join("\n"), maxChars);
}

// ---------------------------------------------------------------------------
// Strategy: chunkByFileType
// ---------------------------------------------------------------------------

/**
 * File-type–aware chunking. Dispatches on file extension.
 */
export function chunkByFileType(
  content: string,
  extension: string,
  query: string,
): string {
  const ext = extension.toLowerCase().replace(/^\./, "");

  switch (ext) {
    case "json":
      return chunkJsonByQuery(content, query);
    case "csv":
      return chunkCsvByQuery(content, query);
    case "log":
    case "txt":
      return chunkLogByQuery(content, query);
    case "ts":
    case "js":
    case "tsx":
    case "jsx":
    case "py":
    case "java":
    case "cs":
    case "go":
    case "rb":
      return chunkCodeByQuery(content, query);
    case "md":
    case "mdx":
      return chunkMarkdownByQuery(content, query);
    default:
      return chunkByRelevantLines(content, query);
  }
}

/** JSON: return only matching keys/paths based on query keywords */
function chunkJsonByQuery(content: string, query: string): string {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return chunkJson(content, DEFAULT_MAX_CHARS);

  try {
    const parsed = JSON.parse(content);
    const matching = extractMatchingJsonPaths(parsed, keywords);
    if (Object.keys(matching).length === 0) {
      // No match by key name — fall back to structure chunking
      return chunkJson(content, DEFAULT_MAX_CHARS);
    }
    return truncate(JSON.stringify(matching, null, 2), DEFAULT_MAX_CHARS);
  } catch {
    return chunkByRelevantLines(content, query);
  }
}

function extractMatchingJsonPaths(
  value: unknown,
  keywords: string[],
  currentPath = "",
  depth = 0,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (depth > 6) return result;

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const keyLower = k.toLowerCase();
      const pathLower = (currentPath + "." + k).toLowerCase();
      const matches = keywords.some((kw) => keyLower.includes(kw) || pathLower.includes(kw));
      if (matches) {
        result[k] = v;
      } else {
        const nested = extractMatchingJsonPaths(v, keywords, currentPath + "." + k, depth + 1);
        if (Object.keys(nested).length > 0) {
          result[k] = nested;
        }
      }
    }
  } else if (Array.isArray(value)) {
    // Search first 5 items
    for (let i = 0; i < Math.min(5, value.length); i++) {
      const nested = extractMatchingJsonPaths(value[i], keywords, currentPath + `[${i}]`, depth + 1);
      if (Object.keys(nested).length > 0) {
        return { [`array[0..${value.length - 1}], sample[${i}]`]: nested };
      }
    }
  }

  return result;
}

/** CSV: header + rows that match query keywords */
function chunkCsvByQuery(content: string, query: string): string {
  const keywords = extractKeywords(query);
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return content;

  const header = lines[0]!;
  if (keywords.length === 0) return chunkCsv(content, DEFAULT_MAX_CHARS);

  const matchingRows: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const lower = lines[i]!.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      matchingRows.push(lines[i]!);
    }
  }

  if (matchingRows.length === 0) {
    // No matches — fall back to structural CSV chunking
    return chunkCsv(content, DEFAULT_MAX_CHARS);
  }

  const result = [header, ...matchingRows.slice(0, 50)].join("\n");
  if (matchingRows.length > 50) {
    return result + `\n... [${matchingRows.length - 50} more matching rows omitted]`;
  }
  return truncate(result, DEFAULT_MAX_CHARS);
}

/** Log: errors/warnings + query-relevant lines */
function chunkLogByQuery(content: string, query: string): string {
  const keywords = extractKeywords(query);
  const lines = content.split("\n");

  const errorWarnPattern = /\b(ERROR|WARN|FATAL|CRITICAL|Exception|Error:)\b/i;
  const relevantLines: Array<{ index: number; line: string; score: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    let score = 0;
    if (errorWarnPattern.test(lines[i]!)) score += 2;
    const lower = lines[i]!.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > 0) {
      relevantLines.push({ index: i, line: lines[i]!, score });
    }
  }

  if (relevantLines.length === 0) return chunkLog(content, DEFAULT_MAX_CHARS);

  // Include 2 lines context around each relevant line
  const ranges: LineRange[] = relevantLines.map((r) => ({
    start: Math.max(0, r.index - 2),
    end: Math.min(lines.length - 1, r.index + 2),
    score: r.score,
  }));

  // Merge
  ranges.sort((a, b) => a.start - b.start);
  const merged: LineRange[] = [];
  for (const range of ranges) {
    if (merged.length === 0) {
      merged.push({ ...range });
    } else {
      const last = merged[merged.length - 1]!;
      if (range.start <= last.end + 1) {
        last.end = Math.max(last.end, range.end);
        last.score = Math.max(last.score, range.score);
      } else {
        merged.push({ ...range });
      }
    }
  }

  const parts: string[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) {
      parts.push(omissionMarker(range.start - cursor));
    }
    parts.push(lines.slice(range.start, range.end + 1).join("\n"));
    cursor = range.end + 1;
  }
  if (cursor < lines.length) {
    parts.push(omissionMarker(lines.length - cursor));
  }

  return truncate(parts.join(""), DEFAULT_MAX_CHARS);
}

/** Code: function/class containing query keywords */
function chunkCodeByQuery(content: string, query: string): string {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return chunkCode(content, DEFAULT_MAX_CHARS);

  const lines = content.split("\n");
  const total = lines.length;

  // Find top-level blocks (function/class/method) that contain the keywords
  const blockPattern = /^\s*(export\s+)?(default\s+)?(async\s+)?(function|class|const|let|var|def|public|private|protected|abstract|interface|type|enum)\b/;

  interface Block {
    start: number;
    end: number;
    score: number;
  }

  const blocks: Block[] = [];
  let blockStart = 0;

  for (let i = 0; i < total; i++) {
    if (blockPattern.test(lines[i]!) && i > blockStart) {
      // Commit previous block
      blocks.push({ start: blockStart, end: i - 1, score: 0 });
      blockStart = i;
    }
  }
  blocks.push({ start: blockStart, end: total - 1, score: 0 });

  // Score each block
  for (const block of blocks) {
    const blockText = lines.slice(block.start, block.end + 1).join("\n").toLowerCase();
    for (const kw of keywords) {
      const count = (blockText.match(new RegExp(kw, "g")) ?? []).length;
      block.score += count;
    }
  }

  const scoredBlocks = blocks.filter((b) => b.score > 0).sort((a, b) => b.score - a.score);

  if (scoredBlocks.length === 0) {
    // No matching blocks — return signatures only
    return chunkCode(content, DEFAULT_MAX_CHARS);
  }

  // Return top matching blocks (up to budget)
  let budget = DEFAULT_MAX_CHARS;
  const parts: string[] = [];
  // Sort back by original order for readability
  scoredBlocks
    .sort((a, b) => a.start - b.start)
    .forEach((block) => {
      if (budget <= 0) return;
      const blockText = lines.slice(block.start, block.end + 1).join("\n");
      parts.push(truncate(blockText, budget));
      budget -= blockText.length;
    });

  return parts.join("\n\n...\n\n");
}

/** Markdown: heading that matches + its content */
function chunkMarkdownByQuery(content: string, query: string): string {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return chunkMarkdown(content, DEFAULT_MAX_CHARS);

  const lines = content.split("\n");
  const sections: Array<{ heading: string; lines: string[]; score: number }> = [];
  let currentHeading = "(intro)";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{1,6} /.test(line)) {
      sections.push({ heading: currentHeading, lines: currentLines, score: 0 });
      currentHeading = line;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  sections.push({ heading: currentHeading, lines: currentLines, score: 0 });

  // Score each section
  for (const section of sections) {
    const text = (section.heading + "\n" + section.lines.join("\n")).toLowerCase();
    for (const kw of keywords) {
      const count = (text.match(new RegExp(kw, "g")) ?? []).length;
      section.score += count;
    }
  }

  const matching = sections.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  if (matching.length === 0) return chunkMarkdown(content, DEFAULT_MAX_CHARS);

  let budget = DEFAULT_MAX_CHARS;
  const parts: string[] = [];
  matching
    .sort((a, b) => sections.indexOf(a) - sections.indexOf(b)) // restore original order
    .forEach((section) => {
      if (budget <= 0) return;
      const text = section.heading + "\n" + section.lines.join("\n");
      parts.push(truncate(text, budget));
      budget -= text.length;
    });

  return parts.join("\n\n---\n\n");
}

// ---------------------------------------------------------------------------
// Main entry point: smartChunk
// ---------------------------------------------------------------------------

/**
 * Given content and a user query, automatically select and apply the best
 * chunking strategy to reduce the content to at most `maxChars` characters,
 * keeping only the most relevant parts.
 */
export function smartChunk(
  content: string,
  query: string,
  maxChars = DEFAULT_MAX_CHARS,
): ChunkResult {
  const originalSize = content.length;

  // Strategy 1: content is small — return as-is
  if (originalSize <= 2_000) {
    return buildResult(content, originalSize, "passthrough");
  }

  const keywords = extractKeywords(query);

  let reduced: string;
  let strategy: string;

  // Strategy 2: query mentions a specific identifier → grep for it
  const hasSpecificIdentifier = keywords.some(
    (kw) => kw.length > 3 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(kw),
  );

  if (hasSpecificIdentifier) {
    reduced = chunkByRelevantLines(content, query);
    strategy = "chunkByRelevantLines";
  } else {
    // Strategy 3: structured content
    const structure = detectStructure(content);
    if (structure !== "unknown") {
      reduced = chunkByStructure(content, maxChars);
      strategy = `chunkByStructure(${structure})`;
    } else {
      // Strategy 4: fallback head/tail
      reduced = chunkHeadTail(content);
      strategy = "chunkHeadTail";
    }
  }

  // Final safety net: if still above maxChars, hard truncate
  if (reduced.length > maxChars) {
    reduced = truncate(reduced, maxChars);
    strategy += "+truncate";
  }

  return buildResult(reduced, originalSize, strategy);
}

function buildResult(content: string, originalSize: number, strategy: string): ChunkResult {
  const reducedSize = content.length;
  const saved = originalSize - reducedSize;
  const reductionPercent = originalSize > 0 ? Math.round((saved / originalSize) * 100) : 0;
  return { content, originalSize, reducedSize, reductionPercent, strategy };
}
