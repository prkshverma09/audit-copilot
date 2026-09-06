'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Quote,
  Copy,
  Check,
  Eye,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { LineageInput, AuditStatus, CellLineage } from '@/types/lineage';

interface HighlightInspectorProps {
  cellLineage?: CellLineage;
  input?: LineageInput;
  activeInput?: LineageInput;
  activeInputIndex?: number;
  status?: AuditStatus;
  totalPageCount?: number;
  onSelectInput?: (input: LineageInput, index: number) => void;
  onJumpToPage?: (page: number) => void;
}

function formatValue(val: number | string | undefined): string {
  if (val === undefined || val === null) return '—';
  if (typeof val === 'number') {
    return '€' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof val === 'string') {
    if (/[a-zA-Z]/.test(val)) return val;
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
    if (!isNaN(num)) {
      return '€' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }
  return String(val);
}

function shortenDocName(doc: string | undefined): string {
  if (!doc) return 'Statement PDF';
  // e.g. 20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf -> Calder EUR 0894
  const match = doc.match(/CALDER_([A-Z]+)_([0-9]+)/i);
  if (match) {
    return `Calder ${match[1]} ${match[2]}`;
  }
  // Generic cleanup: strip date prefix and .pdf
  const cleaned = doc.replace(/^[0-9]{8}_/, '').replace(/\.pdf$/i, '');
  return cleaned.length > 26 ? cleaned.slice(0, 24) + '…' : cleaned;
}

export const HighlightInspector: React.FC<HighlightInspectorProps> = ({
  cellLineage,
  input: fallbackInput,
  activeInput: propActiveInput,
  activeInputIndex = 0,
  status: fallbackStatus,
  onSelectInput,
  onJumpToPage,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const inputs =
    cellLineage?.inputs && cellLineage.inputs.length > 0
      ? cellLineage.inputs
      : fallbackInput
      ? [fallbackInput]
      : [];

  const currentActiveInput =
    propActiveInput ||
    (inputs.length > 0 ? inputs[activeInputIndex] || inputs[0] : fallbackInput);

  const status = cellLineage?.status || fallbackStatus || 'verified';
  const isVerified = status === 'verified';
  const isReview = status === 'review_required';
  const isMultiInput = inputs.length > 1;

  if (!cellLineage && inputs.length === 0) {
    return (
      <div className="bg-audit-panel/90 border-b border-audit-border px-3.5 py-2 flex items-center justify-between text-xs text-audit-muted">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Select any calculated cell in the sheet to inspect PDF evidence citations.</span>
        </div>
      </div>
    );
  }

  const handleCopyQuote = (quoteText: string, idx: number) => {
    if (quoteText) {
      navigator.clipboard.writeText(quoteText);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  };

  return (
    <div className="bg-audit-panel/95 backdrop-blur border-b border-audit-border px-3 py-2 flex flex-col gap-2 shrink-0 select-none shadow-sm z-10">
      {/* 1. Sleek Single-Line Header */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
            {cellLineage?.cell_id || currentActiveInput?.input_cell}
          </span>
          <span className="text-xs font-bold text-white truncate">
            {cellLineage?.metric_name || 'Evidence Citation'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 text-xs">
          <BookOpen className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-semibold text-slate-400">
            {inputs.length > 1 ? `${inputs.length} Evidence Sources` : '1 Evidence Source'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Equation Bar (Only when cell is composed of multiple inputs) */}
      {isMultiInput && cellLineage && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-950/60 rounded px-2 py-1 border border-slate-800/80 text-slate-300 overflow-x-auto">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">
            Sum:
          </span>
          {inputs.map((inp, idx) => (
            <React.Fragment key={inp.input_cell + idx}>
              {idx > 0 && <span className="text-sky-400 font-bold shrink-0">+</span>}
              <button
                onClick={() => {
                  onSelectInput?.(inp, idx);
                  onJumpToPage?.(inp.page_number);
                }}
                className={`cursor-pointer px-1.5 py-0.5 rounded transition-all shrink-0 text-left ${
                  idx === activeInputIndex
                    ? 'bg-sky-500/30 text-sky-200 font-bold border border-sky-400/80 shadow-xs'
                    : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-200'
                }`}
                title={`Click to view ${inp.input_cell} in PDF`}
              >
                {formatValue(inp.extracted_value)}{' '}
                <span className="text-slate-500">({inp.input_cell})</span>
              </button>
            </React.Fragment>
          ))}
          <span className="text-emerald-400 font-bold shrink-0">=</span>
          <span className="font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            {formatValue(cellLineage.calculated_value)} ({cellLineage.cell_id})
          </span>
        </div>
      )}

      {/* 3. Discrepancy Note (e.g. C14 Suspense Reserve) */}
      {cellLineage?.notes && (
        <div className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400">
              Audit Review Note:
            </span>
            <span className="text-slate-200 font-mono text-[11px] leading-relaxed">
              {cellLineage.notes}
            </span>
          </div>
        </div>
      )}

      {/* 4. Compact Source Evidence Cards */}
      <div className={`grid gap-2 ${isMultiInput ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {inputs.map((inp, idx) => {
          const isActive = idx === activeInputIndex;
          const isCopied = copiedIndex === idx;

          return (
            <div
              key={`${inp.input_cell}-${idx}`}
              className={`rounded-lg border p-2 flex flex-col gap-1.5 text-xs font-mono transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900/90 border-sky-400/80 shadow-md ring-1 ring-sky-400/20'
                  : 'bg-audit-bg/70 hover:bg-slate-900/50 border-audit-border/80'
              }`}
            >
              {/* Card Header: Cell, Amount, View State & Page */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isActive
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-sky-300 border border-slate-700'
                    }`}
                  >
                    {inp.input_cell}
                  </span>
                  <span className={`font-bold text-xs ${isReview ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatValue(inp.extracted_value)}
                  </span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {isMultiInput && (
                    isActive ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-semibold">
                        <Eye className="w-3 h-3 text-sky-400" />
                        Viewing in PDF
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectInput?.(inp, idx);
                          onJumpToPage?.(inp.page_number);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View in PDF
                      </button>
                    )
                  )}

                  <button
                    onClick={() => {
                      if (!isActive) onSelectInput?.(inp, idx);
                      onJumpToPage?.(inp.page_number);
                    }}
                    title="Jump to page in PDF"
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    p.{inp.page_number}
                  </button>
                </div>
              </div>

              {/* Card Quote Box */}
              <div className="bg-slate-950/70 rounded border border-slate-800/80 px-2 py-1 text-slate-200 flex items-start justify-between gap-1.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <Quote className="w-2.5 h-2.5 text-sky-400 shrink-0 mt-0.5 opacity-70" />
                  <p className="whitespace-pre-line text-[11px] leading-snug text-slate-200 truncate-2-lines">
                    {inp.verbatim_quote}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyQuote(inp.verbatim_quote, idx)}
                  title="Copy verbatim quote"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Card Footer: Clean Document Name */}
              <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate" title={inp.source_document}>
                  Doc: <span className="text-slate-300 font-medium">{shortenDocName(inp.source_document)}</span>
                </span>
                <span className="text-slate-500 shrink-0">Page {inp.page_number}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
