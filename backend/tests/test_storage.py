import pytest
from app.storage.s3_adapter import StorageAdapter


def test_storage_adapter_save_and_retrieve(tmp_path):
    adapter = StorageAdapter(base_path=str(tmp_path))
    
    dummy_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    meta = adapter.save_file("sample_report.pdf", dummy_pdf_bytes)

    assert meta.filename == "sample_report.pdf"
    assert meta.doc_id.startswith("doc_")

    # Retrieve path
    path = adapter.get_file_path(meta.doc_id)
    assert path is not None
    assert path.exists()

    # Retrieve bytes
    content = adapter.get_file_bytes(meta.doc_id)
    assert content == dummy_pdf_bytes

    # List documents
    docs = adapter.list_documents()
    assert len(docs) >= 1
    assert any(d.doc_id == meta.doc_id for d in docs)
