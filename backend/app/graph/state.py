from typing import Any, Dict, List, Optional, TypedDict
from app.models.lineage import CellLineage, DocumentMetadata


class GraphState(TypedDict):
    document_ids: List[str]
    raw_documents: List[Dict[str, Any]]
    classified_docs: List[DocumentMetadata]
    sheet_title: str
    lineage_cells: Dict[str, CellLineage]
    fortune_sheet_data: List[Dict[str, Any]]
    error: Optional[str]
