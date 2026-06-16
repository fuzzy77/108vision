/**
 * Microsoft Word COM Automation adapter for the 108 AI Desktop Agent.
 *
 * All operations are dispatched as PowerShell scripts that drive Word via
 * COM (Component Object Model). Requires Microsoft Word to be installed on
 * the Windows host.
 *
 * Implementation notes:
 * - PowerShell is invoked via `child_process.execFile` (promisified).
 * - Every script opens Word invisible, performs exactly one logical operation,
 *   then closes/quits and releases the COM object in a `finally` block.
 * - Output between scripts is exchanged as JSON serialised to stdout.
 * - All paths are resolved to absolute before being handed to PowerShell.
 * - Default operation timeout: 30 seconds.
 */

import { execFile as _execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve as resolvePath, dirname, basename, extname, join } from 'node:path';
import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface WordDocumentInfo {
  title: string;
  author: string;
  pages: number;
  words: number;
  characters: number;
  lastModified: string;
}

export interface WordBookmark {
  name: string;
  text: string;
}

export interface WordTable {
  index: number;
  rows: number;
  cols: number;
  data: string[][];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const execFile = promisify(_execFile);
const TIMEOUT_MS = 30_000;

/**
 * Escape a string for safe embedding inside a PowerShell single-quoted string.
 * Single quotes are the only character that needs escaping in PS single-quoted
 * strings (doubled: `''`).
 */
function escapePsString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Run a PowerShell script and return its stdout as a string.
 * Throws on non-zero exit or if the script writes to stderr.
 */
async function runPowerShell(script: string): Promise<string> {
  const { stdout, stderr } = await execFile(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: TIMEOUT_MS, maxBuffer: 50 * 1024 * 1024 },
  );

  if (stderr?.trim()) {
    throw new Error(`PowerShell stderr: ${stderr.trim()}`);
  }

  return stdout ?? '';
}

/**
 * Assert the given path exists on disk (for read operations).
 */
function assertExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

/**
 * Boilerplate that wraps the body of a PS script with Word COM lifecycle
 * management (open invisible, finally close+quit+release).
 *
 * `saveOnClose` — pass `$true` to save changes, `$false` (default) to discard.
 */
function wordScript(
  absPath: string,
  body: string,
  saveOnClose: '$true' | '$false' = '$false',
): string {
  const escaped = escapePsString(absPath);
  return `
$ErrorActionPreference = 'Stop'
$word = $null
$doc  = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Open('${escaped}')
${body}
} finally {
  if ($doc  -ne $null) { $doc.Close([ref]${saveOnClose}) }
  if ($word -ne $null) { $word.Quit() }
  if ($word -ne $null) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null }
}
`.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the full plain text of a Word document.
 */
export async function readDocument(filePath: string): Promise<string> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const script = wordScript(
    abs,
    `  $text = $doc.Content.Text\n  Write-Output $text`,
  );

  return (await runPowerShell(script)).trimEnd();
}

/**
 * Read approximate pages from a Word document.
 *
 * Word's object model does not expose a clean "get text for page N" API.
 * This implementation uses the GoToWhat/GoTo page navigation approach:
 * it moves the selection to the start of each requested page, reads from
 * there to the end of the page (or document), and concatenates the result.
 *
 * The output is an approximation — page boundaries in Word depend on
 * rendering and fonts, which vary between machines and Word versions.
 */
export async function readPages(
  filePath: string,
  startPage: number,
  endPage?: number,
): Promise<string> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const endPagePs = endPage !== undefined ? endPage : -1;

  const body = `
  $wdGoToPage  = 1
  $wdGoToAbsolute = 1
  $totalPages = $doc.ComputeStatistics(2)  # wdStatisticPages = 2
  $lastPage   = if (${endPagePs} -lt 0 -or ${endPagePs} -gt $totalPages) { $totalPages } else { ${endPagePs} }
  $texts = @()
  for ($p = ${startPage}; $p -le $lastPage; $p++) {
    $sel = $word.Selection
    $sel.GoTo($wdGoToPage, $wdGoToAbsolute, $p) | Out-Null
    $sel.GoTo($wdGoToPage, $wdGoToAbsolute, $p) | Out-Null
    $startPos = $sel.Start
    if ($p -lt $lastPage) {
      $sel.GoTo($wdGoToPage, $wdGoToAbsolute, ($p + 1)) | Out-Null
      $endPos = $sel.Start
    } else {
      $endPos = $doc.Content.End
    }
    $rng = $doc.Range($startPos, $endPos)
    $texts += $rng.Text
  }
  Write-Output ($texts -join '')`;

  const script = wordScript(abs, body);
  return (await runPowerShell(script)).trimEnd();
}

/**
 * Find and replace text in a Word document.
 * Saves the document after replacement.
 *
 * @returns The number of replacements made.
 */
