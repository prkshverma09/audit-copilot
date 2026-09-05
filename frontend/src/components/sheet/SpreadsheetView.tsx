'use client';

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SheetLineageResponse } from '@/types/lineage';
import { Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled to prevent window is not defined errors
const Workbook = dynamic(
  () => import('@fortune-sheet/react').then((mod) => mod.Workbook),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-audit-panel text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-sm font-medium">Initializing FortuneSheet Grid Engine...</span>
      </div>
    ),
  }
);

interface SpreadsheetViewProps {
  sheetData: any[];
  lineageData?: SheetLineageResponse;
  selectedCellId: string;
  onSelectAuditCell: (cellId: string) => void;
  onChange?: (data: any[]) => void;
}

export function coordsToCellId(r: number, c: number): string {
  let colStr = '';
  let tempCol = c;
  while (tempCol >= 0) {
    colStr = String.fromCharCode((tempCol % 26) + 65) + colStr;
    tempCol = Math.floor(tempCol / 26) - 1;
  }
  return `${colStr}${r + 1}`;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  sheetData,
  lineageData,
  selectedCellId,
  onSelectAuditCell,
  onChange,
}) => {
  const selectedCellIdRef = useRef(selectedCellId);
  selectedCellIdRef.current = selectedCellId;

  const onSelectAuditCellRef = useRef(onSelectAuditCell);
  onSelectAuditCellRef.current = onSelectAuditCell;

  const lineageCellMap = useMemo(() => {
    return lineageData?.cells || {};
  }, [lineageData]);

  const lineageCellMapRef = useRef(lineageCellMap);
  lineageCellMapRef.current = lineageCellMap;

  // Stable hooks object to avoid re-mounting Workbook during Immer context updates
  const hooks = useMemo(() => {
    return {
      afterSelectionChange: (
        _sheetId: string,
        selection: any
      ) => {
        if (!selection) return;
        const r = typeof selection.row_focus === 'number' ? selection.row_focus : selection.row?.[0];
        const c = typeof selection.column_focus === 'number' ? selection.column_focus : selection.column?.[0];
        if (typeof r === 'number' && typeof c === 'number') {
          const cellId = coordsToCellId(r, c);
          onSelectAuditCellRef.current?.(cellId);
        }
      },
      afterRenderCell: (
        _cell: any,
        cellInfo: {
          row: number;
          column: number;
          startX: number;
          startY: number;
          endX: number;
          endY: number;
        },
        ctx: CanvasRenderingContext2D
      ) => {
        const cellId = coordsToCellId(cellInfo.row, cellInfo.column);
        const cellLineage = lineageCellMapRef.current[cellId];
        if (cellLineage) {
          ctx.save();
          // Draw audit indicator dot on top-right of cell
          const isVerified = cellLineage.status === 'verified';
          ctx.fillStyle = isVerified ? '#10B981' : '#F59E0B';
          ctx.beginPath();
          ctx.arc(cellInfo.endX - 7, cellInfo.startY + 7, 3.5, 0, 2 * Math.PI);
          ctx.fill();

          // Subtle highlight border if this is the currently active cell
          if (cellId === selectedCellIdRef.current) {
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              cellInfo.startX + 1,
              cellInfo.startY + 1,
              cellInfo.endX - cellInfo.startX - 2,
              cellInfo.endY - cellInfo.startY - 2
            );
          }
          ctx.restore();
        }
      },
    };
  }, []);

  const clonedData = useMemo(() => {
    try {
      return JSON.parse(JSON.stringify(sheetData));
    } catch {
      return sheetData;
    }
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-audit-panel">
      <Workbook
        data={clonedData as any}
        onChange={onChange}
        hooks={hooks as any}
        showToolbar={true}
        showSheetTabs={true}
        showFormulaBar={false}
      />
    </div>
  );
};
