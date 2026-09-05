'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calculator,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { TieOutReport, TieOutBridge } from '@/types/lineage';

interface TieOutBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: TieOutReport | null;
  onSelectCell: (cellId: string) => void;
  onToggleSimulateDiscrepancy: (simulate: boolean) => void;
  isSimulatingDiscrepancy: boolean;
}

export const TieOutBridgeModal: React.FC<TieOutBridgeModalProps> = ({
  isOpen,
  onClose,
  report,
  onSelectCell,
  onToggleSimulateDiscrepancy,
  isSimulatingDiscrepancy,
}) => {
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !report || !mounted) return null;

  const activeBridge =
    report.bridges.find((b) => b.bridge_id === selectedBridgeId) || report.bridges[0];

  const formatCurrency = (val: number) => {
    return `€${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Automated Tie-Out & Footing Engine
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Grounded mathematical verification, vertical footing, and cross-statement bridges
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Stress Test / Simulate Variance Toggle */}
            <button
              onClick={() => onToggleSimulateDiscrepancy(!isSimulatingDiscrepancy)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isSimulatingDiscrepancy
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Simulate accounting variance to demonstrate discrepancy detection"
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${isSimulatingDiscrepancy ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}
              />
              <span>
                {isSimulatingDiscrepancy ? 'Simulated Variance: Active' : 'Simulate Discrepancy Test'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Scorecard Banner */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-slate-800 bg-slate-900/60 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Mathematical Bridges
            </span>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {report.passed_bridges} / {report.total_bridges} Passed
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Footing Accuracy
            </span>
            <div
              className={`text-base font-bold font-mono mt-0.5 ${
                report.accuracy_rate >= 90 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {report.accuracy_rate}%
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Unexplained Variance
            </span>
            <div
              className={`text-base font-bold font-mono mt-0.5 ${
                report.total_unexplained_delta === 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(report.total_unexplained_delta)}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Audit Status
            </span>
            <div className="mt-0.5 flex items-center space-x-1 font-semibold text-white">
              {report.total_unexplained_delta === 0 ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">100% Tied</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">Flagged Variance</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body Split: Bridge Navigation List (Left) & Active Bridge Inspector (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
          {/* Bridge Selector Column */}
          <div className="p-4 overflow-y-auto space-y-2 bg-slate-950/40">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block px-1 mb-2">
              Verification Bridges ({report.bridges.length})
            </span>

            {report.bridges.map((bridge) => {
              const isSelected = activeBridge.bridge_id === bridge.bridge_id;
              const isTied = bridge.status === 'footed_and_tied';
              const isDiscrepancy = bridge.status === 'discrepancy';

              return (
                <div
                  key={bridge.bridge_id}
                  onClick={() => setSelectedBridgeId(bridge.bridge_id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500/60 shadow-md ring-1 ring-sky-500/20'
                      : 'bg-slate-900/70 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white truncate">{bridge.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {bridge.target_cell}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 truncate mb-2">
                    {bridge.formula_display}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isTied
                          ? 'text-emerald-400'
                          : isDiscrepancy
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {isTied ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {bridge.status_label}
                    </span>

                    <span className="text-slate-500 font-mono text-[10px]">
                      Δ {formatCurrency(bridge.delta)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Bridge Inspector Details */}
          <div className="md:col-span-2 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Bridge Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {activeBridge.bridge_type.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        activeBridge.status === 'footed_and_tied'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : activeBridge.status === 'discrepancy'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {activeBridge.status_label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">{activeBridge.name}</h3>
                </div>

                <button
                  onClick={() => {
                    onSelectCell(activeBridge.target_cell);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md"
                >
                  <span>Select {activeBridge.target_cell} in Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mathematical Equation Ribbon */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Reconciliation Equation
                </span>
                <div className="text-sky-300 font-bold text-base flex items-center space-x-2">
                  <span>{activeBridge.formula_display}</span>
                </div>
              </div>

              {/* Source Inputs Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Inputs & Supporting Evidence ({activeBridge.inputs.length} Terms)
                </span>
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40">
                  {activeBridge.inputs.map((input, idx) => (
                    <div
                      key={`${input.cell_id}-${idx}`}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {input.cell_id}
                        </span>
                        <div>
                          <span className="font-semibold text-white block">{input.label}</span>
                          {input.source_doc && (
                            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>
                                {input.source_doc} (p.{input.page_number})
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          {formatCurrency(input.amount)}
                        </span>
                        {input.verbatim_quote && (
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Verbatim: &quot;{input.verbatim_quote}&quot;
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arithmetic Variance Calculation Table */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Calculated Value
                  </span>
                  <span className="text-sm font-mono font-bold text-white mt-1 block">
                    {formatCurrency(activeBridge.expected_value)}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Reported Ledger
                  </span>
                  <span className="text-sm font-mono font-bold text-white mt-1 block">
                    {formatCurrency(activeBridge.reported_value)}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    activeBridge.delta === 0
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">
                    Delta Variance (Δ)
                  </span>
                  <span
                    className={`text-sm font-mono font-bold mt-1 block ${
                      activeBridge.delta === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeBridge.delta === 0 ? '€0.00 (Tied)' : formatCurrency(activeBridge.delta)}
                  </span>
                </div>
              </div>

              {/* Audit Commentary & Resolution */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                  Audit Commentary
                </span>
                <p className="text-slate-300 leading-relaxed">{activeBridge.notes}</p>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Zero-Variance Tie-Out Standard</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
