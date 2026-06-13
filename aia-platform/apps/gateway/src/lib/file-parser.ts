import { inflateRawSync } from 'node:zlib';

export interface ParsedFile {
  text: string;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getAllowedMimeTypes(): string[] {
  return [...ALLOWED_MIME_TYPES];
}

/**
 * Extract text content from a file buffer based on its MIME type.
 *
 * - text/plain, text/markdown  → UTF-8 decode directly
 * - application/pdf            → placeholder (async extraction not supported without native libs)
 * - application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *                              → parse word/document.xml from ZIP
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'text/plain':
    case 'text/markdown':
      return buffer.toString('utf-8');

    case 'application/pdf':
      return extractPdfText(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocxText(buffer);

    default:
      throw new Error(`Unsupported MIME type for text extraction: ${mimeType}`);
  }
}

/**
 * PDF text extraction placeholder.
 * A proper implementation requires a native binding (e.g. pdfjs-dist) which
 * adds ~20MB to the bundle. For now we store the file and flag it for async
 * processing. The ingestion pipeline can handle re-extraction once a parser
 * is wired in.
 */
function extractPdfText(_buffer: Buffer): string {
  return 'PDF content extraction pending - file stored for async processing';
}

/**
 * Extract plain text from a DOCX file.
 * DOCX is a ZIP archive; the textual content lives in word/document.xml.
 * We unzip synchronously, locate the entry, and strip XML tags.
 */
function extractDocxText(buffer: Buffer): string {
  const xmlContent = extractZipEntry(buffer, 'word/document.xml');
  return stripXmlTags(xmlContent);
}

/**
 * Minimal ZIP local-file-header parser.
 * Reads entries sequentially until it finds the target filename,
 * then decompresses if necessary (method 8 = DEFLATE, method 0 = stored).
 *
 * This intentionally avoids external dependencies. It handles the subset
 * of ZIP features used by Office Open XML (no Zip64, no encryption).
 */
function extractZipEntry(zipBuffer: Buffer, targetPath: string): string {
  const LOCAL_FILE_SIGNATURE = 0x04034b50;
  let offset = 0;

  while (offset < zipBuffer.length - 30) {
    const sig = zipBuffer.readUInt32LE(offset);

    if (sig !== LOCAL_FILE_SIGNATURE) {
      // Not a local file header — we have reached the central directory
      break;
    }

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

    const fileNameStart = offset + 30;
    const fileName = zipBuffer.subarray(fileNameStart, fileNameStart + fileNameLength).toString('utf-8');

    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === targetPath) {
      const compressedData = zipBuffer.subarray(dataStart, dataEnd);

      if (compressionMethod === 0) {
        return compressedData.toString('utf-8');
      }

      if (compressionMethod === 8) {
        // DEFLATE (raw) — use inflateRawSync, not unzipSync
        const inflated = inflateRawSync(compressedData);
        return inflated.toString('utf-8');
      }

      throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
    }

    offset = dataEnd;
  }

  throw new Error(`Entry "${targetPath}" not found in ZIP archive`);
}

/**
 * Strip XML tags from a string and decode common XML entities.
 * Preserves whitespace between elements with a single space.
 */
function stripXmlTags(xml: string): string {
  const withSpaces = xml.replace(/<\/w:p>/gi, '\n').replace(/<[^>]+>/g, ' ');

  const decoded = withSpaces
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));

  return decoded.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
