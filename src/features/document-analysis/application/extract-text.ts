import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';
// Types for input files since we might handle browser `File` objects or Node `Buffer`s in v2.1
export type FileInput = {
  name: string;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripRtf(rtf: string): string {
  return rtf
    .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict)[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/gi, '')
    .replace(/\\[a-z]+\*?-?\d*\s?/gi, '')
    .replace(/\\u\d+\??/g, '')
    .replace(/[{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractTextFromFile(file: FileInput): Promise<string> {
  const type = file.type;
  const name = file.name.toLowerCase();

  // PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text.trim();
    } catch (e) {
      console.warn('pdf-parse failed, returning empty string', e);
      return '';
    } finally {
      await parser.destroy();
    }
  }

  // DOCX (Word)
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // XLSX / XLS (Excel)
  if (
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel' ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  ) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const parts = wb.SheetNames.map((sheetName: string) => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return '';
      const csv = XLSX.utils.sheet_to_csv(ws);
      return `[Sheet: ${sheetName}]\n${csv}`;
    });
    return parts.join('\n\n').trim();
  }

  // RTF
  if (type === 'application/rtf' || type === 'text/rtf' || name.endsWith('.rtf')) {
    const text = await file.text();
    return stripRtf(text);
  }

  // HTML
  if (type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) {
    const text = await file.text();
    return stripHtml(text);
  }

  // Explicitly block images, audio, and video to prevent raw binary from being sent to the AI
  if (type.startsWith('image/') || type.startsWith('audio/') || type.startsWith('video/')) {
    throw new Error(`Extraction for ${type} is not yet supported in this version. OCR and Media processing are pending implementation.`);
  }

  // Everything else (TXT, MD, CSV, JSON, etc.)
  return file.text();
}
