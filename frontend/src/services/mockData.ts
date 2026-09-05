import mockLineageData from '@/fixtures/mock_lineage.json';
import mockFortuneData from '@/fixtures/mock_fortune_data.json';
import { SheetLineageResponse, CellLineage, DocumentMeta, FortuneSheetData } from '@/types/lineage';

const lineageResponse = mockLineageData as unknown as SheetLineageResponse;
const fortuneSheets = mockFortuneData as unknown as FortuneSheetData[];

export function getMockLineageResponse(): SheetLineageResponse {
  return lineageResponse;
}

export function getMockFortuneData(): FortuneSheetData[] {
  return fortuneSheets;
}

export function getCellLineage(cellId: string): CellLineage | undefined {
  return lineageResponse.cells[cellId];
}

export function getDocumentMeta(docId: string): DocumentMeta | undefined {
  return lineageResponse.documents.find((d) => d.doc_id === docId);
}

export function getAllDocuments(): DocumentMeta[] {
  return lineageResponse.documents;
}

export function getLineageSummary() {
  const totalCells = Object.keys(lineageResponse.cells).length;
  const verifiedCells = Object.values(lineageResponse.cells).filter(
    (c) => c.status === 'verified'
  ).length;
  const reviewRequired = Object.values(lineageResponse.cells).filter(
    (c) => c.status === 'review_required'
  ).length;

  return {
    totalCells,
    verifiedCells,
    reviewRequired,
    coveragePercent: totalCells > 0 ? Math.round((verifiedCells / totalCells) * 100) : 0,
    hallucinations: 0,
  };
}
