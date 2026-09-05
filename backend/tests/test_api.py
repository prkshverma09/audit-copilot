import io
import os
import time
import pytest
from fastapi.testclient import TestClient

from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_root_and_health(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "X-Ray Audit Copilot API"

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_auto_staged_documents_and_default_sheet(client):
    # Documents endpoint should have documents listed from dataset
    res = client.get("/api/v1/documents")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) >= 1

    # Check default sheet endpoint
    res = client.get("/api/v1/sheet/default")
    assert res.status_code == 200
    sheet_data = res.json()
    assert len(sheet_data) > 0
    assert "celldata" in sheet_data[0]

    # Check direct cell lookup for C4 (Fund I Balance)
    res = client.get("/api/v1/lineage/cell/C4")
    if res.status_code == 200:
        c4_info = res.json()
        assert c4_info["cell_id"] == "C4"
        assert c4_info["calculated_value"] == 13217773.59
        assert len(c4_info["inputs"]) > 0
        assert "13,217,773.59" in c4_info["inputs"][0]["verbatim_quote"]

    # Check direct cell lookup for C14 (Suspense / Review Required)
    res = client.get("/api/v1/lineage/cell/C14")
    if res.status_code == 200:
        c14_info = res.json()
        assert c14_info["cell_id"] == "C14"
        assert c14_info["status"] in ["review_required", "verified"]


def test_upload_and_pipeline_flow(client):
    dataset_path = os.path.abspath(
        "Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"
    )
    if not os.path.exists(dataset_path):
        dataset_path = os.path.abspath(
            "../Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"
        )

    with open(dataset_path, "rb") as f:
        pdf_bytes = f.read()

    # 1. Upload
    files = [
        ("files", ("20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf", io.BytesIO(pdf_bytes), "application/pdf"))
    ]
    res = client.post("/api/v1/upload", files=files)
    assert res.status_code == 200
    upload_res = res.json()
    assert upload_res["total_files"] == 1
    doc_id = upload_res["doc_ids"][0]
    assert doc_id.startswith("doc_")

    # 2. Documents listing
    res = client.get("/api/v1/documents")
    assert res.status_code == 200
    docs_list = res.json()
    assert any(d["doc_id"] == doc_id for d in docs_list)

    # 3. Document PDF Streaming
    res = client.get(f"/api/v1/documents/{doc_id}/file")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) == len(pdf_bytes)

    # 4. Trigger Pipeline
    res = client.post("/api/v1/pipeline/run", json={"document_ids": [doc_id]})
    assert res.status_code == 200
    job = res.json()
    job_id = job["job_id"]
    assert job["status"] in ["queued", "processing", "completed"]

    # 5. Poll Job Status
    max_retries = 20
    completed = False
    for _ in range(max_retries):
        res = client.get(f"/api/v1/pipeline/{job_id}/status")
        assert res.status_code == 200
        status_data = res.json()
        if status_data["status"] == "completed":
            completed = True
            break
        elif status_data["status"] == "failed":
            pytest.fail(f"Pipeline job failed: {status_data.get('error')}")
        time.sleep(0.3)

    assert completed, "Pipeline did not complete within allotted polling time."

    # 6. Retrieve Lineage
    res = client.get(f"/api/v1/lineage/{job_id}")
    assert res.status_code == 200
    lineage_data = res.json()
    assert len(lineage_data["cells"]) > 0
    assert len(lineage_data["fortune_sheet_data"]) > 0

    # 7. Retrieve Cell Lineage
    first_cell_id = list(lineage_data["cells"].keys())[0]
    res = client.get(f"/api/v1/lineage/{job_id}/cell/{first_cell_id}")
    assert res.status_code == 200
    cell_info = res.json()
    assert cell_info["cell_id"] == first_cell_id
    assert len(cell_info["inputs"]) > 0
    assert cell_info["inputs"][0]["verbatim_quote"] != ""

    # 8. Test "latest" lineage alias
    res = client.get("/api/v1/lineage/latest")
    assert res.status_code == 200
    assert res.json()["sheet_id"] == lineage_data["sheet_id"]
