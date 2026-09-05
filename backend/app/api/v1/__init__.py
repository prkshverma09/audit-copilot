from fastapi import APIRouter
from app.api.v1.upload import router as upload_router
from app.api.v1.pipeline import router as pipeline_router
from app.api.v1.lineage import router as lineage_router
from app.api.v1.documents import router as documents_router
from app.api.v1.sheet import router as sheet_router
from app.api.v1.tieout import router as tieout_router

api_v1_router = APIRouter()
api_v1_router.include_router(upload_router)
api_v1_router.include_router(pipeline_router)
api_v1_router.include_router(lineage_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(sheet_router)
api_v1_router.include_router(tieout_router)

__all__ = ["api_v1_router"]

