/**
 * Vision LLM Integration — 108 AI Desktop Agent
 *
 * Provides intelligent screenshot analysis by combining OS-level screen capture
 * with a multimodal LLM (vision tier).  Used as a fallback when UI Automation
 * cannot read an application's content (custom-rendered UIs, games, PDFs
 * rendered as images, electron apps with disabled accessibility, etc.).
 *
 * Capture strategy:
 *   - Specific window  → captureWindow() from ui-automation (base64 PNG)
 *   - Full screen      → PowerShell System.Drawing (base64 PNG)
 *   - Region           → full-screen capture + PowerShell Bitmap crop
 *
 * All LLM calls go through the configured provider for the 'balanced' tier via
 * resolveModelConfig() — vision models require at least balanced-tier capability.
 * The caller pays: tokensUsed is always surfaced in the return value.
 *
 * Design decisions:
 *   - execFile (never exec) for every PowerShell subprocess
 *   - AbortSignal.timeout(60_000) on every fetch call
 *   - JSON parse failures fall back to text rather than throwing
 *   - scale option downsamples via PowerShell before base64 encoding to reduce
 *     token cost; default is no downscaling (scale = 1)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { resolveModelConfig } from '../provider-keys.js';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Timeouts & limits
// ---------------------------------------------------------------------------

/** Maximum wait for a PowerShell capture subprocess. */
const PS_CAPTURE_TIMEOUT_MS = 30_000;
/** Maximum wait for a Vision LLM response (large images are slow). */
const LLM_VISION_TIMEOUT_MS = 60_000;
/** Token budget for a single vision call. Callers may not need full analysis. */
const DEFAULT_MAX_TOKENS = 2_000;
/** PowerShell flags reused on every subprocess call. */
const PS_FLAGS = ['-NoProfile', '-NonInteractive', '-Command'] as const;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DetectedElement {
  /** Coarse category: 'button' | 'input' | 'text' | 'image' | 'menu' | 'dialog' | etc. */
  type: string;
  /** Visible label or accessible name of the element. */
  label: string;
  /** Rough position on screen: 'top-left' | 'top-center' | 'top-right' |
   *  'center-left' | 'center' | 'center-right' |
   *  'bottom-left' | 'bottom-center' | 'bottom-right' */
  location: string;
  /** Whether the element appears to be interactive (clickable, typeable, etc.). */
  interactable: boolean;
}

export interface ActionSuggestion {
  /** Low-level action verb: 'click' | 'type' | 'scroll' | 'close' | 'navigate' */
  action: string;
  /** Description of the target element. */
  target: string;
  /** Human-readable explanation of what this action would accomplish. */
  description: string;
}

export interface VisionAnalysis {
  /** Natural-language description of what is visible on screen. */
  description: string;
  /** UI elements detected in the screenshot. */
  elements: DetectedElement[];
  /** All readable text extracted from the screenshot. */
  text: string;
  /** Actions the user (or agent) could take next. */
  actionable: ActionSuggestion[];
  /** Total tokens consumed by the LLM call (input + output). */
  tokensUsed: number;
}

export interface ScreenshotOptions {
  /**
   * Title (or partial title) of a specific window to capture.
   * When omitted the full primary screen is captured.
   */
  windowTitle?: string;
  /**
   * Crop to this pixel region after capture.
   * Coordinates are relative to the captured image (window or screen).
   */
  region?: { x: number; y: number; width: number; height: number };
  /**
   * Downscale factor applied before encoding (0 < scale <= 1).
   * 0.5 halves both dimensions, reducing token cost ~4x at the expense of detail.
   * Defaults to 1 (no downscaling).
   */
  scale?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Run a PowerShell script via execFile.
 * stdout is expected to be pure base64 or plain text; stderr is ignored unless
 * it contains a hard error keyword.
 */
async function runPs(script: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    'powershell.exe',
    [...PS_FLAGS, script],
    {
      timeout: PS_CAPTURE_TIMEOUT_MS,
      maxBuffer: 50 * 1024 * 1024, // screenshots can be large
    },
  );

  if (stderr.trim()) {
    const msg = stderr.trim();
    if (/Exception|TerminatingError|Cannot/.test(msg)) {
      throw new Error(`PowerShell error: ${msg.slice(0, 400)}`);
    }
  }

