from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.v1.pipeline import jobs_registry
from app.core.tieout_engine import TieOutReport, evaluate_tieouts
from app.models.lineage import SheetLineageResponse

logger = logging.getLogger("audit-copilot.api.tieout")
router = APIRouter(prefix="/tieout", tags=["Tie-Out & Footing Engine"])


class VerifyTieOutRequest(BaseModel):
    job_id: Optional[str] = Field(default="default", description="Pipeline job ID to evaluate")
    simulate_discrepancy: bool = Field(
        default=False, description="Whether to simulate an accounting discrepancy for testing"
    )


def _get_lineage(job_id: str) -> SheetLineageResponse:
    if job_id == "latest":
        for job in reversed(list(jobs_registry.values())):
            if job.status == "completed" and job.result:
                return job.result
    job = jobs_registry.get(job_id)
    if job and job.result:
        return job.result
    # Fallback to default job
    default_job = jobs_registry.get("default")
    if default_job and default_job.result:
        return default_job.result
    # Return empty response if no jobs found
    return SheetLineageResponse(
        sheet_id="sheet_default",
        sheet_name="Fund Cash Reconciliation",
        documents=[],
        cells={},
        fortune_sheet_data=[],
    )


@router.get("/summary", response_model=TieOutReport)
async def get_tieout_summary(
    job_id: str = Query("default", description="Job ID to fetch tie-out report for"),
    simulate_discrepancy: bool = Query(False, description="Whether to simulate a footing discrepancy"),
):
    """
    Returns automated footing and cross-statement tie-out verification report,
    including mathematical bridges, deltas, and cell canvas decoration markers.
    """
    lineage = _get_lineage(job_id)
    report = evaluate_tieouts(lineage, simulate_discrepancy=simulate_discrepancy)
    return report


@router.post("/verify", response_model=TieOutReport)
async def verify_tieout_post(req: VerifyTieOutRequest):
    """
    Calculates tie-outs and footing equations with optional discrepancy injection for audit stress testing.
    """
    job_id = req.job_id or "default"
    lineage = _get_lineage(job_id)
    report = evaluate_tieouts(lineage, simulate_discrepancy=req.simulate_discrepancy)
    return report
