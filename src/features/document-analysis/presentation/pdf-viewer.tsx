'use client';

/**
 * PdfViewer — renders every page of a PDF as canvas elements inside a
 * scrollable div.  The forwarded ref points to the scroll container so the
 * parent's scroll-control buttons (scrollTo / scrollBy / rAF auto-scroll)
 * work identically for PDFs and images.
 */

import { useEffect, useRef, forwardRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

// Lazy-import pdfjs so it is never bundled server-side
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  // Point at the pre-built worker we copied to /public
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjsLib;
}

export interface PdfViewerProps {
  /** Signed URL (or any HTTP URL) of the PDF file */
  src: string;
}

export const PdfViewer = forwardRef<HTMLDivElement, PdfViewerProps>(({ src }, ref) => {
  const pagesRef   = useRef<HTMLDivElement>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLoading(true);
    setError(null);
    setNumPages(0);

    (async () => {
      try {
        const pdfjsLib = await getPdfJs();

        const pdf = await pdfjsLib.getDocument({
          url:                       src,
          cMapUrl:                   'https://unpkg.com/pdfjs-dist/cmaps/',
          cMapPacked:                true,
          disableAutoFetch:          false,
          disableFontFace:           false,
        }).promise;

        if (cancelled) return;

        setNumPages(pdf.numPages);
        const container = pagesRef.current;
        if (!container) return;

        // Clear any previous render
        container.innerHTML = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;

          const page     = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });

          const wrapper        = document.createElement('div');
          wrapper.style.cssText = 'margin-bottom:8px;border-radius:8px;overflow:hidden;line-height:0';

          const canvas         = document.createElement('canvas');
          canvas.width         = viewport.width;
          canvas.height        = viewport.height;
          canvas.style.cssText = 'width:100%;display:block';

          wrapper.appendChild(canvas);
          container.appendChild(wrapper);

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [src]);

  return (
    <div ref={ref} className="flex-1 min-h-0 overflow-y-auto p-4 pr-12">

      {/* Loading state */}
      {loading && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-text-tertiary">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">
            {numPages > 0 ? `Rendering pages…` : 'Loading PDF…'}
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
            <FileText className="h-6 w-6 text-text-tertiary" />
          </div>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Pages container — hidden until loading completes */}
      <div
        ref={pagesRef}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
});

PdfViewer.displayName = 'PdfViewer';
