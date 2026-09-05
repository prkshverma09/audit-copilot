import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router
from app.config import settings
from app.storage.s3_adapter import storage_adapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("audit-copilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    import glob
    import os
    from app.api.v1.pipeline import jobs_registry
    from app.graph.workflow import run_audit_pipeline
    from app.models.lineage import JobStatus

    logger.info("Initializing X-Ray Audit Copilot Backend...")
    # Ensure storage cache directory exists
    storage_adapter.base_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Storage cache ready at: {storage_adapter.base_path}")

    # Auto-stage official hackathon statements from dataset
    dataset_dirs = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Ylookup Hackathon Datasets", "01-bank-statements-to-journal-entries", "statements")),
        os.path.abspath(os.path.join("..", "Ylookup Hackathon Datasets", "01-bank-statements-to-journal-entries", "statements")),
        os.path.abspath("Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements"),
    ]

    target_dir = next((d for d in dataset_dirs if os.path.exists(d)), None)
    if target_dir:
        statement_files = sorted(glob.glob(os.path.join(target_dir, "*.pdf")))
        staged_ids = []
        for sf in statement_files:
            fname = os.path.basename(sf)
            with open(sf, "rb") as f:
                content = f.read()
            meta = storage_adapter.save_file(fname, content)
            staged_ids.append(meta.doc_id)

        logger.info(f"Auto-staged {len(staged_ids)} official hackathon statement PDFs.")
        
        # Pre-compute initial reconciliation matrix
        try:
            default_res = await run_audit_pipeline(staged_ids, sheet_id="sheet_fund_reconciliation_2026_q1")
            jobs_registry["default"] = JobStatus(
                job_id="default",
                status="completed",
                progress=1.0,
                message="Initial Fund Cash & Tie-Out Reconciliation ready.",
                result=default_res
            )
            logger.info("Default reconciliation matrix successfully pre-computed and indexed.")
        except Exception as e:
            logger.warning(f"Could not pre-compute default reconciliation: {e}")

    yield
    logger.info("Shutting down X-Ray Audit Copilot Backend.")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Autonomous Financial Data Lineage & Verification Agent API",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_v1_router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_v1": settings.api_prefix
    }


@app.get("/health")
async def health_check():
    docs = storage_adapter.list_documents()
    return {
        "status": "healthy",
        "staged_documents_count": len(docs),
        "models": {
            "reasoning": settings.gemini_reasoning_model,
            "fast": settings.gemini_fast_model
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
