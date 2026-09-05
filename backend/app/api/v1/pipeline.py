import asyncio
import logging
import uuid
from typing import Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.graph.workflow import run_audit_pipeline
from app.models.lineage import JobStatus, SheetLineageResponse
from app.storage.s3_adapter import storage_adapter

logger = logging.getLogger("audit-copilot.api.pipeline")
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

# In-memory registry of audit jobs
jobs_registry: Dict[str, JobStatus] = {}


class PipelineRunRequest(BaseModel):
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="List of document IDs to process. If empty or None, processes all staged documents."
    )


async def execute_pipeline_task(job_id: str, document_ids: List[str]):
    try:
        jobs_registry[job_id].status = "processing"
        jobs_registry[job_id].progress = 0.25
        jobs_registry[job_id].message = f"Ingesting and classifying {len(document_ids)} documents..."

        await asyncio.sleep(0.2)
        jobs_registry[job_id].progress = 0.60
        jobs_registry[job_id].message = "Extracting financial KPIs and verbatim lineage quotes..."

        result: SheetLineageResponse = await run_audit_pipeline(document_ids=document_ids)

        jobs_registry[job_id].status = "completed"
        jobs_registry[job_id].progress = 1.0
        jobs_registry[job_id].message = "Audit reconciliation model completed."
        jobs_registry[job_id].result = result
        logger.info(f"Pipeline job {job_id} completed successfully.")
    except Exception as e:
        logger.error(f"Pipeline job {job_id} failed: {e}", exc_info=True)
        jobs_registry[job_id].status = "failed"
        jobs_registry[job_id].error = str(e)
        jobs_registry[job_id].message = "Pipeline failed during execution."


@router.post("/run", response_model=JobStatus)
async def start_pipeline(req: PipelineRunRequest, background_tasks: BackgroundTasks):
    """
    Trigger the LangGraph extraction and audit pipeline in the background.
    """
    doc_ids = req.document_ids
    if not doc_ids:
        # Fallback to all staged documents
        all_docs = storage_adapter.list_documents()
        doc_ids = [d.doc_id for d in all_docs]

    if not doc_ids:
        raise HTTPException(
            status_code=400,
            detail="No documents available to process. Please upload PDFs first."
        )

    job_id = f"job_{uuid.uuid4().hex[:8]}"
    status_entry = JobStatus(
        job_id=job_id,
        status="queued",
        progress=0.05,
        message="Queued for processing"
    )
    jobs_registry[job_id] = status_entry

    background_tasks.add_task(execute_pipeline_task, job_id, doc_ids)
    return status_entry


@router.get("/{job_id}/status", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Poll the status of an ongoing or completed audit job.
    """
    if job_id not in jobs_registry:
        raise HTTPException(status_code=404, detail=f"Job ID '{job_id}' not found.")
    return jobs_registry[job_id]


@router.get("/jobs", response_model=List[JobStatus])
async def list_jobs():
    """List all recent jobs and their status."""
    return list(jobs_registry.values())
