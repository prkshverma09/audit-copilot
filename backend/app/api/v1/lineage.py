import logging
from typing import Optional
from fastapi import APIRouter, HTTPException

from app.api.v1.pipeline import jobs_registry
from app.models.lineage import CellLineage, SheetLineageResponse

logger = logging.getLogger("audit-copilot.api.lineage")
router = APIRouter(prefix="/lineage", tags=["Lineage"])


def find_job_result(identifier: str = "latest") -> Optional[SheetLineageResponse]:
    """
    Finds a completed SheetLineageResponse by job_id, sheet_id, or alias ('default' / 'latest').
    """
    # 1. Explicit default request
    if identifier == "default":
        if "default" in jobs_registry and jobs_registry["default"].status == "completed" and jobs_registry["default"].result:
            return jobs_registry["default"].result

    # 2. Check direct job_id match
    if identifier in jobs_registry:
        job = jobs_registry[identifier]
        if job.status == "completed" and job.result:
            return job.result

    # 3. Check sheet_id match
    for job in reversed(list(jobs_registry.values())):
        if job.status == "completed" and job.result and job.result.sheet_id == identifier:
            return job.result

    # 4. Fallback for 'latest' or 'default': return most recent completed job
    if identifier in ["latest", "default", "sheet_fund_reconciliation_2026_q1"]:
        for job in reversed(list(jobs_registry.values())):
            if job.status == "completed" and job.result:
                return job.result

    return None


@router.get("/cell/{cell_id}", response_model=CellLineage)
async def get_active_cell_lineage(cell_id: str):
    """
    Direct lookup for a specific cell (e.g. 'C4' or 'C14') from the active/latest reconciliation.
    Matches frontend api.getCellLineage(cellId) pattern.
    """
    formatted_cell_id = cell_id.upper()
    
    # Check latest completed job first
    result = find_job_result("latest")
    if result and formatted_cell_id in result.cells:
        return result.cells[formatted_cell_id]

    # Fallback to default baseline reconciliation if cell not in latest subset
    default_result = find_job_result("default")
    if default_result and formatted_cell_id in default_result.cells:
        return default_result.cells[formatted_cell_id]

    if not result and not default_result:
        raise HTTPException(status_code=404, detail="No active reconciliation sheet found.")

    raise HTTPException(
        status_code=404,
        detail=f"Cell '{formatted_cell_id}' not found in active lineage map."
    )


@router.get("/{identifier}", response_model=SheetLineageResponse)
async def get_sheet_lineage(identifier: str):
    """
    Retrieves the complete data-lineage tree and FortuneSheet workbook
    for the specified job_id, sheet_id, or 'latest' / 'default'.
    """
    result = find_job_result(identifier)
    if not result:
        if identifier in jobs_registry and jobs_registry[identifier].status == "processing":
            raise HTTPException(status_code=202, detail="Job is still processing. Please poll status.")
        raise HTTPException(status_code=404, detail=f"No completed lineage found for '{identifier}'.")
    return result


@router.get("/{identifier}/cell/{cell_id}", response_model=CellLineage)
async def get_cell_lineage(identifier: str, cell_id: str):
    """
    Returns granular formula inputs and exact verbatim quotes for a specific cell within a job.
    """
    result = find_job_result(identifier)
    if not result:
        raise HTTPException(status_code=404, detail=f"Reconciliation '{identifier}' not found.")

    formatted_cell_id = cell_id.upper()
    if formatted_cell_id not in result.cells:
        raise HTTPException(
            status_code=404,
            detail=f"Cell '{formatted_cell_id}' not found in lineage map for '{identifier}'."
        )

    return result.cells[formatted_cell_id]
