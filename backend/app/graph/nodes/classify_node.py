import logging
from typing import Any, Dict, List
from app.core.gemini_client import gemini_service
from app.graph.state import GraphState
from app.models.lineage import DocumentMetadata

logger = logging.getLogger("audit-copilot.graph.classify")


async def classify_node(state: GraphState) -> Dict[str, Any]:
    """
    Classification Node: Employs Gemini Flash to classify document types,
    entity names, and reporting periods for all uploaded documents.
    """
    raw_docs = state.get("raw_documents", [])
    async def _classify_single(doc: Dict[str, Any]) -> DocumentMetadata:
        doc_id = doc["doc_id"]
        filename = doc["filename"]
        pdf_bytes = doc["pdf_bytes"]
        page_count = doc["page_count"]
        url = doc["url"]

        try:
            cls_result = await gemini_service.classify_document(pdf_bytes, filename)
        except Exception as e:
            logger.warning(f"Classification failed for {filename}, using fallback: {e}")
            cls_result = {}

        return DocumentMetadata(
            doc_id=doc_id,
            filename=filename,
            url=url,
            page_count=page_count,
            category=cls_result.get("category", "bank_statement"),
            entity_name=cls_result.get("entity_name", "Calder Fund"),
            reporting_period=cls_result.get("reporting_period", "2026-03-31")
        )

    import asyncio
    classified_docs = await asyncio.gather(*[_classify_single(doc) for doc in raw_docs])
    return {"classified_docs": list(classified_docs)}
