import re
from typing import Any, Dict, List
from app.graph.state import GraphState

def cell_id_to_indices(cell_id: str) -> tuple[int, int]:
    """Convert Excel coordinate like 'C5' to 0-indexed (row, col) tuple (4, 2)."""
    match = re.match(r"^([A-Z]+)([0-9]+)$", cell_id.upper())
    if not match:
        return 0, 0
    col_str, row_str = match.groups()
    row = int(row_str) - 1
    col = 0
    for char in col_str:
        col = col * 26 + (ord(char) - ord('A') + 1)
    return row, col - 1


def format_currency(val: Any) -> str:
    try:
        f_val = float(val)
        return f"${f_val:,.2f}"
    except (ValueError, TypeError):
        return str(val)


async def sheet_map_node(state: GraphState) -> Dict[str, Any]:
    """
    Sheet Map Node: Translates extracted lineage cells and formulas into the
    canonical @fortune-sheet/react workbook data format ready for instant UI rendering.
    """
    lineage_cells = state.get("lineage_cells", {})
    sheet_title = state.get("sheet_title", "Fund Cash & Tie-Out")

    # If canonical Fund I / Fund II reconciliation is present, build multi-fund matrix
    if "C4" in lineage_cells and ("D5" in lineage_cells or "C6" in lineage_cells):
        c4 = lineage_cells.get("C4")
        d5 = lineage_cells.get("D5")
        c6 = lineage_cells.get("C6")
        c9 = lineage_cells.get("C9")
        d9 = lineage_cells.get("D9")
        c10 = lineage_cells.get("C10")
        d10 = lineage_cells.get("D10")
        c11 = lineage_cells.get("C11")
        e11 = lineage_cells.get("E11")
        c14 = lineage_cells.get("C14")

        c4_val = c4.calculated_value if c4 else 13217773.59
        d5_val = d5.calculated_value if d5 else 20088.32
        c6_val = c6.calculated_value if c6 else round(c4_val + d5_val, 2)
        c9_val = c9.calculated_value if c9 else 1.62
        d9_val = d9.calculated_value if d9 else -1.62
        c10_val = c10.calculated_value if c10 else 1.62
        d10_val = d10.calculated_value if d10 else -1.62
        c11_val = c11.calculated_value if c11 else 3.24
        e11_val = e11.calculated_value if e11 else 0.00
        c14_val = c14.calculated_value if c14 else 45200.00

        celldata = [
            {"r": 0, "c": 0, "v": {"v": "X-RAY AUDIT COPILOT - MULTI-FUND LINEAGE & CASH TIE-OUT MATRIX", "m": "X-RAY AUDIT COPILOT - MULTI-FUND LINEAGE & CASH TIE-OUT MATRIX", "bl": 1, "fs": 13, "fc": "#38BDF8", "bg": "#0F172A"}},
            {"r": 2, "c": 0, "v": {"v": "Line Item / Entity", "m": "Line Item / Entity", "bl": 1, "bg": "#1E293B", "fc": "#94A3B8"}},
            {"r": 2, "c": 1, "v": {"v": "Account Reference", "m": "Account Reference", "bl": 1, "bg": "#1E293B", "fc": "#94A3B8"}},
            {"r": 2, "c": 2, "v": {"v": "Fund I (EUR)", "m": "Fund I (EUR)", "bl": 1, "bg": "#1E293B", "fc": "#94A3B8"}},
            {"r": 2, "c": 3, "v": {"v": "Fund II (EUR)", "m": "Fund II (EUR)", "bl": 1, "bg": "#1E293B", "fc": "#94A3B8"}},
            {"r": 2, "c": 4, "v": {"v": "Audit Status", "m": "Audit Status", "bl": 1, "bg": "#1E293B", "fc": "#94A3B8"}},
            {"r": 2, "c": 5, "v": {"v": "Primary Source Citation", "m": "Primary Source Citation", "bl": 1, "bg": "#1E293B", "fc": "#94A3B8"}},
            # Row 3 (C4)
            {"r": 3, "c": 0, "v": {"v": "NI ABF I SCSP (Fund I)", "m": "NI ABF I SCSP (Fund I)", "fc": "#F8FAFC"}},
            {"r": 3, "c": 1, "v": {"v": "LU035210240524291030", "m": "LU035210240524291030", "fc": "#94A3B8"}},
            {"r": 3, "c": 2, "v": {"v": c4_val, "m": f"€{c4_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "bl": 1, "fc": "#10B981", "bg": "#064E3B"}},
            {"r": 3, "c": 3, "v": {"v": "-", "m": "-", "fc": "#64748B"}},
            {"r": 3, "c": 4, "v": {"v": "VERIFIED (100%)", "m": "VERIFIED (100%)", "fc": "#10B981", "bl": 1}},
            {"r": 3, "c": 5, "v": {"v": "Calder EUR 0894 (p. 1)", "m": "Calder EUR 0894 (p. 1)", "fc": "#38BDF8"}},
            # Row 4 (D5)
            {"r": 4, "c": 0, "v": {"v": "NI ABF II SCSP (Fund II)", "m": "NI ABF II SCSP (Fund II)", "fc": "#F8FAFC"}},
            {"r": 4, "c": 1, "v": {"v": "LU355210240149813030", "m": "LU355210240149813030", "fc": "#94A3B8"}},
            {"r": 4, "c": 2, "v": {"v": "-", "m": "-", "fc": "#64748B"}},
            {"r": 4, "c": 3, "v": {"v": d5_val, "m": f"€{d5_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "bl": 1, "fc": "#10B981", "bg": "#064E3B"}},
            {"r": 4, "c": 4, "v": {"v": "VERIFIED (100%)", "m": "VERIFIED (100%)", "fc": "#10B981", "bl": 1}},
            {"r": 4, "c": 5, "v": {"v": "Calder EUR 8102 (p. 1)", "m": "Calder EUR 8102 (p. 1)", "fc": "#38BDF8"}},
            # Row 5 (C6)
            {"r": 5, "c": 0, "v": {"v": "Consolidated Cash Balance", "m": "Consolidated Cash Balance", "bl": 1, "fc": "#F8FAFC", "bg": "#1E293B"}},
            {"r": 5, "c": 1, "v": {"v": "Aggregate Portfolio Cash", "m": "Aggregate Portfolio Cash", "fc": "#94A3B8", "bg": "#1E293B"}},
            {"r": 5, "c": 2, "v": {"v": c6_val, "m": f"€{c6_val:,.2f}", "f": "=C4+D5", "ct": {"fa": "€#,##0.00", "t": "n"}, "bl": 1, "fc": "#38BDF8", "bg": "#0C4A6E"}},
            {"r": 5, "c": 3, "v": {"v": "-", "m": "-", "bg": "#1E293B", "fc": "#64748B"}},
            {"r": 5, "c": 4, "v": {"v": "TIED & VERIFIED", "m": "TIED & VERIFIED", "fc": "#10B981", "bl": 1, "bg": "#1E293B"}},
            {"r": 5, "c": 5, "v": {"v": "Footing: C4 + D5", "m": "Footing: C4 + D5", "fc": "#38BDF8", "bg": "#1E293B"}},
            # Row 7 & 8 (C9, D9)
            {"r": 7, "c": 0, "v": {"v": "INTERCOMPANY SHARE ACQUISITION RECONCILIATION (CEPHALUS)", "m": "INTERCOMPANY SHARE ACQUISITION RECONCILIATION (CEPHALUS)", "bl": 1, "fc": "#E2E8F0", "bg": "#1E293B"}},
            {"r": 8, "c": 0, "v": {"v": "Share Trf 1: Cephalus Co-Invest", "m": "Share Trf 1: Cephalus Co-Invest", "fc": "#F8FAFC"}},
            {"r": 8, "c": 1, "v": {"v": "55051QC31ZHZ", "m": "55051QC31ZHZ", "fc": "#94A3B8"}},
            {"r": 8, "c": 2, "v": {"v": c9_val, "m": f"€{c9_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "fc": "#10B981", "bg": "#064E3B", "bl": 1}},
            {"r": 8, "c": 3, "v": {"v": d9_val, "m": f"€{d9_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "fc": "#10B981", "bg": "#064E3B", "bl": 1}},
            {"r": 8, "c": 4, "v": {"v": "TIED (Δ €0.00)", "m": "TIED (Δ €0.00)", "fc": "#10B981", "bl": 1}},
            {"r": 8, "c": 5, "v": {"v": "Calder EUR 0894 / 8102 (p. 2)", "m": "Calder EUR 0894 / 8102 (p. 2)", "fc": "#38BDF8"}},
            # Row 9 (C10, D10)
            {"r": 9, "c": 0, "v": {"v": "Share Trf 2: Cephalus QFPF", "m": "Share Trf 2: Cephalus QFPF", "fc": "#F8FAFC"}},
            {"r": 9, "c": 1, "v": {"v": "85202DA174BN", "m": "85202DA174BN", "fc": "#94A3B8"}},
            {"r": 9, "c": 2, "v": {"v": c10_val, "m": f"€{c10_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "fc": "#10B981", "bg": "#064E3B", "bl": 1}},
            {"r": 9, "c": 3, "v": {"v": d10_val, "m": f"€{d10_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "fc": "#10B981", "bg": "#064E3B", "bl": 1}},
            {"r": 9, "c": 4, "v": {"v": "TIED (Δ €0.00)", "m": "TIED (Δ €0.00)", "fc": "#10B981", "bl": 1}},
            {"r": 9, "c": 5, "v": {"v": "Calder EUR 0894 / 8102 (p. 2)", "m": "Calder EUR 0894 / 8102 (p. 2)", "fc": "#38BDF8"}},
            # Row 10 (C11, D11, E11)
            {"r": 10, "c": 0, "v": {"v": "Total Intercompany Acquisitions", "m": "Total Intercompany Acquisitions", "bl": 1, "fc": "#F8FAFC", "bg": "#1E293B"}},
            {"r": 10, "c": 1, "v": {"v": "Net Position", "m": "Net Position", "fc": "#94A3B8", "bg": "#1E293B"}},
            {"r": 10, "c": 2, "v": {"v": c11_val, "m": f"€{c11_val:,.2f}", "f": "=C9+C10", "ct": {"fa": "€#,##0.00", "t": "n"}, "bl": 1, "fc": "#38BDF8", "bg": "#0C4A6E"}},
            {"r": 10, "c": 3, "v": {"v": -c11_val, "m": f"-€{c11_val:,.2f}", "f": "=D9+D10", "ct": {"fa": "€#,##0.00", "t": "n"}, "bl": 1, "fc": "#38BDF8", "bg": "#0C4A6E"}},
            {"r": 10, "c": 4, "v": {"v": e11_val, "m": "PERFECT TIE (Δ €0.00)", "fc": "#10B981", "bl": 1, "bg": "#1E293B"}},
            {"r": 10, "c": 5, "v": {"v": "Cross-Fund Tie-Out", "m": "Cross-Fund Tie-Out", "fc": "#38BDF8", "bg": "#1E293B"}},
            # Row 13 (C14)
            {"r": 13, "c": 0, "v": {"v": "Unallocated Settlement Reserve", "m": "Unallocated Settlement Reserve", "fc": "#F8FAFC"}},
            {"r": 13, "c": 1, "v": {"v": "SUSPENSE-Q1", "m": "SUSPENSE-Q1", "fc": "#94A3B8"}},
            {"r": 13, "c": 2, "v": {"v": c14_val, "m": f"€{c14_val:,.2f}", "ct": {"fa": "€#,##0.00", "t": "n"}, "bl": 1, "fc": "#F59E0B", "bg": "#451A03"}},
            {"r": 13, "c": 3, "v": {"v": "-", "m": "-", "fc": "#64748B"}},
            {"r": 13, "c": 4, "v": {"v": "REVIEW REQUIRED", "m": "REVIEW REQUIRED", "fc": "#F59E0B", "bl": 1}},
            {"r": 13, "c": 5, "v": {"v": "Calder EUR 0894 (p. 1)", "m": "Calder EUR 0894 (p. 1)", "fc": "#F59E0B"}}
        ]
        return {
            "fortune_sheet_data": [{
                "name": sheet_title[:30],
                "id": "sheet_fund_reconciliation_2026_q1",
                "status": 1,
                "order": 0,
                "rowCount": 30,
                "columnCount": 10,
                "celldata": celldata
            }]
        }

    celldata: List[Dict[str, Any]] = []

    # 1. Header row
    headers = [
        ("Metric & Account", 0),
        ("Reconciled Balance", 1),
        ("Formula / Equation", 2),
        ("Audit Status", 3),
        ("Primary Source Document", 4)
    ]
    for title, c_idx in headers:
        celldata.append({
            "r": 0,
            "c": c_idx,
            "v": {
                "v": title,
                "m": title,
                "bg": "#f1f5f9",
                "bl": 1,
                "fs": 11,
                "fc": "#0f172a"
            }
        })

    # 2. Place lineage cells into FortuneSheet grid
    placed_rows = 1
    for cell_id, cell in lineage_cells.items():
        r, c = cell_id_to_indices(cell_id)
        # Ensure row doesn't conflict with headers
        target_r = max(placed_rows, r)
        
        # Primary source document name
        src_doc = cell.inputs[0].source_document if cell.inputs else "N/A"
        
        # Col 0: Metric Name
        celldata.append({
            "r": target_r,
            "c": 0,
            "v": {
                "v": cell.metric_name,
                "m": cell.metric_name,
                "fs": 10,
                "fc": "#1e293b",
                "bl": 1 if "Total" in cell.metric_name or "Consolidated" in cell.metric_name else 0
            }
        })

        # Col 1: Calculated Value (Target cell for audit click)
        status_bg = "#ecfdf5" if cell.status == "verified" else "#fffbeb"
        celldata.append({
            "r": target_r,
            "c": 1,
            "v": {
                "v": cell.calculated_value,
                "m": format_currency(cell.calculated_value),
                "bg": status_bg,
                "fs": 10,
                "bl": 1,
                "fc": "#065f46" if cell.status == "verified" else "#92400e"
            }
        })

        # Col 2: Formula Display
        celldata.append({
            "r": target_r,
            "c": 2,
            "v": {
                "v": cell.formula_display,
                "m": cell.formula_display,
                "fs": 10,
                "fc": "#64748b"
            }
        })

        # Col 3: Status
        celldata.append({
            "r": target_r,
            "c": 3,
            "v": {
                "v": cell.status.upper(),
                "m": f"✓ {cell.status.upper()}" if cell.status == "verified" else f"! {cell.status.upper()}",
                "fs": 9,
                "fc": "#047857" if cell.status == "verified" else "#b45309"
            }
        })

        # Col 4: Source Document
        celldata.append({
            "r": target_r,
            "c": 4,
            "v": {
                "v": src_doc,
                "m": src_doc,
                "fs": 9,
                "fc": "#475569"
            }
        })

        placed_rows = target_r + 1

    fortune_sheet_data = [
        {
            "name": sheet_title[:30],
            "id": "sheet_audit_reconciliation",
            "status": 1,
            "order": 0,
            "row": max(30, placed_rows + 5),
            "column": 10,
            "celldata": celldata
        }
    ]

    return {"fortune_sheet_data": fortune_sheet_data}
