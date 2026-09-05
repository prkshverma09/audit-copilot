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
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuditCopilotPage() {
  const [sheetData, setSheetData] = useState<any[]>(getMockFortuneData());
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


  // Sync initial live sheet data and tie-out report from backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      try {
        const [liveSheet, initialTieOut] = await Promise.all([
          api.getSheetData('default'),
          api.getTieOutReport('default', false),
        ]);
        if (isMounted) {
          if (liveSheet && liveSheet.length > 0 && liveSheet[0].celldata?.length) {
            setSheetData(liveSheet);
          }
          if (initialTieOut) {
            setTieOutReport(initialTieOut);
          }
        }
      } catch (err) {
        console.warn('Could not load live sheet/tieout data, kept fallback:', err);
      }
    }
    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Target PDF URL & Page (resolved through API streaming endpoint or fallback)
  const pdfUrl = api.getDocumentUrl(
    activeDocument?.doc_id || '',
    activeDocument?.url || '/mock_documents/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf'
  );
  const targetPage = activeInput?.page_number || 1;
  const verbatimQuote = activeInput?.verbatim_quote || '';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-audit-bg">
      {/* Top Application Navigation */}
      <Header
        documents={lineageResponse.documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={selectDocument}
        onOpenUpload={openUpload}
        onRunAudit={() => triggerAuditRun()}
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
          <span className="text-[10px] text-sky-400 font-mono">LangGraph Agent Active</span>
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
              {/* Spreadsheet Grid View */}
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
        onUploadComplete={async (files, uploadRes) => {
          if (uploadRes?.documents && uploadRes.documents.length > 0) {
            uploadRes.documents.forEach((doc) => addUploadedDocument(doc));
            try {
              // Reload latest lineage and sheet from live backend
              const [latestLineage, latestSheet] = await Promise.all([
                api.getLineage('latest'),
                api.getSheetData('latest'),
              ]);
              if (latestLineage && Object.keys(latestLineage.cells || {}).length > 0) {
                setLineageResponse(latestLineage);
                if (latestLineage.documents && latestLineage.documents.length > 0) {
                  selectDocument(latestLineage.documents[0].doc_id);
                }
              }
              if (latestSheet && latestSheet.length > 0) {
                setSheetData(latestSheet);
              }
            } catch (err) {
              console.warn('Failed to refresh latest lineage after upload:', err);
            }
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
          triggerAuditRun();
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

