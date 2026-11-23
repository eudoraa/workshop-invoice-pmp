import * as pdfjsLib from 'pdfjs-dist';

// Configure CDN worker matching the installed pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PositionedTextItem {
  str: string;
  x: number;
  y: number;
}

/**
 * Extracts text from all pages of a PDF file using PDF.js.
 * Groups text items by vertical Y coordinate (with tolerance Math.abs(y1 - y2) <= 3)
 * from top to bottom, sorts X from left to right, and joins lines with '\n'
 * so table rows stay intact.
 */
export async function extractTextFromPdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdfDocument = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: PositionedTextItem[] = [];
    for (const rawItem of textContent.items) {
      if ('str' in rawItem && typeof rawItem.str === 'string') {
        const str = rawItem.str;
        if (!str.trim()) continue;
        const transform = rawItem.transform;
        const x = Array.isArray(transform) ? Number(transform[4]) || 0 : 0;
        const y = Array.isArray(transform) ? Number(transform[5]) || 0 : 0;
        items.push({ str, x, y });
      }
    }

    // Group items by Y coordinate (tolerance <= 3)
    const rowGroups: { y: number; items: PositionedTextItem[] }[] = [];
    for (const item of items) {
      const existingGroup = rowGroups.find((group) => Math.abs(group.y - item.y) <= 3);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        rowGroups.push({ y: item.y, items: [item] });
      }
    }

    // Sort rows from top to bottom (in PDF coordinate space, higher Y is higher on page)
    rowGroups.sort((a, b) => b.y - a.y);

    // Sort items within each row from left to right (ascending X)
    const lines = rowGroups.map((group) => {
      group.items.sort((a, b) => a.x - b.x);
      return group.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    });

    pageTexts.push(lines.filter(Boolean).join('\n'));
  }

  return pageTexts.join('\n');
}

/**
 * Converts a File object to a raw Base64 string (without data:... prefix) for multimodal Gemini extraction.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64Index = result.indexOf(',');
      resolve(base64Index >= 0 ? result.slice(base64Index + 1) : result);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file sebagai Base64.'));
    reader.readAsDataURL(file);
  });
}
