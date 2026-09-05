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

  const activeCellLineage: CellLineage | undefined = useMemo(() => {
    return lineageResponse.cells[selectedCellId];
  }, [lineageResponse, selectedCellId]);

  const activeInput: LineageInput | undefined = useMemo(() => {
    if (!activeCellLineage || activeCellLineage.inputs.length === 0) return undefined;
    return activeCellLineage.inputs[activeInputIndex] || activeCellLineage.inputs[0];
  }, [activeCellLineage, activeInputIndex]);

  // Find document corresponding to the activeDocumentId
  const activeDocument: DocumentMeta | undefined = useMemo(() => {
    if (!activeDocumentId && lineageResponse.documents.length > 0) {
      return lineageResponse.documents[0];
    }
    return (
      lineageResponse.documents.find(
        (d) => d.doc_id === activeDocumentId || d.filename === activeDocumentId
      ) || lineageResponse.documents[0]
    );
  }, [lineageResponse, activeDocumentId]);

  // When auditor clicks a cell in FortuneSheet
  const selectCell = useCallback(
    (cellId: string, customLineage?: SheetLineageResponse) => {
      setSelectedCellId(cellId);
      setActiveInputIndex(0);

      const activeCells = customLineage?.cells || lineageResponse.cells;
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
