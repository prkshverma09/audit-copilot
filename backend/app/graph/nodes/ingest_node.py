import logging
from typing import Any, Dict
from app.graph.state import GraphState
from app.storage.s3_adapter import storage_adapter

logger = logging.getLogger("audit-copilot.graph.ingest")


async def ingest_node(state: GraphState) -> Dict[str, Any]:
    """
    Ingestion Node: Reads uploaded PDF bytes from storage for each document_id
    and prepares raw document payloads for classification and extraction.
    """
    doc_ids = state.get("document_ids", [])
    raw_docs = []

    for doc_id in doc_ids:
        pdf_bytes = storage_adapter.get_file_bytes(doc_id)
        meta = storage_adapter.get_metadata(doc_id)
        if pdf_bytes and meta:
            raw_docs.append({
                "doc_id": doc_id,
                "filename": meta.filename,
                "pdf_bytes": pdf_bytes,
                "page_count": meta.page_count,
                "url": meta.url
            })
        else:
            logger.warning(f"Could not load PDF bytes for doc_id: {doc_id}")

    return {"raw_documents": raw_docs}
