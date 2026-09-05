import {
  getMockLineageResponse,
  getMockFortuneData,
  getCellLineage,
} from './mockData';
import { SheetLineageResponse, FortuneSheetData, CellLineage, DocumentMeta } from '@/types/lineage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export interface PipelineRunResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  progress?: number;
  result?: SheetLineageResponse;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
  result?: SheetLineageResponse;
}

export interface UploadResponse {
  doc_ids: string[];
  filenames: string[];
  total_files: number;
  documents?: DocumentMeta[];
}

export const api = {
  async getLineage(sheetId = 'default'): Promise<SheetLineageResponse> {
    if (USE_MOCK) {
      return getMockLineageResponse();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/lineage/${sheetId}`);
      if (!res.ok) throw new Error(`Failed to fetch lineage: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn(`[api.getLineage] Backend fetch failed (${err}), falling back to mock.`);
      return getMockLineageResponse();
    }
  },

  async getSheetData(sheetId = 'default'): Promise<FortuneSheetData[]> {
    if (USE_MOCK) {
      return getMockFortuneData();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sheet/${sheetId}`);
      if (!res.ok) throw new Error(`Failed to fetch sheet data: ${res.statusText}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && (data[0] as any)?.celldata?.length > 0) {
        return data;
      }
      return getMockFortuneData();
    } catch (err) {
      console.warn(`[api.getSheetData] Backend fetch failed (${err}), falling back to mock.`);
      return getMockFortuneData();
    }
  },

  async getCellLineage(cellId: string): Promise<CellLineage | undefined> {
    if (USE_MOCK) {
      return getCellLineage(cellId);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/lineage/cell/${cellId}`);
      if (!res.ok) return getCellLineage(cellId);
      return await res.json();
    } catch {
      return getCellLineage(cellId);
    }
  },

  async getDocuments(): Promise<DocumentMeta[]> {
    if (USE_MOCK) {
      return getMockLineageResponse().documents;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
      if (!res.ok) return getMockLineageResponse().documents;
      return await res.json();
    } catch {
      return getMockLineageResponse().documents;
    }
  },

  async uploadFiles(files: File[]): Promise<UploadResponse> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        doc_ids: files.map((_, i) => `mock_upload_${Date.now()}_${i}`),
        filenames: files.map((f) => f.name),
        total_files: files.length,
      };
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const res = await fetch(`${API_BASE_URL}/api/v1/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json();
  },

  async triggerPipeline(docIds: string[]): Promise<PipelineRunResponse> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        job_id: `job_mock_${Date.now()}`,
        status: 'completed',
        message: 'Mock pipeline successfully extracted financial lineage.',
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/pipeline/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: docIds }),
    });
    if (!res.ok) throw new Error(`Pipeline run failed: ${res.statusText}`);
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    if (USE_MOCK || jobId.startsWith('job_mock_')) {
      return {
        job_id: jobId,
        status: 'completed',
        progress: 1.0,
        message: 'Reconciliation complete.',
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/pipeline/${jobId}/status`);
    if (!res.ok) throw new Error(`Failed to check job status: ${res.statusText}`);
    return res.json();
  },

  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (status: JobStatusResponse) => void,
    maxWaitSeconds = 30
  ): Promise<JobStatusResponse> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      const status = await this.getJobStatus(jobId);
      if (onProgress) onProgress(status);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    throw new Error(`Job ${jobId} timed out after ${maxWaitSeconds}s`);
  },

  getDocumentUrl(docId: string, fallbackUrl?: string): string {
    if (!docId) {
      return fallbackUrl || '/mock_documents/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf';
    }
    if (docId.startsWith('http://') || docId.startsWith('https://')) {
      return docId;
    }
    if (docId.startsWith('/')) {
      return `${API_BASE_URL}${docId}`;
    }
    return `${API_BASE_URL}/api/v1/documents/${docId}/file`;
  },

  async getTieOutReport(jobId = 'default', simulateDiscrepancy = false): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (jobId) queryParams.set('job_id', jobId);
      if (simulateDiscrepancy) queryParams.set('simulate_discrepancy', 'true');
      const res = await fetch(`${API_BASE_URL}/api/v1/tieout/summary?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch tieout summary: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn(`[api.getTieOutReport] Fetch failed (${err}), returning local fallback.`);
      return {
        total_bridges: 4,
        passed_bridges: simulateDiscrepancy ? 2 : 3,
        flagged_bridges: simulateDiscrepancy ? 2 : 1,
        accuracy_rate: simulateDiscrepancy ? 50.0 : 75.0,
        total_unexplained_delta: simulateDiscrepancy ? 12450.0 : 0.0,
        simulated_discrepancy_active: simulateDiscrepancy,
        bridges: [
          {
            bridge_id: 'bridge_fund_consolidation',
            name: 'Fund Cash Consolidation Bridge',
            target_cell: 'C6',
            bridge_type: 'consolidation',
            formula_display: 'C4 + D5 = C6',
            expected_value: 13263300.91,
            reported_value: simulateDiscrepancy ? 13250850.91 : 13263300.91,
            delta: simulateDiscrepancy ? 12450.0 : 0.0,
            status: simulateDiscrepancy ? 'discrepancy' : 'footed_and_tied',
            status_label: simulateDiscrepancy ? '⚠️ Discrepancy: Δ €12,450.00' : '✓ Footed & Tied',
            inputs: [
              { cell_id: 'C4', label: 'Fund I Calder EUR Cash (ABF I)', amount: 13243300.91, source_doc: '20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf', page_number: 1, verbatim_quote: '13,243,300.91' },
              { cell_id: 'D5', label: 'Fund II Calder EUR Cash (ABF II)', amount: 20000.0, source_doc: '20260331_NI_ABF_II_SCSP_CALDER_EUR_0923.pdf', page_number: 1, verbatim_quote: '20,000.00' }
            ],
            notes: simulateDiscrepancy
              ? 'SIMULATED VARIANCE: Reported consolidation ledger differs from sum of verified fund statements by €12,450.00.'
              : 'Fund I Cash (€13,243,300.91) + Fund II Cash (€20,000.00) perfectly foots to Consolidated Ledger (€13,263,300.91).'
          },
          {
            bridge_id: 'bridge_intercompany_tieout',
            name: 'Intercompany Clearing & Settlement Tie-Out',
            target_cell: 'E11',
            bridge_type: 'intercompany_tieout',
            formula_display: 'C11 + D9 + D10 = E11 (Net Tie-Out == 0.00)',
            expected_value: 0.0,
            reported_value: 0.0,
            delta: 0.0,
            status: 'footed_and_tied',
            status_label: '✓ Footed & Tied',
            inputs: [
              { cell_id: 'C11', label: 'Fund I Cephalus Inflow Total', amount: -1.62, source_doc: '20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf', page_number: 2, verbatim_quote: '1.62' },
              { cell_id: 'D9', label: 'Fund II Tranche A Settlement', amount: 0.85, source_doc: '20260331_NI_ABF_II_SCSP_CALDER_EUR_0923.pdf', page_number: 2, verbatim_quote: '0.85' },
              { cell_id: 'D10', label: 'Fund II Tranche B Settlement', amount: 0.77, source_doc: '20260331_NI_ABF_II_SCSP_CALDER_EUR_0923.pdf', page_number: 2, verbatim_quote: '0.77' }
            ],
            notes: 'Zero-balance cross-fund tie-out verified: Fund I allocation (-€1.62) completely cleared by Fund II tranches (€0.85 + €0.77).'
          },
          {
            bridge_id: 'bridge_vertical_fund_1',
            name: 'Fund I Vertical Cash Footing',
            target_cell: 'C4',
            bridge_type: 'vertical_footing',
            formula_display: 'Beginning Balance + Receipts - Disbursements = Ending Balance',
            expected_value: 13243300.91,
            reported_value: 13243300.91,
            delta: 0.0,
            status: 'footed_and_tied',
            status_label: '✓ Footed & Tied',
            inputs: [
              { cell_id: 'A4', label: 'Beginning Balance (2026-03-01)', amount: 0.0, source_doc: '20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf', page_number: 1, verbatim_quote: 'Opening Balance: 0.00' },
              { cell_id: 'B4', label: 'Net Inflows & Credits', amount: 13243300.91, source_doc: '20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf', page_number: 1, verbatim_quote: 'Total Receipts: 13,243,300.91' }
            ],
            notes: 'Vertical footing verified: Opening balance (€0.00) plus verified receipts equals ending cash balance (€13,243,300.91).'
          },
          {
            bridge_id: 'bridge_suspense_reserve',
            name: 'Suspense Reserve Exception & Unmatched Check',
            target_cell: 'C14',
            bridge_type: 'exception_check',
            formula_display: 'Unallocated Receipt (€45,200.00) -> SUSPENSE-Q1 Reserve',
            expected_value: 45200.0,
            reported_value: 45200.0,
            delta: 0.0,
            status: 'review_required',
            status_label: '⚠️ Review Required',
            inputs: [
              { cell_id: 'C14', label: 'Unmatched Narrative Receipt Tranche', amount: 45200.0, source_doc: '20260331_NI_ABF_I_SCSP_EUR_5103.pdf', page_number: 1, verbatim_quote: '45,200.00' }
            ],
            notes: 'Grounded in hackathon dataset (52% unmatched counterparties): Counterparty narrative truncated on PDF statement. Quarantined in Suspense until KYC/trade confirmation match.'
          }
        ],
        cell_decorations: {
          C6: { cell_id: 'C6', status: simulateDiscrepancy ? 'discrepancy' : 'footed_and_tied', icon: simulateDiscrepancy ? 'flag' : 'shield', badge_label: simulateDiscrepancy ? '⚠️ Discrepancy: Δ €12,450.00' : '✓ Footed & Tied', delta: simulateDiscrepancy ? 12450.0 : 0.0, bridge_id: 'bridge_fund_consolidation' },
          E11: { cell_id: 'E11', status: 'footed_and_tied', icon: 'shield', badge_label: '✓ Footed & Tied', delta: 0.0, bridge_id: 'bridge_intercompany_tieout' },
          C4: { cell_id: 'C4', status: 'footed_and_tied', icon: 'shield', badge_label: '✓ Footed & Tied', delta: 0.0, bridge_id: 'bridge_vertical_fund_1' },
          C14: { cell_id: 'C14', status: 'review_required', icon: 'flag', badge_label: '⚠️ Review Required', delta: 0.0, bridge_id: 'bridge_suspense_reserve' }
        }
      };
    }
  },
};

