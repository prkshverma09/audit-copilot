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
      return await res.json();
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
};
