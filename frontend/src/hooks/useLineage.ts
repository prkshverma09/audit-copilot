'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  SheetLineageResponse,
  CellLineage,
  LineageInput,
  DocumentMeta,
} from '@/types/lineage';
import { getMockLineageResponse } from '@/services/mockData';
import { api } from '@/services/api';

const EMPTY_LINEAGE_RESPONSE: SheetLineageResponse = {
  sheet_id: '',
  sheet_name: '',
  documents: [],
  cells: {},
};

export function useLineage(initialLineage?: SheetLineageResponse) {
  const [lineageResponse, setLineageResponse] = useState<SheetLineageResponse>(
    initialLineage || EMPTY_LINEAGE_RESPONSE
  );

  const [selectedCellId, setSelectedCellId] = useState<string>('');
  const [activeInputIndex, setActiveInputIndex] = useState<number>(0);
  const [activeDocumentId, setActiveDocumentId] = useState<string>('');
  const [dynamicCellLineage, setDynamicCellLineage] = useState<CellLineage | null>(null);

  const activeCellLineage: CellLineage | undefined = useMemo(() => {
    if (dynamicCellLineage && dynamicCellLineage.cell_id === selectedCellId) {
      return dynamicCellLineage;
    }
    return lineageResponse.cells[selectedCellId];
  }, [dynamicCellLineage, lineageResponse, selectedCellId]);

  const activeInput: LineageInput | undefined = useMemo(() => {
    if (!activeCellLineage || activeCellLineage.inputs.length === 0) return undefined;
    return activeCellLineage.inputs[activeInputIndex] || activeCellLineage.inputs[0];
  }, [activeCellLineage, activeInputIndex]);

  // Find document corresponding to the activeDocumentId
  const activeDocument: DocumentMeta | undefined = useMemo(() => {
    if (!activeDocumentId && lineageResponse.documents.length > 0) {
      return lineageResponse.documents[0];
    }
    const cleanActive = activeDocumentId ? activeDocumentId.toLowerCase().replace('doc_', '').split('.')[0] : '';
    return (
      lineageResponse.documents.find(
        (d) =>
          d.doc_id === activeDocumentId ||
          d.filename === activeDocumentId ||
          (cleanActive && d.filename.toLowerCase().includes(cleanActive)) ||
          (cleanActive && d.doc_id.toLowerCase().includes(cleanActive))
      ) || lineageResponse.documents[0]
    );
  }, [lineageResponse, activeDocumentId]);

  // When auditor clicks a cell in FortuneSheet
  const selectCell = useCallback(
    (cellId: string, customLineageOrAudit?: SheetLineageResponse | any) => {
      console.log('>>> [selectCell]', cellId, customLineageOrAudit ? 'hasCustomOrAudit' : 'none');
      setSelectedCellId(cellId);
      setActiveInputIndex(0);

      // Check if customLineageOrAudit is an audit metadata object from Staging Sheet or DIU
      if (
        customLineageOrAudit &&
        typeof customLineageOrAudit === 'object' &&
        'verbatim_quote' in customLineageOrAudit
      ) {
        const audit = customLineageOrAudit;
        const syntheticLineage: CellLineage = {
          cell_id: cellId,
          metric_name: audit.metric_name || `${audit.account_name || 'Transaction'}: ${audit.bank_reference || ''}`,
          calculated_value: audit.extracted_value !== undefined ? audit.extracted_value : (audit.amount || 0),
          formula_display: audit.formula_display || `${audit.filename} (p. ${audit.page_number})`,
          status: audit.status || 'verified',
          inputs: [
            {
              input_cell: cellId,
              source_document: audit.filename,
              doc_id: audit.doc_id,
              page_number: audit.page_number || 1,
              extracted_value: audit.extracted_value !== undefined ? audit.extracted_value : (audit.amount || 0),
              verbatim_quote: audit.verbatim_quote,
            },
          ],
        };
        setDynamicCellLineage(syntheticLineage);
        if (audit.doc_id || audit.filename) {
          setActiveDocumentId(audit.doc_id || audit.filename);
        }
        return;
      }

      // Standard primary reconciliation workpaper cell selection
      setDynamicCellLineage(null);
      const activeCells = (customLineageOrAudit as SheetLineageResponse)?.cells || lineageResponse.cells;
      const cell = activeCells[cellId];
      if (cell && cell.inputs.length > 0) {
        const firstInput = cell.inputs[0];
        if (firstInput.doc_id) {
          setActiveDocumentId(firstInput.doc_id);
        }
      }
    },
    [lineageResponse]
  );

  // When auditor clicks a citation pill in the FormulaBanner
  const selectInput = useCallback((input: LineageInput, index: number) => {
    setActiveInputIndex(index);
    if (input.doc_id) {
      setActiveDocumentId(input.doc_id);
    }
  }, []);

  const selectDocument = useCallback((docId: string) => {
    setActiveDocumentId(docId);
  }, []);

  const addUploadedDocument = useCallback((doc: DocumentMeta) => {
    setLineageResponse((prev) => {
      const exists = prev.documents.some(
        (d) => d.doc_id === doc.doc_id || d.filename === doc.filename
      );
      if (exists) return prev;
      return {
        ...prev,
        documents: [...prev.documents, doc],
      };
    });
    setActiveDocumentId(doc.doc_id);
  }, []);

  return {
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
  };
}
