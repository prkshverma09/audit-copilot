'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  ExternalLink,
  Sigma,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CellLineage, LineageInput, TieOutReport } from '@/types/lineage';

interface FormulaBannerProps {
  selectedCellId: string;
  lineage?: CellLineage;
  activeInputIndex: number;
  onSelectInput: (input: LineageInput, index: number) => void;
  onSelectCell?: (cellId: string) => void;
  tieOutReport?: TieOutReport | null;
  onOpenTieOutBridge?: () => void;
}


const QUICK_AUDIT_CELLS = [
  { id: 'C4', label: 'C4: Fund I Ledger (€13.2M)', status: 'verified' },
  { id: 'D5', label: 'D5: Fund II Ledger (€20.0K)', status: 'verified' },
  { id: 'C6', label: 'C6: Consolidated (€13.2M)', status: 'verified' },
  { id: 'C9', label: 'C9: Cephalus Inflow (€1.62)', status: 'verified' },
  { id: 'E11', label: 'E11: Tie-Out Δ €0.00', status: 'verified' },
  { id: 'C14', label: 'C14: Suspense Reserve', status: 'review' },
];

export const FormulaBanner: React.FC<FormulaBannerProps> = ({
  selectedCellId,
  lineage,
  activeInputIndex,
  onSelectInput,
  onSelectCell,
  tieOutReport,
  onOpenTieOutBridge,
}) => {

  if (!lineage) {
    return (
      <div className="h-11 border-b border-audit-border bg-audit-panel px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-3 text-xs text-audit-muted">
          <div className="px-2 py-0.5 rounded bg-audit-card border border-audit-border font-mono font-bold text-sky-400">
            {selectedCellId || 'None'}
          </div>
          <span className="italic">
            Select any cell with an audit dot or click a quick jump button:
          </span>
        </div>

        {/* Quick Jump Bar */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Audited Cells:</span>
          {QUICK_AUDIT_CELLS.map((cell) => (
            <button
              key={cell.id}
              onClick={() => onSelectCell?.(cell.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                cell.status === 'review'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-audit-card hover:bg-sky-500/20 text-sky-300 hover:text-white border border-audit-border'
              }`}
            >
              {cell.id}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isVerified = lineage.status === 'verified';
  const isReview = lineage.status === 'review_required';
  const hasTieOutDecoration = Boolean(tieOutReport?.cell_decorations?.[selectedCellId]);

  return (
    <div className="h-10 border-b border-audit-border bg-audit-panel/95 backdrop-blur px-3 shrink-0 select-none flex items-center justify-between gap-2 shadow-sm">
      {/* Left: Cell ID, Metric Title, Formula */}
      <div className="flex items-center space-x-2 min-w-0">
        {/* Cell Badge */}
        <div className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30 text-sky-300 font-mono font-bold text-xs shrink-0">
          {lineage.cell_id}
        </div>

        {/* Metric Name */}
        <span className="text-xs font-semibold text-white truncate max-w-[220px]">
          {lineage.metric_name}
        </span>

        <span className="text-slate-600">|</span>

        {/* Formula Equation Display */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-mono bg-audit-card px-2.5 py-0.5 rounded border border-audit-border/60">
          <Sigma className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Formula:</span>
          <span className="text-sky-300 font-semibold">{lineage.formula_display}</span>
        </div>
      </div>

      {/* Right: Quick Jump & Bridge Status */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="hidden xl:flex items-center space-x-1 border-r border-slate-700/80 pr-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Jump:</span>
          {QUICK_AUDIT_CELLS.map((cell) => {
            const isSelected = cell.id === selectedCellId;
            return (
              <button
                key={cell.id}
                onClick={() => onSelectCell?.(cell.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  isSelected
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400 font-bold'
                    : cell.status === 'review'
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20'
                    : 'bg-audit-card hover:bg-slate-700 text-slate-300 border border-audit-border/60'
                }`}
              >
                {cell.id}
              </button>
            );
          })}
        </div>

        {/* Footing & Tie-Out Bridge Button */}
        {hasTieOutDecoration ? (
          <button
            onClick={onOpenTieOutBridge}
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
              tieOutReport!.cell_decorations[selectedCellId].status === 'footed_and_tied'
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
            }`}
            title="Click to inspect the Arithmetic Bridge equation for this cell"
          >
            {tieOutReport!.cell_decorations[selectedCellId].status === 'footed_and_tied' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{tieOutReport!.cell_decorations[selectedCellId].badge_label}</span>
            <span className="text-[10px] text-sky-300 underline ml-0.5 font-bold">Inspect Bridge</span>
          </button>
        ) : isVerified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Verified Lineage
          </span>
        ) : isReview ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            Review Required
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <HelpCircle className="w-3 h-3" />
            Unmatched
          </span>
        )}
      </div>
    </div>
  );
};