export async function findReplace(
  filePath: string,
  find: string,
  replace: string,
  replaceAll = true,
): Promise<number> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const escapedFind    = escapePsString(find);
  const escapedReplace = escapePsString(replace);
  // wdReplaceAll = 2, wdReplaceOne = 1
  const replaceMode = replaceAll ? 2 : 1;

  const body = `
  $find = $doc.Content.Find
  $find.ClearFormatting()
  $find.Replacement.ClearFormatting()
  $count = 0
  $find.Text = '${escapedFind}'
  $find.Replacement.Text = '${escapedReplace}'
  $find.Forward = $true
  $find.Wrap = 1       # wdFindContinue
  $find.Format = $false
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  # Count occurrences first
  $search = $doc.Content.Find
  $search.ClearFormatting()
  $search.Text = '${escapedFind}'
  $search.Forward = $true
  $search.Wrap = 1
  $search.MatchCase = $false
  $search.MatchWholeWord = $false
  while ($search.Execute()) { $count++ }
  # Now replace
  $find.Execute($null,$null,$null,$null,$null,$null,$null,$null,$null,$null,${replaceMode}) | Out-Null
  $doc.Save()
  Write-Output $count`;

  const script = wordScript(abs, body, '$true');
  const raw = (await runPowerShell(script)).trim();
  return parseInt(raw, 10) || 0;
}

/**
 * Return metadata / built-in properties of a Word document.
 */
export async function getDocumentInfo(filePath: string): Promise<WordDocumentInfo> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const body = `
  $bi = $doc.BuiltInDocumentProperties
  $title    = try { $bi.Item('Title').Value }    catch { '' }
  $author   = try { $bi.Item('Author').Value }   catch { '' }
  $pages    = $doc.ComputeStatistics(2)   # wdStatisticPages
  $words    = $doc.ComputeStatistics(0)   # wdStatisticWords
  $chars    = $doc.ComputeStatistics(3)   # wdStatisticCharacters
  $modified = try { $bi.Item('Last Save Time').Value.ToString('o') } catch { '' }
  $obj = [PSCustomObject]@{
    title        = [string]$title
    author       = [string]$author
    pages        = [int]$pages
    words        = [int]$words
    characters   = [int]$chars
    lastModified = [string]$modified
  }
  Write-Output (ConvertTo-Json $obj -Compress)`;

  const script = wordScript(abs, body);
  const raw = (await runPowerShell(script)).trim();
  return JSON.parse(raw) as WordDocumentInfo;
}

/**
 * Insert text at the beginning, end, or after a named bookmark.
 *
 * @param position  `'start'`, `'end'`, or a bookmark name.
 */
export async function insertText(
  filePath: string,
  text: string,
  position: 'start' | 'end' | string,
): Promise<void> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const escapedText = escapePsString(text);

  let insertLogic: string;
  if (position === 'start') {
    insertLogic = `
  $rng = $doc.Content
  $rng.Collapse(1)   # wdCollapseStart = 1
  $rng.InsertBefore('${escapedText}')`;
  } else if (position === 'end') {
    insertLogic = `
  $rng = $doc.Content
  $rng.Collapse(0)   # wdCollapseEnd = 0
  $rng.InsertAfter('${escapedText}')`;
  } else {
    const escapedBookmark = escapePsString(position);
    insertLogic = `
  if (-not $doc.Bookmarks.Exists('${escapedBookmark}')) {
    throw "Bookmark not found: ${escapedBookmark}"
  }
  $rng = $doc.Bookmarks.Item('${escapedBookmark}').Range
  $rng.Collapse(0)   # wdCollapseEnd
  $rng.InsertAfter('${escapedText}')`;
  }

  const body = `${insertLogic}\n  $doc.Save()`;
  const script = wordScript(abs, body, '$true');
  await runPowerShell(script);
}

/**
 * Export a Word document as PDF.
 *
 * @param outputPath  Optional output path. Defaults to the same directory as
 *                    the source file with a `.pdf` extension.
 * @returns The absolute path to the generated PDF.
 */
export async function exportPdf(
  filePath: string,
  outputPath?: string,
): Promise<string> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const defaultPdf = join(dirname(abs), basename(abs, extname(abs)) + '.pdf');
  const targetPdf  = outputPath ? resolvePath(outputPath) : defaultPdf;
  const escapedOut = escapePsString(targetPdf);

  // wdExportFormatPDF = 17
  const body = `
  $doc.ExportAsFixedFormat('${escapedOut}', 17)
  Write-Output '${escapedOut}'`;

  const script = wordScript(abs, body);
  await runPowerShell(script);
  return targetPdf;
}

/**
 * List all bookmarks in a Word document, along with their text content.
 */
export async function listBookmarks(filePath: string): Promise<WordBookmark[]> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const body = `
  $bmarks = @()
  foreach ($bm in $doc.Bookmarks) {
    $bmarks += [PSCustomObject]@{
      name = [string]$bm.Name
      text = [string]$bm.Range.Text
    }
  }
  Write-Output (ConvertTo-Json $bmarks -Compress)`;

  const script = wordScript(abs, body);
  const raw = (await runPowerShell(script)).trim();

  if (!raw || raw === 'null') return [];
  const parsed = JSON.parse(raw) as WordBookmark | WordBookmark[];
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Perform a mail merge: for each record in `data`, open the template, fill
 * the merge fields with the record's key/value pairs, and save the result as
 * a separate .docx file in `outputDir`.
 *
 * The template must already be configured as a mail merge document (with
 * existing merge fields that match the keys in `data`). For templates that
 * are not pre-wired as mail-merge documents, the function falls back to a
 * simple find-and-replace strategy using `«key»` as the placeholder pattern.
 *
 * @returns Array of absolute paths to the generated output files.
 */
