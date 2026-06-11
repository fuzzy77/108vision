/**
 * VisionAnalyzer — LLM-powered screenshot understanding.
 *
 * Sends a ScreenCapture to a multimodal LLM (via @aia/ai-client) and returns:
 *   - A natural-language description of what's on screen
 *   - A structured list of visible UI elements (best-effort)
 *   - An optional answer to a specific question about the screen
 *
 * This is the highest-quality but most expensive perception method.
 * It is used as a fallback after Accessibility and OCR both fail or return
 * low-confidence results.
 */

import type { AIClient } from '@aia/ai-client';
import type { ScreenCapture, UIElement } from '../types.js';

export interface VisionAnalysisResult {
  /** Human-readable description of the screen content. */
  description: string;
  /** Best-effort list of visible UI elements extracted from the description. */
  elements: UIElement[];
  /** Answer to the optional question, if one was provided. */
  answer?: string;
}

const SYSTEM_PROMPT = `You are a desktop UI analyst. You receive screenshots of application windows.
Your task is to:
1. Describe what is visible on screen concisely (2-4 sentences).
2. List all interactive UI elements you can identify (buttons, text fields, menus, links).
3. If given a specific question, answer it directly based on what you see.

Respond in JSON with this schema:
{
  "description": "string",
  "elements": [
    {
      "role": "button|textfield|label|list|menuitem|checkbox|link|image|other",
      "name": "string — visible text or accessible name",
      "value": "string — current value or selected text",
      "bounds": { "x": 0, "y": 0, "width": 0, "height": 0 }
    }
  ],
  "answer": "string or null"
}
Note: bounds are approximate pixel coordinates from the visible image.`;

export async function analyzeScreenshot(
  capture: ScreenCapture,
  aiClient: AIClient,
  question?: string,
): Promise<VisionAnalysisResult> {
  const base64 = capture.buffer.toString('base64');
  const mimeType = capture.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUri = `data:${mimeType};base64,${base64}`;

  const userContent = question
    ? `Analyze this screenshot. Question: ${question}`
    : 'Analyze this screenshot.';

  // @aia/ai-client chat supports vision via the standard messages API.
  // The image is embedded as a data URI in the user message content array.
  // We cast to `any` for the image content block since ChatMessage.content
  // is typed as string in the current ai-client version — vision support
  // will be formally typed in a future update.
  const response = await aiClient.chat({
    model: 'balanced', // vision requires at least the balanced tier
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: [
          { type: 'text', text: userContent },
          { type: 'image_url', image_url: { url: dataUri } },
        ] as any,
      },
    ],
    temperature: 0.1,
    maxTokens: 1024,
  });

  const raw = response.choices[0]?.message.content ?? '{}';

  // Strip potential markdown code fences
  const json = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: {
    description?: string;
    elements?: unknown[];
    answer?: string | null;
  };
  try {
    parsed = JSON.parse(json) as typeof parsed;
  } catch {
    // LLM returned free text instead of JSON — wrap it
    return {
      description: raw,
      elements: [],
      answer: question ? raw : undefined,
    };
  }

  const elements: UIElement[] = (parsed.elements ?? []).map((e) => {
    const el = e as Record<string, unknown>;
    const bounds = (el['bounds'] as Record<string, number>) ?? {};
    return {
      role: String(el['role'] ?? 'other'),
      name: String(el['name'] ?? ''),
      value: String(el['value'] ?? ''),
      bounds: {
        x: bounds['x'] ?? 0,
        y: bounds['y'] ?? 0,
        width: bounds['width'] ?? 0,
        height: bounds['height'] ?? 0,
      },
      children: [],
      isEnabled: true,
      isEditable: (el['role'] === 'textfield'),
    };
  });

  return {
    description: parsed.description ?? '',
    elements,
    answer: parsed.answer ?? undefined,
  };
}
