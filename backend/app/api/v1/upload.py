import logging
from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.models.lineage import DocumentMetadata, UploadResponse
from app.storage.s3_adapter import storage_adapter

logger = logging.getLogger("audit-copilot.api.upload")
router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", response_model=UploadResponse)
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Accepts one or more PDF documents, stores them in the staging layer,
    and returns document metadata with streaming URLs.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for upload.")

    results: List[DocumentMetadata] = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            logger.warning(f"Skipping non-pdf file: {file.filename}")
            continue

        content = await file.read()
        if len(content) == 0:
            logger.warning(f"File {file.filename} is empty.")
            continue

        meta = storage_adapter.save_file(filename=file.filename, content=content)
        results.append(meta)

    if not results:
        raise HTTPException(
            status_code=400,
            detail="No valid PDF files were uploaded."
        )

    logger.info(f"Successfully staged {len(results)} PDF document(s).")
    return UploadResponse(
        doc_ids=[d.doc_id for d in results],
        filenames=[d.filename for d in results],
        total_files=len(results),
        documents=results
    )

