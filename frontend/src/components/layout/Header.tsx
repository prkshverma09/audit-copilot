'use client';

import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DocumentMeta } from '@/types/lineage';

interface HeaderProps {
  documents: DocumentMeta[];
  activeDocumentId: string;
  onSelectDocument: (docId: string) => void;
  onOpenUpload: () => void;
  onRunAudit: () => void;
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
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Ylookup AI
            </span>
          </div>
          <p className="text-[11px] text-audit-muted font-normal leading-none">
            Cell-to-PDF Lineage & Footing Verification Engine
          </p>
        </div>
      </div>

      {/* Center: Statement Selector & Audit Confidence Meter */}
      <div className="flex items-center space-x-4">
        {/* Document Selector */}
        <div className="flex items-center space-x-2 bg-audit-bg/80 border border-audit-border px-2.5 py-1 rounded-lg">
          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs text-audit-muted font-medium">Statement:</span>
          <select
            id="statement-selector"
            name="statement-selector"
            value={activeDocumentId}
            onChange={(e) => onSelectDocument(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none cursor-pointer max-w-[240px] truncate"
          >
            {documents.map((doc) => (
              <option key={doc.doc_id} value={doc.doc_id} className="bg-slate-900 text-slate-200">
                {doc.filename}
              </option>
            ))}
          </select>
        </div>

        {/* Audit Confidence Pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs">
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
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-audit-border bg-audit-bg hover:bg-audit-card text-xs font-medium text-slate-300 hover:text-white transition-all duration-150"
        >
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span>Upload PDFs</span>
        </button>

        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-150 ${
            isAuditing
              ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-blue-500/20 active:scale-95'
          }`}
        >
          {isAuditing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Audit</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
