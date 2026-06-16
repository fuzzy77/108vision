/**
 * Microsoft Excel COM Automation — 108 AI Desktop Agent
 *
 * All operations go through PowerShell subprocesses that drive the Excel COM
 * object model.  The Excel process is always started invisible, and a
 * try/finally block in every script ensures ReleaseComObject + Quit even on
 * error, preventing zombie Excel.exe processes.
 *
 * Prerequisites:
 *   Microsoft Excel must be installed on the Windows host.
 *   PowerShell 5.1+ (ships with Windows 10/11).
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const POWERSHELL_TIMEOUT_MS = 30_000;
const PS_FLAGS = ['-NoProfile', '-NonInteractive', '-Command'];

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UsedRange {
  rows: number;
  cols: number;
  address: string;
}

export interface SearchMatch {
  sheet: string;
  cell: string;
  value: string;
}

export interface CellInfo {
  value: string;
  formula: string;
  format: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function runPs(script: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    'powershell.exe',
    [...PS_FLAGS, script],
    { timeout: POWERSHELL_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
  );
  if (stderr.trim()) {
    const msg = stderr.trim();
    // PowerShell writes non-fatal warnings to stderr; only abort on hard errors.
    if (/Exception|Error|Cannot/.test(msg)) {
      throw new Error(`PowerShell error: ${msg}`);
    }
  }
  return stdout;
}

/** Resolve the path to an absolute form and validate it exists for reads. */
function resolveAbsolute(filePath: string): string {
  return resolve(filePath);
}

function assertExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

