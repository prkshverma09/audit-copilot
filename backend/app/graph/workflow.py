import logging
import uuid
from langgraph.graph import END, START, StateGraph

from app.graph.nodes.classify_node import classify_node
from app.graph.nodes.ingest_node import ingest_node
from app.graph.nodes.lineage_node import lineage_node
from app.graph.nodes.sheet_map_node import sheet_map_node
from app.graph.state import GraphState
from app.models.lineage import SheetLineageResponse

logger = logging.getLogger("audit-copilot.graph.workflow")


def build_audit_workflow() -> StateGraph:
    """Builds and wires the LangGraph State Machine."""
    workflow = StateGraph(GraphState)

    workflow.add_node("ingest", ingest_node)
    workflow.add_node("classify", classify_node)
    workflow.add_node("lineage", lineage_node)
    workflow.add_node("sheet_map", sheet_map_node)

    workflow.add_edge(START, "ingest")
    workflow.add_edge("ingest", "classify")
    workflow.add_edge("classify", "lineage")
    workflow.add_edge("lineage", "sheet_map")
    workflow.add_edge("sheet_map", END)

    return workflow


# Compile state graph
audit_app = build_audit_workflow().compile()


async def run_audit_pipeline(document_ids: list[str], sheet_id: str = None) -> SheetLineageResponse:
    """
    Executes the compiled LangGraph workflow over the given document IDs
    and returns a fully structured SheetLineageResponse.
    """
    initial_state: GraphState = {
        "document_ids": document_ids,
        "raw_documents": [],
        "classified_docs": [],
        "sheet_title": "Consolidated Financial Reconciliation",
        "lineage_cells": {},
        "fortune_sheet_data": [],
        "error": None
    }

    logger.info(f"Triggering LangGraph audit pipeline for {len(document_ids)} documents.")
    final_state = await audit_app.ainvoke(initial_state)

    assigned_sheet_id = sheet_id or f"sheet_{uuid.uuid4().hex[:8]}"

    return SheetLineageResponse(
        sheet_id=assigned_sheet_id,
        sheet_name=final_state.get("sheet_title", "Financial Statement Reconciliation"),
        documents=final_state.get("classified_docs", []),
        cells=final_state.get("lineage_cells", {}),
        fortune_sheet_data=final_state.get("fortune_sheet_data", [])
    )
