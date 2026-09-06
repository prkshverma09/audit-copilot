import logging
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response

from app.models.lineage import DocumentMetadata, UploadResponse
from app.storage.s3_adapter import storage_adapter

logger = logging.getLogger("audit-copilot.api.documents")
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentMetadata])
async def list_documents():
    """List all staged documents in the system."""
    return storage_adapter.list_documents()


from fastapi import File, UploadFile
from app.api.v1.upload import upload_documents

@router.post("/upload", response_model=UploadResponse)
async def upload_documents_alias(files: List[UploadFile] = File(...)):
    """Alias for /api/v1/upload."""
    return await upload_documents(files)


@router.get("/{doc_id}", response_model=DocumentMetadata)
async def get_document_metadata(doc_id: str):
    """Get metadata for a specific document."""
    meta = storage_adapter.get_metadata(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    return meta


@router.api_route("/{doc_id}/file", methods=["GET", "HEAD"])
async def stream_document_file(doc_id: str):
    """
    Streams the raw PDF file with proper headers for @react-pdf-viewer.
    Allows dynamic inline rendering and page jumping in browser.
    """
    file_path = storage_adapter.get_file_path(doc_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF file for '{doc_id}' not found.")

    headers = {
        "Content-Disposition": f'inline; filename="{file_path.name}"',
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes"
    }

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        headers=headers
    )
