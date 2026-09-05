import logging
from typing import Any, Dict
from app.core.gemini_client import gemini_service
from app.graph.state import GraphState
from app.models.lineage import CellLineage, LineageInput

logger = logging.getLogger("audit-copilot.graph.lineage")


async def lineage_node(state: GraphState) -> Dict[str, Any]:
    """
    Lineage Extraction Node: Calls Gemini Pro reasoning model to extract
    KPI metrics, formula inputs, and verbatim quotes from the PDF documents.
    """
    raw_docs = state.get("raw_documents", [])
    
    extracted_data = await gemini_service.extract_lineage(raw_docs)
    sheet_title = extracted_data.get("sheet_title", "Financial Statement Reconciliation")
    raw_cells = extracted_data.get("cells", {})

    lineage_cells: Dict[str, CellLineage] = {}

    for cell_id, c_data in raw_cells.items():
        try:
            inputs = []
            for inp in c_data.get("inputs", []):
                raw_page = inp.get("page_number")
                try:
                    page_num = max(1, int(raw_page)) if raw_page is not None else 1
                except (ValueError, TypeError):
                    page_num = 1

                try:
                    ext_val = float(inp.get("extracted_value", 0.0))
                except (ValueError, TypeError):
                    ext_val = 0.0

                inputs.append(LineageInput(
                    input_cell=inp.get("input_cell", "A1"),
                    source_document=inp.get("source_document", "document.pdf"),
                    doc_id=inp.get("doc_id", "doc_default"),
                    page_number=page_num,
                    extracted_value=ext_val,
                    verbatim_quote=inp.get("verbatim_quote", "")
                ))

            cell_lineage = CellLineage(
                cell_id=cell_id,
                metric_name=c_data.get("metric_name", "Financial Metric"),
                calculated_value=c_data.get("calculated_value", 0.0),
                formula_display=c_data.get("formula_display", ""),
                status=c_data.get("status", "verified"),
                notes=c_data.get("notes"),
                inputs=inputs
            )
            lineage_cells[cell_id] = cell_lineage
        except Exception as e:
            logger.warning(f"Failed to parse cell lineage for {cell_id}: {e}")

    return {
        "sheet_title": sheet_title,
        "lineage_cells": lineage_cells
    }
