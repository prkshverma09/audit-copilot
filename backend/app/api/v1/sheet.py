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
    import os
    import json

    if identifier in ["default", "sheet_fund_reconciliation_2026_q1"]:
        fortune_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "src", "fixtures", "mock_fortune_data.json")),
            os.path.abspath("frontend/src/fixtures/mock_fortune_data.json"),
        ]
        fortune_file = next((p for p in fortune_paths if os.path.exists(p)), None)
        if fortune_file:
            try:
                with open(fortune_file, "r") as f:
                    return json.load(f)
            except Exception:
                pass

    result = find_job_result(identifier)
    if not result or not result.fortune_sheet_data:
        default_res = find_job_result("default")
        if default_res and default_res.fortune_sheet_data:
            return default_res.fortune_sheet_data
        raise HTTPException(
            status_code=404,
            detail=f"No sheet data found for identifier '{identifier}'."
        )
    return result.fortune_sheet_data
