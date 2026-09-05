'use client';

import React from 'react';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { DocumentMeta, TieOutReport } from '@/types/lineage';

interface HeaderProps {
  documents: DocumentMeta[];
  activeDocumentId: string;
  onSelectDocument: (docId: string) => void;
  onOpenUpload: () => void;
  onRunAudit: () => void;
  onLoadDemoAudit?: () => void;
  onOpenTieOutModal?: () => void;
  tieOutReport?: TieOutReport | null;
  isAuditing?: boolean;
  coverageStats: {
    totalCells: number;
    verifiedCells: number;
    reviewRequired: number;
    coveragePercent: number;
    hallucinations: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onOpenUpload,
  onRunAudit,
  onLoadDemoAudit,
  onOpenTieOutModal,
  tieOutReport,
  isAuditing = false,
  coverageStats,
}) => {

  return (
    <header className="h-14 border-b border-audit-border bg-audit-panel px-4 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-400 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/10">
          <div className="w-full h-full bg-audit-panel rounded-[7px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sky-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              X-Ray <span className="text-sky-400 font-extrabold">Audit Copilot</span>
            </span>
          </div>
          <p className="text-[11px] text-audit-muted font-normal leading-none mt-0.5">
            Cell-to-PDF Lineage & Footing Verification Engine
          </p>
        </div>
      </div>

      {/* Center: Audit Confidence Meter & Tie-Out Engine */}
      <div className="flex items-center space-x-3">
        {/* Audit Confidence Pill */}
        {coverageStats.totalCells > 0 ? (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-semibold">Lineage Coverage:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {coverageStats.coveragePercent}%
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              {coverageStats.verifiedCells}/{coverageStats.totalCells} Traced
            </span>
            {coverageStats.reviewRequired > 0 && (
              <>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {coverageStats.reviewRequired} Review
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-slate-800/40 border border-audit-border px-3 py-1 rounded-lg text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Ready for Audit Ingestion</span>
          </div>
        )}

        {/* Footing & Tie-Out Engine Button */}
        {onOpenTieOutModal && tieOutReport && (
          <button
            onClick={onOpenTieOutModal}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-sm ${
              (tieOutReport?.total_unexplained_delta ?? 0) === 0
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
            title="Inspect Automated Tie-Out & Footing Bridges"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Tie-Outs: {tieOutReport?.passed_bridges ?? 3}/{tieOutReport?.total_bridges ?? 4} Tied
            </span>
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2.5">
        {onLoadDemoAudit && (
          <button
            onClick={onLoadDemoAudit}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all duration-150 cursor-pointer shadow-sm"
            title="Reload baseline Fund Reconciliation (Demo)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Load Demo Audit</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          disabled={isAuditing}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer ${
            isAuditing
              ? 'bg-blue-600/50 border-blue-500/40 text-blue-200 cursor-not-allowed'
              : 'border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white'
          }`}
        >
          {isAuditing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload PDFs</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
