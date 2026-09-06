'use client';

import React, { useMemo, useRef, useCallback } from 'react';
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
        <span className="text-sm font-medium">Initializing Audit Grid...</span>
      </div>
    ),
  }
);

interface SpreadsheetViewProps {
  sheetData: any[];
  lineageData?: SheetLineageResponse;
  selectedCellId: string;
  onSelectAuditCell: (cellId: string, auditMeta?: any) => void;
  onChange?: (data: any[]) => void;
  tieOutReport?: any;
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
  tieOutReport,
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

  const tieOutDecorations = useMemo(() => {
    return tieOutReport?.cell_decorations || {};
  }, [tieOutReport]);

  const tieOutDecorationsRef = useRef(tieOutDecorations);
  tieOutDecorationsRef.current = tieOutDecorations;

  const primarySheetId = sheetData?.[0]?.id || '';
  const primarySheetIdRef = useRef(primarySheetId);
  primarySheetIdRef.current = primarySheetId;

  const activeSheetIdRef = useRef(primarySheetId);
  const sheetDataRef = useRef(sheetData);
  sheetDataRef.current = sheetData;

  const getCurrentActiveSheetId = useCallback(() => {
    if (typeof document !== 'undefined') {
      const activeTabEl = document.querySelector('.luckysheet-sheets-item-active');
      if (activeTabEl) {
        const text = activeTabEl.textContent?.trim() || '';
        const found = sheetDataRef.current?.find(
          s => text.includes(s.name) || s.name.includes(text)
        );
        if (found) {
          activeSheetIdRef.current = found.id;
          return found.id;
        }
      }
    }
    return activeSheetIdRef.current || primarySheetIdRef.current;
  }, []);