export async function mailMerge(
  templatePath: string,
  data: Record<string, string>[],
  outputDir: string,
): Promise<string[]> {
  const absTemplate = resolvePath(templatePath);
  assertExists(absTemplate);
  const absOutputDir = resolvePath(outputDir);

  const dataJson    = escapePsString(JSON.stringify(data));
  const escapedDir  = escapePsString(absOutputDir);
  const escapedTmpl = escapePsString(absTemplate);
  const ext         = extname(absTemplate) || '.docx';

  // We open a fresh Word instance per record to avoid state bleed.
  // For large datasets this is slower but more reliable.
  const script = `
$ErrorActionPreference = 'Stop'
$data = '${dataJson}' | ConvertFrom-Json
$outputPaths = @()
if (-not (Test-Path '${escapedDir}')) {
  New-Item -ItemType Directory -Path '${escapedDir}' | Out-Null
}
$idx = 0
foreach ($record in $data) {
  $word = $null
  $doc  = $null
  try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open('${escapedTmpl}')
    $isMergeDoc = $doc.MailMerge.MainDocumentType -ne -1
    if ($isMergeDoc -and $doc.MailMerge.Fields.Count -gt 0) {
      # Proper mail merge path
      $ds = $doc.MailMerge.DataSource
      foreach ($key in $record.PSObject.Properties.Name) {
        try { $ds.DataFields.Item($key).Value = $record.$key } catch {}
      }
      $doc.MailMerge.Destination = 0   # wdSendToNewDocument
      $doc.MailMerge.Execute($false) | Out-Null
      $merged = $word.ActiveDocument
      $outFile = Join-Path '${escapedDir}' ('record_' + $idx + '${ext}')
      $merged.SaveAs2($outFile, 16)    # wdFormatXMLDocument = 16
      $merged.Close([ref]$false)
    } else {
      # Fallback: replace «key» placeholders
      foreach ($key in $record.PSObject.Properties.Name) {
        $placeholder = [char]171 + $key + [char]187
        $find = $doc.Content.Find
        $find.ClearFormatting()
        $find.Replacement.ClearFormatting()
        $find.Text = $placeholder
        $find.Replacement.Text = $record.$key
        $find.Forward = $true
        $find.Wrap = 1
        $find.Execute($null,$null,$null,$null,$null,$null,$null,$null,$null,$null,2) | Out-Null
      }
      $outFile = Join-Path '${escapedDir}' ('record_' + $idx + '${ext}')
      $doc.SaveAs2($outFile, 16)
    }
    $outputPaths += $outFile
  } finally {
    if ($doc  -ne $null) { $doc.Close([ref]$false) }
    if ($word -ne $null) { $word.Quit() }
    if ($word -ne $null) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null }
  }
  $idx++
}
Write-Output (ConvertTo-Json $outputPaths -Compress)
`.trim();

  const raw = (await runPowerShell(script)).trim();
  if (!raw || raw === 'null') return [];
  const parsed = JSON.parse(raw) as string | string[];
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Extract all tables from a Word document.
 * Merged cells are represented as empty strings in the positions they span.
 */
export async function getTables(filePath: string): Promise<WordTable[]> {
  const abs = resolvePath(filePath);
  assertExists(abs);

  const body = `
  $result = @()
  $tIdx = 0
  foreach ($tbl in $doc.Tables) {
    $rowCount = $tbl.Rows.Count
    $colCount = $tbl.Columns.Count
    $tableData = @()
    for ($r = 1; $r -le $rowCount; $r++) {
      $rowData = @()
      for ($c = 1; $c -le $colCount; $c++) {
        try {
          $cell = $tbl.Cell($r, $c)
          $txt  = $cell.Range.Text
          # Word appends chr(13)+chr(7) at end of each cell — strip it
          $txt  = $txt -replace '[\\r\\n\\x07]+$', ''
          $rowData += $txt
        } catch {
          # Merged cell — expose as empty string
          $rowData += ''
        }
      }
      $tableData += ,@($rowData)
    }
    $result += [PSCustomObject]@{
      index = [int]$tIdx
      rows  = [int]$rowCount
      cols  = [int]$colCount
      data  = $tableData
    }
    $tIdx++
  }
  Write-Output (ConvertTo-Json $result -Compress -Depth 10)`;

  const script = wordScript(abs, body);
  const raw = (await runPowerShell(script)).trim();

  if (!raw || raw === 'null') return [];
  const parsed = JSON.parse(raw) as WordTable | WordTable[];
  return Array.isArray(parsed) ? parsed : [parsed];
}