  return typeof stdout === 'string' ? stdout.trim() : '';
}

/**
 * Strip markdown code fences that some LLMs wrap JSON in (```json ... ```).
 */
function stripCodeFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

/**
 * Attempt to parse a JSON string; returns null on failure rather than throwing.
 */
function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core Vision LLM caller
// ---------------------------------------------------------------------------

interface LlmVisionResponse {
  content: string;
  tokensUsed: number;
}

/**
 * Send one or more base64-encoded PNG images together with a text prompt to
 * the configured Vision LLM.  Uses the 'balanced' tier because vision requires
 * a multimodal model — fast-cheap tier models are typically text-only.
 *
 * @param images  Array of raw base64 PNG strings (no data-URI prefix).
 * @param prompt  Instruction text sent as the user message.
 * @param maxTokens  Upper bound on response length (default 2 000).
 */
async function callVisionLLM(
  images: string[],
  prompt: string,
  maxTokens = DEFAULT_MAX_TOKENS,
): Promise<LlmVisionResponse> {
  const modelConfig = resolveModelConfig('balanced');
  if (modelConfig === null) {
    throw new Error('No LLM provider configured for the "balanced" tier — vision requires at least balanced tier');
  }

  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };

  const content: ContentBlock[] = [
    { type: 'text', text: prompt },
    ...images.map(
      (img): ContentBlock => ({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${img}` },
      }),
    ),
  ];

  const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [{ role: 'user', content }],
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(LLM_VISION_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Vision LLM error: ${response.status} ${response.statusText} — ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Screen capture helpers
// ---------------------------------------------------------------------------

/**
 * Capture the primary screen using PowerShell + System.Drawing.
 * Returns a raw base64-encoded PNG string (no data-URI prefix).
 */
export async function captureFullScreen(): Promise<string> {
  const script = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
  $ms = New-Object System.IO.MemoryStream
  try {
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    [Convert]::ToBase64String($ms.ToArray())
  } finally {
    $ms.Dispose()
  }
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
`.trim();

  return runPs(script);
}

/**
 * Capture the window whose title contains the given string.
 * Delegates to the ui-automation module when available; falls back to a
 * PowerShell-only capture if the module is not yet present.
 *
 * Returns a raw base64-encoded PNG string.
 */
async function captureWindowBase64(title: string): Promise<string> {
  try {
    // Dynamic import — ui-automation may not be present in all builds
    const uiAutomation = await import('./ui-automation.js');
    return await uiAutomation.captureWindow(title);
  } catch (importErr) {
    // ui-automation not available — fall back to PowerShell window capture
    const safeTitle = title.replace(/'/g, "''");
    const script = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$proc = Get-Process | Where-Object { $_.MainWindowTitle -like '*${safeTitle}*' } | Select-Object -First 1
if ($null -eq $proc) { throw "No window found matching title: ${safeTitle}" }
$hwnd = $proc.MainWindowHandle
Add-Type @"
using System;
using System.Drawing;
using System.Runtime.InteropServices;
public class WinCapture {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
[WinCapture]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 200
$rect = New-Object WinCapture+RECT
[WinCapture]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
if ($w -le 0 -or $h -le 0) { throw "Window has zero dimensions" }
$bitmap = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($w, $h))
  $ms = New-Object System.IO.MemoryStream
  try {
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    [Convert]::ToBase64String($ms.ToArray())
  } finally { $ms.Dispose() }
} finally {
  $g.Dispose()
  $bitmap.Dispose()
}
`.trim();

    return runPs(script);
  }
}

/**
 * Apply region cropping and/or downscaling to a raw base64 PNG via PowerShell.
 * Returns the transformed base64 string.
 *
 * Combining crop + scale in a single subprocess avoids a redundant round-trip.
 */
async function transformCapture(
  base64: string,
  region: { x: number; y: number; width: number; height: number } | undefined,
  scale: number,
): Promise<string> {
  // Nothing to do — return the original as-is
  if (region === undefined && scale === 1) return base64;

  const regionScript = region !== undefined
    ? `
$src = [System.Drawing.Image]::FromStream($ms)
$cropRect = [System.Drawing.Rectangle]::new(${region.x}, ${region.y}, ${region.width}, ${region.height})
$cropped = $src.Clone($cropRect, $src.PixelFormat)
$src.Dispose()
$src = $cropped`
    : `$src = [System.Drawing.Image]::FromStream($ms)`;

  const scaleScript = scale < 1
    ? `
$newW = [int]($src.Width * ${scale})
$newH = [int]($src.Height * ${scale})
$scaled = New-Object System.Drawing.Bitmap($newW, $newH)
$g = [System.Drawing.Graphics]::FromImage($scaled)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, $newW, $newH)
$g.Dispose()
$src.Dispose()
$src = $scaled`
    : '';

  const script = `
Add-Type -AssemblyName System.Drawing
$bytes = [Convert]::FromBase64String('${base64}')
$ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
try {
${regionScript}
${scaleScript}
  $out = New-Object System.IO.MemoryStream
  try {
    $src.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    [Convert]::ToBase64String($out.ToArray())
  } finally { $out.Dispose() }
  $src.Dispose()
} finally { $ms.Dispose() }
`.trim();

  return runPs(script);
}

/**
 * Capture the screen (or a named window) and apply optional transformations.
 * Returns a ready-to-use base64 PNG string.
 */
async function acquireScreenshot(options?: ScreenshotOptions): Promise<string> {
  let base64: string;

  if (options?.windowTitle !== undefined && options.windowTitle.trim() !== '') {
    base64 = await captureWindowBase64(options.windowTitle);
  } else {
    base64 = await captureFullScreen();
  }

  const scale = options?.scale !== undefined ? Math.min(1, Math.max(0.05, options.scale)) : 1;

  if (options?.region !== undefined || scale < 1) {
    base64 = await transformCapture(base64, options?.region, scale);
  }

  return base64;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Capture a screenshot and analyze it with a Vision LLM.
 *
 * Returns a structured VisionAnalysis including a description, detected UI
 * elements, all visible text, and suggested next actions.
 *
 * @param options  Controls which window/region to capture, and optional scaling.
 * @param question Optional natural-language question to focus the analysis
 *                 (e.g. "Is there an error message visible?").
 */
export async function analyzeScreen(
  options?: ScreenshotOptions,
  question?: string,
): Promise<VisionAnalysis> {
  const base64 = await acquireScreenshot(options);

  const questionClause = question !== undefined && question.trim() !== ''
    ? `\n\nAdditional question to answer: ${question.trim()}`
    : '';

  const prompt = `Analyze this screenshot of a desktop application or web page.
Return a JSON object with this exact structure:
{
  "description": "Brief natural-language description of what is visible (2-4 sentences)",
  "elements": [
    {
      "type": "button|input|text|image|menu|dialog|link|checkbox|radio|dropdown|tab|scrollbar|other",
      "label": "visible text or accessible name",
      "location": "top-left|top-center|top-right|center-left|center|center-right|bottom-left|bottom-center|bottom-right",
      "interactable": true
    }
  ],
  "text": "all readable text found on screen, preserving approximate layout",
  "actionable": [
    {
      "action": "click|type|scroll|close|navigate",
      "target": "element description",
      "description": "what this action would accomplish"
    }
  ]
}
Return only the JSON — no markdown fences, no commentary.${questionClause}`;

  const { content, tokensUsed } = await callVisionLLM([base64], prompt);

  const parsed = tryParseJson<{
    description?: string;
    elements?: unknown[];
    text?: string;
    actionable?: unknown[];
  }>(stripCodeFences(content));

  if (parsed === null) {
    // LLM returned unstructured text — degrade gracefully
    return {
      description: content,
      elements: [],
      text: content,
      actionable: [],
      tokensUsed,
    };
  }

  const elements: DetectedElement[] = (parsed.elements ?? []).map((e) => {
    const el = e as Record<string, unknown>;
    return {
      type: String(el['type'] ?? 'other'),
      label: String(el['label'] ?? ''),
      location: String(el['location'] ?? 'center'),
      interactable: Boolean(el['interactable'] ?? false),
    };
  });

  const actionable: ActionSuggestion[] = (parsed.actionable ?? []).map((a) => {
    const item = a as Record<string, unknown>;
    return {
      action: String(item['action'] ?? 'click'),
      target: String(item['target'] ?? ''),
      description: String(item['description'] ?? ''),
    };
  });

  return {
    description: String(parsed.description ?? ''),
    elements,
    text: String(parsed.text ?? ''),
    actionable,
    tokensUsed,
  };
}

/**
 * Ask a natural-language question about the current screen (or a specific
 * window) and return the LLM's plain-text answer.
 *
 * Simpler and cheaper than analyzeScreen — use when structured data is not
 * needed.
 *
 * @example
 *   const answer = await askAboutScreen('Is there an unsaved changes dialog?');
 */
export async function askAboutScreen(
  question: string,
  options?: ScreenshotOptions,
): Promise<string> {
  const base64 = await acquireScreenshot(options);

  const prompt = `You are analyzing a desktop screenshot. Answer the following question directly and concisely based only on what you can see in the image.\n\nQuestion: ${question.trim()}`;

  const { content } = await callVisionLLM([base64], prompt, 512);
  return content;
}

/**
 * Locate a specific element on screen by natural-language description.
 *
 * Returns the best-matching DetectedElement, or null if nothing matching is
 * found.
 *
 * @example
 *   const el = await findOnScreen('the Save button');
 */
export async function findOnScreen(
  description: string,
  options?: ScreenshotOptions,
): Promise<DetectedElement | null> {
  const base64 = await acquireScreenshot(options);

  const prompt = `Analyze this screenshot and locate the element that best matches this description: "${description.trim()}"

If you find a matching element, return a JSON object with this structure:
{
  "found": true,
  "type": "button|input|text|image|menu|dialog|link|checkbox|radio|dropdown|tab|other",
  "label": "visible text or accessible name of the element",
  "location": "top-left|top-center|top-right|center-left|center|center-right|bottom-left|bottom-center|bottom-right",
  "interactable": true
}

If no matching element exists, return:
{ "found": false }

Return only the JSON — no markdown fences, no commentary.`;

  const { content } = await callVisionLLM([base64], prompt, 256);

  const parsed = tryParseJson<{
    found?: boolean;
    type?: string;
    label?: string;
    location?: string;
    interactable?: boolean;
  }>(stripCodeFences(content));

  if (parsed === null || parsed.found === false) return null;

  return {
    type: String(parsed.type ?? 'other'),
    label: String(parsed.label ?? description),
    location: String(parsed.location ?? 'center'),
    interactable: Boolean(parsed.interactable ?? true),
  };
}

/**
 * Extract all readable text from a screenshot using Vision LLM.
 *
 * Preferred over Tesseract OCR when the text is rendered in a non-standard
 * font, is overlaid on a complex background, or when layout preservation
 * matters (e.g., tables, columns, forms).
 *
 * @example
 *   const text = await extractText({ windowTitle: 'Invoice.pdf - Adobe Acrobat' });
 */
export async function extractText(options?: ScreenshotOptions): Promise<string> {
  const base64 = await acquireScreenshot(options);

  const prompt = `Extract all readable text from this screenshot. Preserve the visual layout as closely as possible using whitespace and line breaks. Include labels, button text, menu items, body text, error messages, and any other visible text. Return only the extracted text — no commentary, no JSON.`;

  const { content } = await callVisionLLM([base64], prompt, 2_000);
  return content;
}

/**
 * Compare two screenshots and describe what changed between them.
 *
 * Both images are sent to the Vision LLM simultaneously.  Useful for verifying
 * that an automated action had the expected visual effect.
 *
 * @param before  Raw base64-encoded PNG of the earlier state.
 * @param after   Raw base64-encoded PNG of the later state.
 * @returns  Natural-language description of the differences observed.
 *
 * @example
 *   const before = await captureFullScreen();
 *   await clickSomeButton();
 *   const after = await captureFullScreen();
 *   const diff = await diffScreenshots(before, after);
 */
export async function diffScreenshots(before: string, after: string): Promise<string> {
  const prompt = `You are given two screenshots of the same desktop: the FIRST image shows the state BEFORE an action, and the SECOND image shows the state AFTER the action.

Describe what changed between the two screenshots. Focus on:
- UI elements that appeared or disappeared
- Text that changed
- Dialog boxes, notifications, or error messages that appeared
- Visual state changes (e.g. buttons activated, checkboxes ticked, fields filled)
- Any navigation or page changes

Be specific and concise. If the screenshots appear identical, say so.`;

  const { content } = await callVisionLLM([before, after], prompt, 512);
  return content;
}