  // Seamlessly synchronize activeSheetId whenever user clicks any bottom sheet tab
  React.useEffect(() => {
    const handleSheetTabClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('.luckysheet-sheets-item');
      if (target) {
        const tabText = target.textContent?.trim() || '';
        const matchingSheet = sheetDataRef.current?.find(
          s => tabText.includes(s.name) || s.name.includes(tabText)
        );
        if (matchingSheet) {
          activeSheetIdRef.current = matchingSheet.id;
        }
      }
    };
    document.addEventListener('click', handleSheetTabClick, true);
    return () => document.removeEventListener('click', handleSheetTabClick, true);
  }, []);

  // Stable hooks object to avoid re-mounting Workbook during Immer context updates
  const hooks = useMemo(() => {
    const processSelection = (r: number, c: number, cellDirect?: any) => {
      const cellId = coordsToCellId(r, c);
      const currentActiveId = getCurrentActiveSheetId();
      if (!currentActiveId || currentActiveId === primarySheetIdRef.current) {
        onSelectAuditCellRef.current?.(cellId);
      } else {
        // Non-primary sheet (Staging Sheet or DIU): extract transaction audit metadata
        const curSheet = sheetDataRef.current?.find(s => s.id === currentActiveId);
        let audit = cellDirect?.audit || cellDirect?.v?.audit;
        
        // 1. Check in 2D array data[r][c] (standard FortuneSheet runtime format)
        if (!audit && curSheet?.data?.[r]?.[c]) {
          const cellObj = curSheet.data[r][c];
          audit = cellObj?.audit || cellObj?.v?.audit;
        }
        // 2. Check in celldata format (initial format before Workbook mounts)
        if (!audit && curSheet?.celldata) {
          const cellInSheet = curSheet.celldata.find((cd: any) => cd.r === r && cd.c === c);
          audit = cellInSheet?.v?.audit || cellInSheet?.audit;
        }
        // 3. If clicking any column in row r, resolve the audit from anywhere in that row
        if (!audit && r > 0) {
          if (curSheet?.data?.[r]) {
            const rowCell = curSheet.data[r].find((cell: any) => cell?.audit || cell?.v?.audit);
            audit = rowCell?.audit || rowCell?.v?.audit;
          }
          if (!audit && curSheet?.celldata) {
            const rowCell = curSheet.celldata.find((cd: any) => cd.r === r && (cd?.v?.audit || cd?.audit));
            audit = rowCell?.v?.audit || rowCell?.audit;
          }
        }
        console.log('>>> [processSelection]', { r, c, cellId, activeSheet: currentActiveId, hasAudit: !!audit, curSheet: curSheet?.name });
        // Deep clone audit metadata to ensure no Immer proxy references leak into React state
        const safeAudit = audit ? JSON.parse(JSON.stringify(audit)) : undefined;
        onSelectAuditCellRef.current?.(cellId, safeAudit);
      }
    };

    return {
      afterActivateSheet: (id: string) => {
        if (id) {
          activeSheetIdRef.current = id;
        }
      },
      // Note: Do NOT define afterCellMouseDown!
      // @fortune-sheet/core has an internal bug where if afterCellMouseDown is defined,
      // it calls setTimeout accessing draft flowdata after Immer recipe finishes,
      // throwing "TypeError: Cannot perform 'get' on a proxy that has been revoked".
      // afterSelectionChange handles all cell selections cleanly and safely.
      afterSelectionChange: (
        sheetId: string,
        selection: any
      ) => {
        if (sheetId && typeof sheetId === 'string') {
          activeSheetIdRef.current = sheetId;
        }
        if (!selection) return;
        const r = typeof selection.row_focus === 'number' ? selection.row_focus : selection.row?.[0];
        const c = typeof selection.column_focus === 'number' ? selection.column_focus : selection.column?.[0];
        if (typeof r === 'number' && typeof c === 'number') {
          processSelection(r, c);
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
        // Only draw audit badges and tie-out decorations on the primary reconciliation workpaper sheet
        const currentActiveId = getCurrentActiveSheetId();
        if (currentActiveId && currentActiveId !== primarySheetIdRef.current) {
          return;
        }

        const cellId = coordsToCellId(cellInfo.row, cellInfo.column);
        const cellLineage = lineageCellMapRef.current[cellId];
        const cellTieOut = tieOutDecorationsRef.current[cellId];

        if (cellTieOut) {
          ctx.save();
          if (cellTieOut.status === 'footed_and_tied') {
            // Draw Green Shield Icon for Fully Reconciled Cell
            const x = cellInfo.endX - 12;
            const y = cellInfo.startY + 3;
            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 9, y);
            ctx.lineTo(x + 9, y + 6);
            ctx.quadraticCurveTo(x + 9, y + 11, x + 4.5, y + 13);
            ctx.quadraticCurveTo(x, y + 11, x, y + 6);
            ctx.closePath();
            ctx.fill();

            // White checkmark inside shield
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(x + 2.5, y + 6);
            ctx.lineTo(x + 4.5, y + 9);
            ctx.lineTo(x + 7.5, y + 3.5);
            ctx.stroke();
          } else {
            // Draw Amber Warning Flag / Triangle for Discrepancy or Review
            const x = cellInfo.endX - 13;
            const y = cellInfo.startY + 3;
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.moveTo(x + 5.5, y);
            ctx.lineTo(x + 11, y + 11);
            ctx.lineTo(x, y + 11);
            ctx.closePath();
            ctx.fill();

            // Exclamation symbol inside warning triangle
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 5, y + 4, 1.2, 3.5);
            ctx.fillRect(x + 5, y + 8.5, 1.2, 1.2);
          }

          // Highlight border if selected
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
        } else if (cellLineage) {
          ctx.save();
          // Draw standard audit indicator dot on top-right of cell
          const isVerified = cellLineage.status === 'verified';
          ctx.fillStyle = isVerified ? '#10B981' : '#F59E0B';
          ctx.beginPath();
          ctx.arc(cellInfo.endX - 7, cellInfo.startY + 7, 3.5, 0, 2 * Math.PI);
          ctx.fill();

          // Highlight border if selected
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

  const sheetKey = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return 'empty_sheet';
    const first = sheetData[0];
    return `${first?.id || 'sheet'}_${first?.name || 'name'}`;
  }, [sheetData?.[0]?.id, sheetData?.[0]?.name]);

  const clonedData = useMemo(() => {
    try {
      return JSON.parse(JSON.stringify(sheetData));
    } catch {
      return sheetData;
    }
  }, [sheetData?.[0]?.id, sheetData?.[0]?.name]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-audit-panel">
      <Workbook
        key={sheetKey}
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
