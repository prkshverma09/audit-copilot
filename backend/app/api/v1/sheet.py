import logging
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

from app.api.v1.lineage import find_job_result

logger = logging.getLogger("audit-copilot.api.sheet")
router = APIRouter(prefix="/sheet", tags=["Sheet"])


@router.get("/{identifier}", response_model=List[Dict[str, Any]])
async def get_sheet_data(identifier: str = "default"):
    """
    Returns the FortuneSheet grid configuration and celldata array
    for direct ingestion into @fortune-sheet/react Workbook component.
    """
    result = find_job_result(identifier)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No sheet data found for identifier '{identifier}'."
        )
    return result.fortune_sheet_data
