'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  BookOpen,
  Quote,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Sigma,
  CheckCircle2,
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

export const HighlightInspector: React.FC<HighlightInspectorProps> = ({
  cellLineage,
  input: fallbackInput,
  activeInput: propActiveInput,
  activeInputIndex = 0,
  status: fallbackStatus,
  totalPageCount = 2,
  onSelectInput,
  onJumpToPage,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Determine inputs list and active input
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

  if (!cellLineage && inputs.length === 0) {
    return (
      <div className="bg-audit-panel/90 border-b border-audit-border px-3.5 py-2.5 flex items-center justify-between text-xs text-audit-muted">
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

  const isMultiInput = inputs.length > 1;

  return (
    <div className="bg-audit-panel/95 backdrop-blur border-b border-audit-border px-3.5 py-2.5 flex flex-col gap-2.5 shrink-0 select-none shadow-md z-10">
      {/* Top Banner: Formula & Aggregation breakdown when cell has multiple inputs (e.g. C6 = C4 + D5) */}
      {isMultiInput && cellLineage && (
        <div className="rounded-md bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/30 p-2.5 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                <Sigma className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">
                Cell {cellLineage.cell_id}: {cellLineage.metric_name}
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-semibold border border-sky-500/30">
                Formula: {cellLineage.formula_display}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {inputs.length} Source Citations
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 ${
                  isVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {isVerified ? 'Tied Out & Verified' : 'Review Required'}
              </span>
            </div>
          </div>

          {/* Mathematical Equation Lineage Breakdown */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono bg-slate-950/60 rounded px-2 py-1 border border-slate-800 text-slate-300">
            <span className="text-slate-400 text-[11px]">Sum:</span>
            {inputs.map((inp, idx) => (
              <React.Fragment key={inp.input_cell + idx}>
                {idx > 0 && <span className="text-sky-400 font-bold">+</span>}
                <span
                  onClick={() => {
                    onSelectInput?.(inp, idx);
                    onJumpToPage?.(inp.page_number);
                  }}
                  className={`cursor-pointer px-1.5 py-0.2 rounded transition-colors ${
                    idx === activeInputIndex
                      ? 'bg-sky-500/30 text-sky-200 font-bold border border-sky-400'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={`Click to inspect ${inp.input_cell} statement in PDF`}
                >
                  {formatValue(inp.extracted_value)} <span className="text-slate-400">({inp.input_cell})</span>
                </span>
              </React.Fragment>
            ))}
            <span className="text-emerald-400 font-bold">=</span>
            <span className="font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
              {formatValue(cellLineage.calculated_value)} ({cellLineage.cell_id})
            </span>
          </div>
        </div>
      )}

      {/* Auditor Review Notice / Discrepancy Note (e.g. C14 Suspense) */}
      {cellLineage?.notes && (
        <div className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400">
              Audit Review Flag / Discrepancy Reason:
            </span>
            <span className="text-slate-200 font-mono text-[11px]">{cellLineage.notes}</span>
          </div>
        </div>
      )}

      {/* Evidence Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isVerified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-sky-400" />
            Audit Evidence Citation{isMultiInput ? 's' : ''}
          </span>
          {isMultiInput ? (
            <span className="text-xs text-sky-300 font-mono">
              [{inputs.map((i) => i.input_cell).join(' + ')}]
            </span>
          ) : (
            currentActiveInput && (
              <span className="text-xs text-slate-400 font-mono">[{currentActiveInput.input_cell}]</span>
            )
          )}
        </div>

        {/* Verification Seal */}
        {!isMultiInput && currentActiveInput && (
          <div className="flex items-center space-x-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 ${
                isVerified
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {isVerified ? 'Character-Matched' : 'Pending Confirmation'}
            </span>
          </div>
        )}
      </div>

      {/* Evidence Cards: Renders BOTH C4 and D5 cards when multi-input, or single card */}
      <div className={`grid gap-2.5 ${isMultiInput ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {inputs.map((inp, idx) => {
          const isActive = idx === activeInputIndex;
          const isCopied = copiedIndex === idx;

          return (
            <div
              key={`${inp.input_cell}-${idx}`}
              className={`relative rounded-md border p-2.5 flex flex-col gap-1.5 text-xs font-mono transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900/90 border-sky-400/80 shadow-md ring-1 ring-sky-400/30'
                  : 'bg-audit-bg/80 hover:bg-slate-900/60 border-audit-border/80'
              }`}
            >
              {/* Card Top: Input Cell Badge, Extracted Value, & Active View Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
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

                <div className="flex items-center space-x-1.5">
                  {isMultiInput && (
                    isActive ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-semibold">
                        <Eye className="w-3 h-3 text-sky-400" />
                        Viewing in PDF below
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectInput?.(inp, idx);
                          onJumpToPage?.(inp.page_number);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 text-[10px] font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View in PDF
                      </button>
                    )
                  )}

                  {/* Page Jump Button */}
                  <button
                    onClick={() => {
                      if (!isActive) {
                        onSelectInput?.(inp, idx);
                      }
                      onJumpToPage?.(inp.page_number);
                    }}
                    title="Jump to this page in PDF"
                    className="px-1.5 py-0.5 rounded bg-audit-card hover:bg-slate-700 text-slate-300 border border-audit-border text-[10px] transition-colors"
                  >
                    p.{inp.page_number}
                  </button>
                </div>
              </div>

              {/* Card Body: Verbatim Quote Box */}
              <div className="bg-slate-950/70 rounded border border-slate-800/80 p-2 text-slate-200 flex items-start justify-between gap-2">
                <div className="flex items-start gap-1.5 min-w-0">
                  <Quote className="w-3 h-3 text-sky-400 shrink-0 mt-0.5 opacity-80" />
                  <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-200 selection:bg-sky-500/30">
                    {inp.verbatim_quote}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyQuote(inp.verbatim_quote, idx)}
                  title="Copy Verbatim Quote"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Card Footer: Source Document Metadata */}
              <div className="pt-1 border-t border-slate-800/60 flex items-center text-[10px] text-slate-400">
                <span className="truncate" title={inp.source_document}>
                  Doc: <span className="text-slate-300">{inp.source_document}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
