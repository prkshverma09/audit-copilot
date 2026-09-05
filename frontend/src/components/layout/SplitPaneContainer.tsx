'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitPaneContainerProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplitRatio?: number; // 0 to 100 percentage
}

export const SplitPaneContainer: React.FC<SplitPaneContainerProps> = ({
  left,
  right,
  initialSplitRatio = 52,
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(initialSplitRatio);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp between 25% and 75%
      if (newRatio >= 25 && newRatio <= 75) {
        setSplitRatio(newRatio);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex w-full h-full overflow-hidden select-none relative ${
        isDragging ? 'cursor-col-resize select-none pointer-events-none' : ''
      }`}
    >
      {/* Left Pane: Spreadsheet Workspace */}
      <div
        style={{ width: `${splitRatio}%` }}
        className="h-full flex flex-col overflow-hidden bg-audit-bg border-r border-audit-border transition-[width] duration-75 ease-out relative"
      >
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
          {left}
        </div>
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-2 relative bg-audit-panel hover:bg-sky-500/20 active:bg-sky-500/40 cursor-col-resize group transition-colors duration-150 flex items-center justify-center shrink-0 z-30"
      >
        {/* Visual Line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-audit-border group-hover:bg-sky-400 group-active:bg-sky-300 transition-colors" />

        {/* Center Grip Handle */}
        <div className="w-4 h-8 rounded bg-audit-card border border-audit-border group-hover:border-sky-400 flex items-center justify-center shadow-lg transition-colors z-10">
          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-sky-300" />
        </div>
      </div>

      {/* Right Pane: PDF Audit Evidence Viewer */}
      <div
        style={{ width: `${100 - splitRatio}%` }}
        className="h-full flex flex-col overflow-hidden bg-audit-panel transition-[width] duration-75 ease-out relative"
      >
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
          {right}
        </div>
      </div>
    </div>
  );
};

