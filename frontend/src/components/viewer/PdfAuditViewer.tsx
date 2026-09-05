'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import {
  zoomPlugin,
  RenderZoomInProps,
  RenderZoomOutProps,
} from '@react-pdf-viewer/zoom';

// Dynamically load Viewer with SSR disabled
const Viewer = dynamic(
  () => import('@react-pdf-viewer/core').then((mod) => mod.Viewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-sm">Loading PDF Statement...</span>
      </div>
    ),
  }
);

interface PdfAuditViewerProps {
  fileUrl: string;
  targetPage?: number; // 1-indexed
  verbatimQuote?: string;
  inputCell?: string;
  jumpPageTrigger?: { page: number; ts: number } | null;
  onPageChange?: (page: number) => void;
}

const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

export const PdfAuditViewer: React.FC<PdfAuditViewerProps> = ({
  fileUrl,
  targetPage = 1,
  verbatimQuote,
  inputCell,
  jumpPageTrigger,
  onPageChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(2);
  const [currentPage, setCurrentPage] = useState<number>(targetPage);

  // Initialize zoom plugin at top level of component
  const zoomPluginInstance = zoomPlugin();
  const { ZoomIn: ZoomInPlugin, ZoomOut: ZoomOutPlugin, zoomTo } = zoomPluginInstance;

  const scrollToPage = useCallback((pageNum: number) => {
    if (!containerRef.current) return;
    const pageIndex = pageNum - 1;
    // Find page element inside react-pdf-viewer container
    const pageEl = containerRef.current.querySelector(
      `[data-testid="core__page-layer-${pageIndex}"], .rpv-core__page-layer:nth-child(${pageNum})`
    );
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Jump to target page when targetPage prop changes
  const prevTargetPageRef = useRef(targetPage);
  useEffect(() => {
    if (targetPage && targetPage !== prevTargetPageRef.current) {
      prevTargetPageRef.current = targetPage;
      setCurrentPage(targetPage);
      scrollToPage(targetPage);
    }
  }, [targetPage, scrollToPage]);

  // Jump when explicit jumpPageTrigger is received (e.g. from HighlightInspector button)
  useEffect(() => {
    if (jumpPageTrigger && jumpPageTrigger.page) {
      setCurrentPage(jumpPageTrigger.page);
      scrollToPage(jumpPageTrigger.page);
    }
  }, [jumpPageTrigger, scrollToPage]);

  // Highlight verbatim quote in the text layer
  // High-precision highlighting scoped to target page, filtering out ubiquitous boilerplate dates
  const applyHighlights = useCallback(() => {
    if (!containerRef.current || !verbatimQuote) return;

    // Remove any previous highlights across the viewer
    const oldHighlights = containerRef.current.querySelectorAll('.audit-highlight-match');
    oldHighlights.forEach((el) => el.classList.remove('audit-highlight-match'));

    // If this is an unmatched discrepancy citation (e.g. C14 Suspense), do not highlight spurious text
    const lowerQuote = verbatimQuote.toLowerCase();
    if (
      lowerQuote.includes('no matching transaction') ||
      lowerQuote.includes('unmatched in pdf') ||
      lowerQuote.includes('zero entries match')
    ) {
      return;
    }

    const IGNORED_WORDS = new Set([
      'the', 'and', 'for', 'from', 'with', 'that', 'this', 'into',
      '2024', '2025', '2026', '2027', '2028',
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
      'march', 'april', 'date', 'time', 'post', 'value', 'type', 'balance', 'credit', 'debit',
      'tfr', 'tfr+', 'tfr-', 'trf', 'sct', 'nonref', 'chg', 'charges', 'sepa', 'payment',
      'current', 'account', 'statement', 'details', 'number', 'currency', 'eur', 'usd', 'gbp',
      'specified', 'range', 'outward', 'inward', 'internal'
    ]);

    // Check if a line is purely a generic date string like '31 Mar 2026'
    const isGenericBoilerplateLine = (line: string) => {
      const clean = line.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      const words = clean.split(/\s+/).filter(Boolean);
      return words.length > 0 && words.every((w) => IGNORED_WORDS.has(w) || /^\d{1,2}$/.test(w));
    };

    // Extract quote lines that are NOT generic date strings
    const quoteLines = verbatimQuote
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !isGenericBoilerplateLine(l));

    // Extract high-value tokens: numbers (e.g. 1.62, 13,217,773.59) and alphanumeric codes (e.g. 55051QC31ZHZ)
    const rawTokens = verbatimQuote
      .split(/[\s\n\t]+/)
      .map((t) => t.trim().replace(/^[,.]+|[,.]+$/g, ''))
      .filter((t) => t.length >= 3);

    const highValueTokens = rawTokens.filter((token) => {
      const lower = token.toLowerCase();
      if (IGNORED_WORDS.has(lower)) return false;
      // Keep if token has digits (amounts, references)
      if (/\d/.test(token)) return true;
      // Or if token is a distinct alphanumeric identifier (e.g. Cephalus) >= 5 chars
      return token.length >= 5;
    });

    // Scope search strictly to the target page layer so Page 2 citations never match Page 1 dates
    const pageIndex = (targetPage || 1) - 1;
    const targetPageLayer = containerRef.current.querySelector(
      `[data-testid="core__page-layer-${pageIndex}"], .rpv-core__page-layer:nth-child(${targetPage || 1})`
    );
    const searchScope = targetPageLayer || containerRef.current;
    const textDivs = searchScope.querySelectorAll('.rpv-core__text-layer-text');

    let firstMatchElement: HTMLElement | null = null;

    textDivs.forEach((div) => {
      const textContent = (div.textContent || '').trim();
      if (!textContent) return;
      const lowerText = textContent.toLowerCase();

      // Check if text matches meaningful quote line
      const isLineMatch = quoteLines.some((line) => {
        const lowerLine = line.toLowerCase();
        if (lowerText.includes(lowerLine)) return true;
        if (lowerLine.includes(lowerText) && lowerText.length > 4) return true;
        return false;
      });

      // Check if text matches high-value token (reference code or exact amount)
      const isTokenMatch = highValueTokens.some((token) => {
        const lowerToken = token.toLowerCase();
        // Exact match or contains distinct token
        return lowerText === lowerToken || (lowerText.includes(lowerToken) && lowerToken.length >= 4);
      });

      if (isLineMatch || isTokenMatch) {
        div.classList.add('audit-highlight-match');
        if (!firstMatchElement) {
          firstMatchElement = div as HTMLElement;
        }
      }
    });

    // Scroll first matching element into view within target page
    if (firstMatchElement) {
      (firstMatchElement as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [verbatimQuote, targetPage]);

  // Re-run highlighting when quote changes or after viewer finishes rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      applyHighlights();
    }, 600);

    const interval = setInterval(() => {
      applyHighlights();
    }, 1500);

    const stopTimer = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, [fileUrl, targetPage, verbatimQuote, applyHighlights]);

  if (!fileUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 gap-3 p-6 text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <span className="text-sm font-semibold text-slate-300">No Statement Document Loaded</span>
          <span className="text-xs text-slate-500">
            PDF source statements and verbatim audit highlights will appear here once an audit is active.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 select-text relative">
      {/* Viewer Toolbar */}
      <div className="h-10 bg-audit-panel border-b border-audit-border px-3 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
        {/* Page Nav */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              const prev = Math.max(currentPage - 1, 1);
              setCurrentPage(prev);
              scrollToPage(prev);
              onPageChange?.(prev);
            }}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono text-[11px] text-slate-300">
            Page <span className="text-sky-400 font-bold">{currentPage}</span> of {numPages}
          </span>

          <button
            onClick={() => {
              const next = Math.min(currentPage + 1, numPages);
              setCurrentPage(next);
              scrollToPage(next);
              onPageChange?.(next);
            }}
            disabled={currentPage >= numPages}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls & Fit */}
        <div className="flex items-center space-x-1">
          <ZoomOutPlugin>
            {(props: RenderZoomOutProps) => (
              <button
                onClick={props.onClick}
                title="Zoom Out"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            )}
          </ZoomOutPlugin>

          <button
            onClick={() => zoomTo(SpecialZoomLevel.PageWidth)}
            title="Fit to Width"
            className="px-2 py-0.5 rounded hover:bg-slate-800 text-[10px] font-mono text-slate-300 transition-colors border border-audit-border/60"
          >
            Fit Width
          </button>

          <ZoomInPlugin>
            {(props: RenderZoomInProps) => (
              <button
                onClick={props.onClick}
                title="Zoom In"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            )}
          </ZoomInPlugin>
        </div>
      </div>

      {/* Main Document Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full min-h-0 overflow-y-auto overflow-x-auto p-4 flex flex-col items-center bg-slate-900/90 relative"
      >
        <Worker workerUrl={WORKER_URL}>
          <div className="w-full h-full min-h-0 flex justify-center">
            <div className="w-full flex flex-col items-center shadow-2xl rounded pb-8">
              <Viewer
                fileUrl={fileUrl}
                defaultScale={SpecialZoomLevel.PageWidth}
                initialPage={targetPage - 1}
                plugins={[zoomPluginInstance]}
                onZoom={() => {
                  setTimeout(applyHighlights, 300);
                }}
                onDocumentLoad={(e) => {
                  const pages = e.doc.numPages;
                  setTimeout(() => {
                    setNumPages(pages);
                    applyHighlights();
                  }, 0);
                }}
                  renderError={() => (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8 text-center">
                      <AlertCircle className="w-8 h-8 text-amber-400" />
                      <span className="text-sm font-semibold">Unable to render PDF document</span>
                      <span className="text-xs text-slate-500 font-mono max-w-md truncate">
                        {fileUrl}
                      </span>
                    </div>
                  )}
                />
              </div>
            </div>
          </Worker>
      </div>
    </div>
  );
};