/** Escape a string for embedding in a PowerShell double-quoted string. */
function psEscape(value: string): string {
  return value.replace(/`/g, '``').replace(/"/g, '`"').replace(/\$/g, '`$');
}

/**
 * Shared COM bootstrap block.  Inlined into every script so each operation
 * is a self-contained process — no shared state between calls.
 *
 * @param filePath   Absolute path to the workbook.
 * @param writeable  Whether to open for editing (false = read-only).
 */
function comHeader(filePath: string, writeable: boolean): string {
  const escapedPath = psEscape(filePath);
  const readOnly = writeable ? '$false' : '$true';
  return `
$ErrorActionPreference = 'Stop'
$excel = $null
$workbook = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.AskToUpdateLinks = $false
  $workbook = $excel.Workbooks.Open("${escapedPath}", 0, ${readOnly})
`.trimStart();
}

/** Shared COM teardown block appended to every script. */
function comFooter(save: boolean): string {
  return `
} finally {
  if ($workbook -ne $null) {
    try { $workbook.Close(${save ? '$true' : '$false'}) } catch {}
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
    $workbook = $null
  }
  if ($excel -ne $null) {
    try { $excel.Quit() } catch {}
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    $excel = $null
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read a cell or range and return a 2-D array of string values.
 *
 * @param filePath  Path to the workbook (.xlsx, .xls, .xlsm …).
 * @param sheet     Sheet name, e.g. "Sheet1".
 * @param range     Excel range address, e.g. "A1:C10" or "B2".
 */
export async function readCells(
  filePath: string,
  sheet: string,
  range: string,
): Promise<string[][]> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  const escapedSheet = psEscape(sheet);
  const escapedRange = psEscape(range);

  const script = `
${comHeader(abs, false)}
  $ws = $workbook.Sheets.Item("${escapedSheet}")
  $rng = $ws.Range("${escapedRange}")
  $rows = $rng.Rows.Count
  $cols = $rng.Columns.Count
  $matrix = @()
  for ($r = 1; $r -le $rows; $r++) {
    $row = @()
    for ($c = 1; $c -le $cols; $c++) {
      $cell = $rng.Cells.Item($r, $c)
      $v = if ($cell.Value2 -ne $null) { [string]$cell.Value2 } else { "" }
      $row += $v
    }
    $matrix += ,@($row)
  }
  $matrix | ConvertTo-Json -Depth 4 -Compress
${comFooter(false)}`;

  const stdout = await runPs(script);
  const raw = stdout.trim();
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);

  // ConvertTo-Json wraps a single row as an array of strings, not array-of-arrays.
  if (!Array.isArray(parsed)) return [];
  if (parsed.length === 0) return [];

  if (!Array.isArray(parsed[0])) {
    // Single row — the outer array IS the row.
    return [(parsed as unknown[]).map((v) => String(v ?? ''))];
  }

  return (parsed as unknown[][]).map((row) =>
    Array.isArray(row) ? row.map((v) => String(v ?? '')) : [],
  );
}

/**
 * Write a 2-D array of string values into a range.
 * The file is saved after writing.  If the file does not exist it is created
 * as a new xlsx workbook.
 */
export async function writeCells(
  filePath: string,
  sheet: string,
  range: string,
  data: string[][],
): Promise<void> {
  const abs = resolveAbsolute(filePath);
  const escapedSheet = psEscape(sheet);
  const escapedRange = psEscape(range);

  // Serialise data as a PowerShell literal array-of-arrays.
  const psData = data
    .map(
      (row) =>
        ',@(' +
        row.map((v) => `"${psEscape(v)}"`).join(',') +
        ')',
    )
    .join('');

  // For the write path we open/create separately from the shared header.
  const script = `
$ErrorActionPreference = 'Stop'
$excel = $null
$workbook = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.AskToUpdateLinks = $false
${
    existsSync(abs)
      ? `  $workbook = $excel.Workbooks.Open("${psEscape(abs)}", 0, $false)`
      : `  $workbook = $excel.Workbooks.Add()
  $workbook.SaveAs("${psEscape(abs)}")`
  }
  # Ensure target sheet exists; create it if not.
  $ws = $null
  foreach ($s in $workbook.Sheets) {
    if ($s.Name -eq "${escapedSheet}") { $ws = $s; break }
  }
  if ($ws -eq $null) {
    $ws = $workbook.Sheets.Add()
    $ws.Name = "${escapedSheet}"
  }
  $rng = $ws.Range("${escapedRange}")
  $matrix = @(${psData})
  for ($r = 0; $r -lt $matrix.Count; $r++) {
    $rowArr = $matrix[$r]
    for ($c = 0; $c -lt $rowArr.Count; $c++) {
      $rng.Cells.Item($r + 1, $c + 1).Value2 = $rowArr[$c]
    }
  }
  $workbook.Save()
${comFooter(false)}`;

  await runPs(script);
}

/**
 * Return the list of sheet names in the workbook, in tab order.
 */
export async function listSheets(filePath: string): Promise<string[]> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  const script = `
${comHeader(abs, false)}
  $names = @()
  foreach ($s in $workbook.Sheets) { $names += $s.Name }
  $names | ConvertTo-Json -Compress
${comFooter(false)}`;

  const stdout = await runPs(script);
  const raw = stdout.trim();
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed === 'string') return [parsed];
  if (Array.isArray(parsed)) return (parsed as unknown[]).map((v) => String(v));
  return [];
}

/**
 * Return the dimensions and address of the used range on the specified sheet.
 * If sheet is omitted, the active sheet is used.
 */
export async function getUsedRange(
  filePath: string,
  sheet?: string,
): Promise<UsedRange> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  const sheetBlock = sheet
    ? `$ws = $workbook.Sheets.Item("${psEscape(sheet)}")`
    : `$ws = $workbook.ActiveSheet`;

  const script = `
${comHeader(abs, false)}
  ${sheetBlock}
  $used = $ws.UsedRange
  $result = @{
    rows    = [int]$used.Rows.Count
    cols    = [int]$used.Columns.Count
    address = $used.Address($false, $false)
  }
  $result | ConvertTo-Json -Compress
${comFooter(false)}`;

  const stdout = await runPs(script);
  const raw = stdout.trim();
  if (!raw) return { rows: 0, cols: 0, address: '' };

  const parsed = JSON.parse(raw) as { rows: number; cols: number; address: string };
  return {
    rows: Number(parsed.rows ?? 0),
    cols: Number(parsed.cols ?? 0),
    address: String(parsed.address ?? ''),
  };
}

/**
 * Search for a text value across the workbook (or a single sheet).
 * Returns all matching cells with their sheet name, cell address, and value.
 */
export async function searchValue(
  filePath: string,
  query: string,
  sheet?: string,
): Promise<SearchMatch[]> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  const escapedQuery = psEscape(query);

  const sheetsBlock = sheet
    ? `$sheets = @($workbook.Sheets.Item("${psEscape(sheet)}"))`
    : `$sheets = $workbook.Sheets`;

  const script = `
${comHeader(abs, false)}
  ${sheetsBlock}
  $matches = @()
  foreach ($ws in $sheets) {
    $used = $ws.UsedRange
    if ($used -eq $null) { continue }
    $found = $used.Find("${escapedQuery}", [System.Type]::Missing,
      [Microsoft.Office.Interop.Excel.XlFindLookIn]::xlValues,
      [Microsoft.Office.Interop.Excel.XlLookAt]::xlPart,
      [Microsoft.Office.Interop.Excel.XlSearchOrder]::xlByRows,
      [Microsoft.Office.Interop.Excel.XlSearchDirection]::xlNext,
      $false, $false, $false)
    if ($found -eq $null) { continue }
    $firstAddr = $found.Address($false, $false)
    do {
      $matches += @{
        sheet = $ws.Name
        cell  = $found.Address($false, $false)
        value = if ($found.Value2 -ne $null) { [string]$found.Value2 } else { "" }
      }
      $found = $used.FindNext($found)
    } while ($found -ne $null -and $found.Address($false, $false) -ne $firstAddr)
  }
  $matches | ConvertTo-Json -Depth 3 -Compress
${comFooter(false)}`;

  const stdout = await runPs(script);
  const raw = stdout.trim();
  if (!raw || raw === 'null') return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  return (parsed as unknown[]).map((item) => {
    const m = item as Record<string, unknown>;
    return {
      sheet: String(m['sheet'] ?? ''),
      cell: String(m['cell'] ?? ''),
      value: String(m['value'] ?? ''),
    };
  });
}

/**
 * Write a formula into a cell, calculate the workbook, and return the
 * resulting value as a string.  The workbook is NOT saved (the formula
 * write is transient — only the evaluated result is returned).
 */
export async function evaluateFormula(
  filePath: string,
  sheet: string,
  cell: string,
  formula: string,
): Promise<string> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  const escapedSheet = psEscape(sheet);
  const escapedCell = psEscape(cell);
  const escapedFormula = psEscape(formula);

  const script = `
${comHeader(abs, false)}
  $ws = $workbook.Sheets.Item("${escapedSheet}")
  $c = $ws.Range("${escapedCell}")
  $c.Formula = "${escapedFormula}"
  $excel.Calculate()
  $v = if ($c.Value2 -ne $null) { [string]$c.Value2 } else { "" }
  Write-Output $v
${comFooter(false)}`;

  const stdout = await runPs(script);
  return stdout.trim();
}

/**
 * Export a sheet to CSV and return the file path of the output.
 *
 * @param filePath    Source workbook path.
 * @param sheet       Sheet name; defaults to the active sheet.
 * @param outputPath  Where to save the CSV.  Defaults to a sibling file with
 *                    the sheet name and a `.csv` extension next to the source.
 */
export async function exportCsv(
  filePath: string,
  sheet?: string,
  outputPath?: string,
): Promise<string> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  // Derive default output path from workbook location + sheet name.
  const baseName = abs.replace(/\.[^.]+$/, '');
  const sheetSuffix = sheet ? `_${sheet.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  const defaultOutput = `${baseName}${sheetSuffix}.csv`;
  const csvPath = outputPath ? resolveAbsolute(outputPath) : defaultOutput;

  const sheetBlock = sheet
    ? `$ws = $workbook.Sheets.Item("${psEscape(sheet)}")`
    : `$ws = $workbook.ActiveSheet`;

  const script = `
${comHeader(abs, false)}
  ${sheetBlock}
  $ws.Copy()
  $newBook = $excel.ActiveWorkbook
  try {
    $newBook.SaveAs("${psEscape(csvPath)}",
      [Microsoft.Office.Interop.Excel.XlFileFormat]::xlCSV,
      [System.Type]::Missing, [System.Type]::Missing,
      $false, $false,
      [Microsoft.Office.Interop.Excel.XlSaveAsAccessMode]::xlNoChange,
      [System.Type]::Missing, $false, $false, $false, $false)
    $newBook.Close($false)
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($newBook) | Out-Null
  } catch {
    try { $newBook.Close($false) } catch {}
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($newBook) | Out-Null
    throw
  }
${comFooter(false)}`;

  await runPs(script);
  return csvPath;
}

/**
 * Return metadata for a single cell: its display value, formula, number
 * format string, and value type (Empty, Boolean, Number, Text, Error).
 */
export async function getCellInfo(
  filePath: string,
  sheet: string,
  cell: string,
): Promise<CellInfo> {
  const abs = resolveAbsolute(filePath);
  assertExists(abs);

  const escapedSheet = psEscape(sheet);
  const escapedCell = psEscape(cell);

  const script = `
${comHeader(abs, false)}
  $ws = $workbook.Sheets.Item("${escapedSheet}")
  $c = $ws.Range("${escapedCell}")
  $typeMap = @{ 0 = "Empty"; 1 = "Number"; 2 = "Text"; 4 = "Boolean"; 5 = "Error"; 6 = "Empty" }
  $result = @{
    value   = if ($c.Value2 -ne $null) { [string]$c.Value2 } else { "" }
    formula = if ($c.HasFormula) { [string]$c.Formula } else { "" }
    format  = [string]$c.NumberFormat
    type    = if ($typeMap.ContainsKey([int]$c.Type)) { $typeMap[[int]$c.Type] } else { "Unknown" }
  }
  $result | ConvertTo-Json -Compress
${comFooter(false)}`;

  const stdout = await runPs(script);
  const raw = stdout.trim();
  if (!raw) return { value: '', formula: '', format: '', type: 'Empty' };

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    value: String(parsed['value'] ?? ''),
    formula: String(parsed['formula'] ?? ''),
    format: String(parsed['format'] ?? ''),
    type: String(parsed['type'] ?? 'Unknown'),
  };
}
