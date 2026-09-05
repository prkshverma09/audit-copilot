"""
Comprehensive test script verifying all backend APIs work as expected
against the real data in 'Ylookup Hackathon Datasets'.
"""

import glob
import os
import time
import requests

BASE_URL = "http://127.0.0.1:8000"
DATASET_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "Ylookup Hackathon Datasets",
        "01-bank-statements-to-journal-entries",
        "statements",
    )
)

def run_all_api_checks():
    print("=" * 70)
    print("TESTING BACKEND APIS AGAINST REAL 'Ylookup Hackathon Datasets'")
    print("=" * 70)

    # 1. Health check
    print("\n[1] Testing GET /health ...")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Healthcheck failed: {res.text}"
    health_data = res.json()
    print(f"    ✓ Health status: {health_data['status']}")
    print(f"    ✓ Staged docs count: {health_data.get('staged_documents_count')}")

    # 2. Discover real statements in dataset
    pdf_files = sorted(glob.glob(os.path.join(DATASET_DIR, "*.pdf")))
    print(f"\n[2] Found {len(pdf_files)} real PDF statement files in dataset folder:")
    for f in pdf_files:
        print(f"    • {os.path.basename(f)} ({os.path.getsize(f):,} bytes)")
    assert len(pdf_files) == 7, f"Expected 7 bank statements, found {len(pdf_files)}"

    # 3. Test GET /api/v1/documents
    print("\n[3] Testing GET /api/v1/documents ...")
    res = requests.get(f"{BASE_URL}/api/v1/documents")
    assert res.status_code == 200, f"List documents failed: {res.text}"
    docs = res.json()
    print(f"    ✓ Returned {len(docs)} staged documents from backend.")
    assert len(docs) >= 7, "Backend should have all 7 dataset statements staged."

    # 4. Test GET /api/v1/documents/{doc_id} and GET & HEAD /api/v1/documents/{doc_id}/file
    print("\n[4] Testing PDF Streaming for all 7 real statements ...")
    for doc in docs[:7]:
        doc_id = doc["doc_id"]
        # Metadata check
        meta_res = requests.get(f"{BASE_URL}/api/v1/documents/{doc_id}")
        assert meta_res.status_code == 200
        # HEAD streaming check
        head_res = requests.head(f"{BASE_URL}/api/v1/documents/{doc_id}/file")
        assert head_res.status_code == 200
        assert head_res.headers.get("accept-ranges") == "bytes"
        assert "application/pdf" in head_res.headers.get("content-type")
        # GET streaming check
        get_res = requests.get(f"{BASE_URL}/api/v1/documents/{doc_id}/file")
        assert get_res.status_code == 200
        assert len(get_res.content) > 0
        print(f"    ✓ Streamed {doc['filename']}: {len(get_res.content):,} bytes, page_count={doc.get('page_count')}")

    # 5. Test POST /api/v1/upload with real PDFs from dataset
    print("\n[5] Testing POST /api/v1/upload with 2 real EUR statements ...")
    sample_pdfs = [
        next(p for p in pdf_files if "0894" in p),
        next(p for p in pdf_files if "8102" in p)
    ]
    files_payload = []
    opened_handles = []
    try:
        for p in sample_pdfs:
            h = open(p, "rb")
            opened_handles.append(h)
            files_payload.append(("files", (os.path.basename(p), h, "application/pdf")))
        upload_res = requests.post(f"{BASE_URL}/api/v1/upload", files=files_payload)
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
        uploaded_data = upload_res.json()
        print(f"    ✓ Uploaded {uploaded_data['total_files']} files successfully:")
        for doc_id, fname in zip(uploaded_data["doc_ids"], uploaded_data["filenames"]):
            print(f"      - {fname} -> {doc_id}")
    finally:
        for h in opened_handles:
            h.close()

    # 6. Test POST /api/v1/pipeline/run
    print("\n[6] Testing POST /api/v1/pipeline/run on real document IDs ...")
    run_res = requests.post(
        f"{BASE_URL}/api/v1/pipeline/run",
        json={"document_ids": uploaded_data["doc_ids"]}
    )
    assert run_res.status_code == 200, f"Pipeline run failed: {run_res.text}"
    job = run_res.json()
    job_id = job["job_id"]
    print(f"    ✓ Enqueued job {job_id}, status: {job['status']}")

    # 7. Test GET /api/v1/pipeline/{job_id}/status polling
    print(f"\n[7] Testing GET /api/v1/pipeline/{job_id}/status ...")
    max_wait = 30
    completed = False
    for i in range(max_wait):
        status_res = requests.get(f"{BASE_URL}/api/v1/pipeline/{job_id}/status")
        assert status_res.status_code == 200
        s_data = status_res.json()
        if s_data["status"] == "completed":
            completed = True
            print(f"    ✓ Job {job_id} completed: {s_data['message']}")
            break
        elif s_data["status"] == "failed":
            raise AssertionError(f"Job failed: {s_data.get('error')}")
        time.sleep(1.0)
    assert completed, f"Pipeline {job_id} did not complete in time."

    # 8. Test GET /api/v1/lineage/{job_id}
    print(f"\n[8] Testing GET /api/v1/lineage/{job_id} ...")
    job_lineage_res = requests.get(f"{BASE_URL}/api/v1/lineage/{job_id}")
    assert job_lineage_res.status_code == 200
    job_lineage = job_lineage_res.json()
    print(f"    ✓ Returned lineage with {len(job_lineage['cells'])} cells.")

    # 9. Test GET /api/v1/lineage/default (Full 7-statement baseline)
    print("\n[9] Testing GET /api/v1/lineage/default (Full Dataset Reconciliation) ...")
    def_res = requests.get(f"{BASE_URL}/api/v1/lineage/default")
    assert def_res.status_code == 200
    def_lineage = def_res.json()
    print(f"    ✓ Sheet ID: {def_lineage['sheet_id']}")
    print(f"    ✓ Sheet Name: {def_lineage['sheet_name']}")
    print(f"    ✓ Reconciled Cells: {len(def_lineage['cells'])}")
    print(f"    ✓ FortuneSheet Sheets: {len(def_lineage['fortune_sheet_data'])}")

    # 10. Test GET /api/v1/sheet/default
    print("\n[10] Testing GET /api/v1/sheet/default ...")
    sheet_res = requests.get(f"{BASE_URL}/api/v1/sheet/default")
    assert sheet_res.status_code == 200
    sheet_data = sheet_res.json()
    assert len(sheet_data) > 0
    print(f"    ✓ Returned FortuneSheet grid: {sheet_data[0]['name']}")
    print(f"    ✓ Cells populated: {len(sheet_data[0]['celldata'])} formatted cells")

    # 11. Test Lineage Extraction & Verbatim Quotes for Key Real Cells
    print("\n[11] Verifying Verbatim Lineage from Real Statements ...")

    # C4: Fund I Ending Ledger Balance (verify both /lineage/default/cell/C4 and /lineage/cell/C4)
    c4_res = requests.get(f"{BASE_URL}/api/v1/lineage/default/cell/C4")
    assert c4_res.status_code == 200
    c4 = c4_res.json()
    assert c4["calculated_value"] == 13217773.59
    assert c4["inputs"][0]["source_document"] == "20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"
    assert "13,217,773.59" in c4["inputs"][0]["verbatim_quote"]
    print(f"    ✓ Cell C4 (Default): {c4['metric_name']} = €{c4['calculated_value']:,.2f}")
    print(f"        Source: {c4['inputs'][0]['source_document']} (Page {c4['inputs'][0]['page_number']})")
    print(f"        Quote: {repr(c4['inputs'][0]['verbatim_quote'][:50])}...")

    # Also verify active lookup /lineage/cell/C4 succeeds
    c4_active_res = requests.get(f"{BASE_URL}/api/v1/lineage/cell/C4")
    assert c4_active_res.status_code == 200
    print(f"    ✓ Cell C4 (Active Job Lookup): value = {c4_active_res.json()['calculated_value']}")

    # D5: Fund II Ending Ledger Balance
    d5_res = requests.get(f"{BASE_URL}/api/v1/lineage/default/cell/D5")
    assert d5_res.status_code == 200
    d5 = d5_res.json()
    assert d5["calculated_value"] == 20088.32
    assert d5["inputs"][0]["source_document"] == "20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf"
    print(f"    ✓ Cell D5: {d5['metric_name']} = €{d5['calculated_value']:,.2f}")
    print(f"        Source: {d5['inputs'][0]['source_document']} (Page {d5['inputs'][0]['page_number']})")

    # C6: Consolidated Balance (Sum of C4 + D5)
    c6_res = requests.get(f"{BASE_URL}/api/v1/lineage/default/cell/C6")
    assert c6_res.status_code == 200
    c6 = c6_res.json()
    assert c6["calculated_value"] == 13237861.91
    assert len(c6["inputs"]) == 2
    print(f"    ✓ Cell C6: {c6['metric_name']} = €{c6['calculated_value']:,.2f}")
    print(f"        Formula: {c6['formula_display']} (Consolidates C4: €{c6['inputs'][0]['extracted_value']:,.2f} + D5: €{c6['inputs'][1]['extracted_value']:,.2f})")

    # E11: Intercompany Net Tie-Out Delta
    e11_res = requests.get(f"{BASE_URL}/api/v1/lineage/default/cell/E11")
    assert e11_res.status_code == 200
    e11 = e11_res.json()
    assert e11["calculated_value"] == 0.0
    assert e11["status"] == "verified"
    print(f"    ✓ Cell E11: {e11['metric_name']} = €{e11['calculated_value']:,.2f} [TIED OUT: Balanced]")

    # C14: Unallocated Suspense Reserve (Flagged for Review from dataset)
    c14_res = requests.get(f"{BASE_URL}/api/v1/lineage/cell/C14")
    assert c14_res.status_code == 200
    c14 = c14_res.json()
    assert c14["status"] in ["review_required", "verified"]
    assert "SUSPENSE-Q1" in (c14.get("notes") or "") or "suspense" in (c14.get("notes") or "").lower() or "unsubstantiated" in (c14.get("notes") or "").lower()
    print(f"    ✓ Cell C14: {c14['metric_name']} = €{c14['calculated_value']:,.2f}")
    print(f"        Status: {c14['status'].upper()} (Audit Notes: {c14.get('notes', '')})")

    print("\n" + "=" * 70)
    print("ALL BACKEND APIS TESTED & VERIFIED ON REAL DATASET WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_api_checks()
