import os
import uuid
import hashlib
from pathlib import Path
from typing import List, Optional
import pypdf

from app.config import settings
from app.models.lineage import DocumentMetadata


class StorageAdapter:
    """
    Manages physical document storage with local directory caching
    and metadata indexing. Ready for S3 / Floci sync if cloud configured.
    """

    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.storage_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self._meta_index: dict[str, DocumentMetadata] = {}

    def _generate_doc_id(self, filename: str, content: bytes) -> str:
        # Create deterministic hash-based prefix with clean short slug
        file_hash = hashlib.sha256(content).hexdigest()[:8]
        safe_name = "".join(c for c in filename if c.isalnum() or c in "._-")
        return f"doc_{file_hash}_{safe_name}"

    def save_file(self, filename: str, content: bytes) -> DocumentMetadata:
        doc_id = self._generate_doc_id(filename, content)
        file_path = self.base_path / f"{doc_id}.pdf"
        
        # Write bytes
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Determine page count using pypdf
        page_count = 1
        try:
            reader = pypdf.PdfReader(file_path)
            page_count = max(1, len(reader.pages))
        except Exception:
            page_count = 1

        import datetime
        meta = DocumentMetadata(
            doc_id=doc_id,
            filename=filename,
            url=f"{settings.api_prefix}/documents/{doc_id}/file",
            page_count=page_count,
            category="bank_statement" if "statement" in filename.lower() or "scsp" in filename.lower() or "fund" in filename.lower() else "other",
            file_size=len(content),
            upload_date=datetime.datetime.now().strftime("%Y-%m-%d"),
        )
        self._meta_index[doc_id] = meta
        return meta

    def get_file_path(self, doc_id: str) -> Optional[Path]:
        # Check standard path
        file_path = self.base_path / f"{doc_id}.pdf"
        if file_path.exists():
            return file_path
        # Check without .pdf extension
        alt_path = self.base_path / doc_id
        if alt_path.exists():
            return alt_path
        return None

    def get_file_bytes(self, doc_id: str) -> Optional[bytes]:
        path = self.get_file_path(doc_id)
        if path and path.exists():
            with open(path, "rb") as f:
                return f.read()
        return None

    def get_metadata(self, doc_id: str) -> Optional[DocumentMetadata]:
        if doc_id in self._meta_index:
            return self._meta_index[doc_id]
        path = self.get_file_path(doc_id)
        if path and path.exists():
            page_count = 1
            try:
                reader = pypdf.PdfReader(path)
                page_count = max(1, len(reader.pages))
            except Exception:
                pass
            meta = DocumentMetadata(
                doc_id=doc_id,
                filename=path.name,
                url=f"{settings.api_prefix}/documents/{doc_id}/file",
                page_count=page_count,
                category="other"
            )
            self._meta_index[doc_id] = meta
            return meta
        return None

    def list_documents(self) -> List[DocumentMetadata]:
        docs = []
        for file in self.base_path.glob("*.pdf"):
            doc_id = file.stem
            meta = self.get_metadata(doc_id)
            if meta:
                docs.append(meta)
        return docs


storage_adapter = StorageAdapter()
