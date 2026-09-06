'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { SplitPaneContainer } from '@/components/layout/SplitPaneContainer';
import { FormulaBanner } from '@/components/sheet/FormulaBanner';
import { SpreadsheetView } from '@/components/sheet/SpreadsheetView';
import { PdfAuditViewer } from '@/components/viewer/PdfAuditViewer';
import { HighlightInspector } from '@/components/viewer/HighlightInspector';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { useLineage } from '@/hooks/useLineage';
import { usePipeline } from '@/hooks/usePipeline';
import { getMockFortuneData } from '@/services/mockData';
import { api } from '@/services/api';
import { TieOutReport } from '@/types/lineage';
import { TieOutBridgeModal } from '@/components/sheet/TieOutBridgeModal';
import { Sparkles, CheckCircle2, ArrowRight, Upload, ShieldCheck } from 'lucide-react';

const EMPTY_FORTUNE_DATA: any[] = [
  {
    name: 'Reconciliation',
    id: 'sheet_empty',
    celldata: [],
    rowCount: 30,
    columnCount: 15,
  },
];

export default function AuditCopilotPage() {
  const [sheetData, setSheetData] = useState<any[]>(EMPTY_FORTUNE_DATA);
  const [jumpRequest, setJumpRequest] = useState<{ page: number; ts: number } | null>(null);

  // Task S.1: Automated Tie-Out & Footing Engine State
  const [tieOutReport, setTieOutReport] = useState<TieOutReport | null>(null);
  const [isTieOutModalOpen, setIsTieOutModalOpen] = useState(false);
  const [isSimulatingDiscrepancy, setIsSimulatingDiscrepancy] = useState(false);

  const {
    lineageResponse,
    setLineageResponse,
    selectedCellId,
    activeCellLineage,
    activeInputIndex,
    activeInput,
    activeDocument,
    activeDocumentId,
    selectCell,
    selectInput,
    selectDocument,
    addUploadedDocument,
  } = useLineage();

  const {
    isUploadOpen,
    openUpload,
    closeUpload,
    isAuditing,
    auditMessage,
    triggerAuditRun,
    coverageStats,
  } = usePipeline(lineageResponse.cells);

  const loadDemoAudit = async () => {
    try {
      const [defaultLineage, defaultSheet, defaultTieOut] = await Promise.all([
        api.getLineage('default'),
        api.getSheetData('default'),
        api.getTieOutReport('default', false),
      ]);
      if (defaultLineage) {
        setLineageResponse(defaultLineage);
        if (defaultLineage.documents && defaultLineage.documents.length > 0) {
          selectDocument(defaultLineage.documents[0].doc_id);
        }
        selectCell('C4', defaultLineage);
      }
      const sheet = (defaultSheet && defaultSheet.length > 0 && defaultSheet[0]?.celldata?.length > 0)
        ? defaultSheet
        : getMockFortuneData();
      setSheetData(sheet);
      if (defaultTieOut) {
        setTieOutReport(defaultTieOut);
      }
    } catch (err) {
      console.warn('Error reloading demo audit:', err);
    }
  };

  const refreshAuditData = async (jobOrSheetId = 'latest') => {
    try {
      const [latestLineage, latestSheet, latestTieOut] = await Promise.all([
        api.getLineage(jobOrSheetId),
        api.getSheetData(jobOrSheetId),
        api.getTieOutReport(jobOrSheetId, false),
      ]);
      if (latestLineage && Object.keys(latestLineage.cells || {}).length > 0) {
        setLineageResponse(latestLineage);
        if (latestLineage.documents && latestLineage.documents.length > 0) {
          selectDocument(latestLineage.documents[0].doc_id);
        }
        selectCell('C4', latestLineage);
      }
      const sheet = (latestSheet && latestSheet.length > 0 && latestSheet[0]?.celldata?.length > 0)
        ? latestSheet
        : getMockFortuneData();
      setSheetData(sheet);
      if (latestTieOut) {
        setTieOutReport(latestTieOut);
      }
    } catch (err) {
      console.warn('Failed to refresh latest lineage/sheet:', err);
    }
  };

  const handleToggleSimulateDiscrepancy = async (simulate: boolean) => {
    setIsSimulatingDiscrepancy(simulate);
    try {
      const updated = await api.getTieOutReport('default', simulate);
      if (updated) {
        setTieOutReport(updated);
      }
    } catch (err) {
      console.warn('Could not toggle simulated discrepancy:', err);
    }
  };

  // Target PDF URL & Page (resolved through API streaming endpoint)
  const pdfUrl = activeDocument
    ? api.getDocumentUrl(activeDocument.doc_id, activeDocument.url)
    : '';
  const targetPage = activeInput?.page_number || 1;
  const verbatimQuote = activeInput?.verbatim_quote || '';

  // Expose cell selector for programmatic/test interaction without requiring UI jump buttons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectAuditCell = (cellId: string) => {
        selectCell(cellId);
      };
    }
  }, [selectCell]);

  const hasAuditLoaded = Object.keys(lineageResponse.cells || {}).length > 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-audit-bg">
      {/* Top Application Navigation */}
      <Header
        documents={lineageResponse.documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={selectDocument}
        onOpenUpload={openUpload}
        onRunAudit={() => triggerAuditRun([], (jobId) => refreshAuditData(jobId))}
        onLoadDemoAudit={loadDemoAudit}
        onOpenTieOutModal={() => setIsTieOutModalOpen(true)}
        tieOutReport={tieOutReport}
        isAuditing={isAuditing}
        coverageStats={coverageStats}
      />

      {/* Audit Pipeline Toast Notification */}
      {auditMessage && (
        <div className="bg-sky-950/90 border-b border-sky-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-sky-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="font-medium">{auditMessage}</span>
          </div>
          <span className="text-[10px] text-sky-400 font-mono">Audit Engine Active</span>
        </div>
      )}

      {/* Formula & Lineage Breadcrumb Banner */}
      <FormulaBanner
        selectedCellId={selectedCellId}
        lineage={activeCellLineage}
        activeInputIndex={activeInputIndex}
        onSelectInput={selectInput}
        onSelectCell={selectCell}
        tieOutReport={tieOutReport}
        onOpenTieOutBridge={() => setIsTieOutModalOpen(true)}
      />

      {/* Main Split-Screen Desktop Workspace */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <SplitPaneContainer
          initialSplitRatio={52}
          left={
            <div className="w-full h-full flex flex-col overflow-hidden">
              {/* Spreadsheet Grid View or Intake Card */}
              {!hasAuditLoaded ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-audit-bg/95 relative overflow-hidden select-none">
                  <div className="max-w-md w-full bg-audit-panel border border-audit-border rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-400 p-[1px] shadow-lg shadow-sky-500/20">
                      <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-sky-400" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        X-Ray Audit Copilot
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Autonomous financial data lineage, mathematical footing tie-outs, and character-grounded PDF statement verification.
                      </p>
                    </div>

                    <div className="w-full flex flex-col gap-3">
                      <button
                        onClick={loadDemoAudit}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent hover:from-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between transition-all group shadow-sm hover:shadow-amber-500/10 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                              Load Demo Audit
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Calder Fund Q1 Reconciliation & Verified Lineage
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>

                      <button
                        onClick={openUpload}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent hover:from-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-semibold flex items-center justify-between transition-all group shadow-sm hover:shadow-sky-500/10 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 text-sky-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                              Upload Statements & Run Audit
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Extract lineage & verify tie-outs from PDF statements
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Strict zero-hallucination verification standard</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 w-full h-full overflow-hidden">
                  <SpreadsheetView
                    sheetData={sheetData}
                    lineageData={lineageResponse}
                    selectedCellId={selectedCellId}
                    onSelectAuditCell={selectCell}
                    onChange={setSheetData}
                    tieOutReport={tieOutReport}
                  />
                </div>
              )}
            </div>
          }

          right={
            <div className="w-full h-full flex flex-col overflow-hidden bg-audit-panel">
              {/* Top: Highlight & Citation Evidence Inspector */}
              <HighlightInspector
                cellLineage={activeCellLineage}
                activeInput={activeInput}
                activeInputIndex={activeInputIndex}
                status={activeCellLineage?.status}
                totalPageCount={activeDocument?.page_count || 2}
                onSelectInput={selectInput}
                onJumpToPage={(pageNum) => {
                  setJumpRequest({ page: pageNum, ts: Date.now() });
                }}
              />

              {/* Bottom: PDF Viewer with Quote Highlighting */}
              <div className="flex-1 w-full h-full overflow-hidden">
                <PdfAuditViewer
                  fileUrl={pdfUrl}
                  targetPage={targetPage}
                  verbatimQuote={verbatimQuote}
                  inputCell={activeInput?.input_cell}
                  jumpPageTrigger={jumpRequest}
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Multi-PDF Upload Dropzone Modal */}
      <FileDropzone
        isOpen={isUploadOpen}
        onClose={closeUpload}
        onUploadComplete={async (files, uploadRes, completedJobId) => {
          if (uploadRes?.documents && uploadRes.documents.length > 0) {
            uploadRes.documents.forEach((doc) => addUploadedDocument(doc));
          } else {
            // Local fallback simulation
            files.forEach((f, idx) => {
              let fileBlobUrl = '';
              try {
                fileBlobUrl = URL.createObjectURL(f);
              } catch {
                fileBlobUrl = '/mock_documents/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf';
              }
              addUploadedDocument({
                doc_id: `doc_upload_${Date.now()}_${idx}`,
                filename: f.name,
                url: fileBlobUrl || '/mock_documents/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf',
                page_count: 2,
                category: 'bank_statement',
                upload_date: new Date().toISOString().slice(0, 10),
                file_size: f.size,
              });
            });
          }
          await refreshAuditData(completedJobId || 'latest');
        }}
      />

      {/* Automated Tie-Out & Footing Bridge Modal */}
      <TieOutBridgeModal
        isOpen={isTieOutModalOpen}
        onClose={() => setIsTieOutModalOpen(false)}
        report={tieOutReport}
        onSelectCell={(cellId) => selectCell(cellId)}
        onToggleSimulateDiscrepancy={handleToggleSimulateDiscrepancy}
        isSimulatingDiscrepancy={isSimulatingDiscrepancy}
      />
    </div>
  );
}

