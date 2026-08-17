/**
 * Client-side PDF compression.
 *
 * Strategy: render every page via PDF.js onto a canvas, encode as JPEG,
 * then reassemble into a new PDF with jsPDF.
 *
 * Multi-pass: if the first pass doesn't reach targetBytes, automatically
 * retries with lower scale + quality until the target is met or we give up.
 */

type CompressOptions = {
  /** Target output size in bytes. Compression retries until met or exhausted. */
  targetBytes?: number;
  /** Called after each page with a 0–100 integer progress value. */
  onProgress?: (pct: number) => void;
};

// Ordered from mild → aggressive — each pass lowers scale and quality
const PASSES = [
  { scale: 1.0, quality: 0.6 },
  { scale: 0.85, quality: 0.48 },
  { scale: 0.7, quality: 0.38 },
  { scale: 0.55, quality: 0.28 },
];

/** Maximum canvas dimension (px) per axis — prevents huge canvases on A3/tabloid PDFs */
const MAX_DIM = 1600;

async function renderPass(
  pdfDoc: Awaited<ReturnType<(typeof import('pdfjs-dist'))['getDocument']>['promise']>,
  jsPDF: (typeof import('jspdf'))['jsPDF'],
  scale: number,
  quality: number,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  let output: InstanceType<typeof jsPDF> | null = null;

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const raw = page.getViewport({ scale });

    // Cap dimensions — if the page is huge, scale down further
    const dimScale = Math.min(1, MAX_DIM / Math.max(raw.width, raw.height));
    const viewport = dimScale < 1 ? page.getViewport({ scale: scale * dimScale }) : raw;

    const w = Math.floor(viewport.width);
    const h = Math.floor(viewport.height);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    await page.render({ canvas, viewport }).promise;

    const imgData = canvas.toDataURL('image/jpeg', quality);

    // Free the canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;

    onProgress?.(Math.round((pageNum / pdfDoc.numPages) * 100));

    if (!output) {
      output = new jsPDF({
        unit: 'px',
        format: [w, h],
        orientation: w >= h ? 'landscape' : 'portrait',
        compress: true,
      });
    } else {
      output.addPage([w, h], w >= h ? 'landscape' : 'portrait');
    }

    output.addImage(imgData, 'JPEG', 0, 0, w, h);
  }

  if (!output) throw new Error('PDF document has no pages');
  return output.output('blob');
}

export async function compressPdf(
  file: File,
  { targetBytes, onProgress }: CompressOptions = {},
): Promise<File> {
  const [pdfjsLib, { jsPDF }] = await Promise.all([import('pdfjs-dist'), import('jspdf')]);

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const data = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data }).promise;

  let bestBlob: Blob | null = null;

  for (let i = 0; i < PASSES.length; i++) {
    const pass = PASSES[i];
    if (!pass) break;
    const { scale, quality } = pass;

    // On retries, wrap progress so it doesn't jump back to 0
    const passProgress = (pct: number) => onProgress?.(pct);

    const blob = await renderPass(pdfDoc, jsPDF, scale, quality, passProgress);

    bestBlob = blob;

    // If no target specified, one pass is enough
    if (!targetBytes) break;

    // Hit target — stop early
    if (blob.size <= targetBytes) break;

    // Last pass and still too big — return best we could do
  }

  const name = file.name.replace(/\.pdf$/i, '-compressed.pdf');
  return new File([bestBlob!], name, { type: 'application/pdf' });
}
