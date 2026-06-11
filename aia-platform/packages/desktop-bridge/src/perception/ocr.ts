/**
 * OCR layer — Tesseract.js-based text extraction from screen captures.
 *
 * Used as a fallback when the Accessibility API returns an empty tree
 * (common with Electron, CEF, or UWP apps that don't expose UI Automation).
 *
 * Tesseract.js runs entirely in-process (WASM); no external server needed.
 */

import type { ScreenCapture } from '../types.js';

export interface OcrResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bounds: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export class OcrReader {
  /**
   * Extract text from a ScreenCapture using Tesseract.js.
   *
   * @param capture The image to process.
   * @param lang Tesseract language code (default: 'eng'). Pass 'ita+eng' for
   *             mixed Italian/English UIs common in TicketOne.
   */
  async recognize(capture: ScreenCapture, lang = 'eng'): Promise<OcrResult> {
    // Dynamic import — Tesseract.js is a large dependency; only load when needed
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker(lang);

    try {
      const { data } = await worker.recognize(capture.buffer);

      const words = (data.words ?? []).map((w) => ({
        text: w.text,
        confidence: w.confidence / 100, // normalize to 0-1
        bounds: {
          x0: w.bbox.x0,
          y0: w.bbox.y0,
          x1: w.bbox.x1,
          y1: w.bbox.y1,
        },
      }));

      return {
        text: data.text.trim(),
        confidence: (data.confidence ?? 0) / 100,
        words,
      };
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Quick single-string extraction without word-level detail.
   * Preferred for "just give me the text" use cases.
   */
  async extractText(capture: ScreenCapture, lang = 'eng'): Promise<string> {
    const result = await this.recognize(capture, lang);
    return result.text;
  }
}
