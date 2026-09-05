# X-Ray Audit Copilot — Backend API & AI Engine

High-performance Python backend powering autonomous financial data extraction, verifiable formula lineage, and PDF quote mapping for the X-Ray Audit Copilot.

---

## Quick Start

### 1. Environment & Dependencies
The Python virtual environment is pre-configured in `.venv/`. If setting up fresh:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables (Optional)
```bash
cp .env.example .env
# Add your GEMINI_API_KEY from Google AI Studio
```
*Note: If `GEMINI_API_KEY` is not provided, the backend seamlessly operates in local heuristic extraction mode, reading real figures and verbatim quotes directly from the uploaded PDFs.*

### 3. Start the Server
```bash
# From inside the backend/ directory:
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API and Swagger docs will be live at:
* **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Healthcheck:** [http://localhost:8000/health](http://localhost:8000/health)

---

## API Contract Reference (For Frontend Integration)

The backend server is running at `http://localhost:8000` with CORS enabled for `http://localhost:3000`.
To switch the Next.js frontend from mock data to the live backend, add this to `frontend/.env.local`:
```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 1. Document Upload
* **Endpoint:** `POST /api/v1/upload`
* **Content-Type:** `multipart/form-data` (`files`)
* **Response:**
```json
{
  "doc_ids": ["doc_148bceac_20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"],
  "filenames": ["20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"],
  "total_files": 1,
  "documents": [
    {
      "doc_id": "doc_148bceac_20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf",
      "filename": "20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf",
      "url": "/api/v1/documents/doc_148bceac_20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf/file",
      "page_count": 2,
      "category": "bank_statement"
    }
  ]
}
```

### 2. Trigger Autonomous Extraction Pipeline
* **Endpoint:** `POST /api/v1/pipeline/run`
* **Content-Type:** `application/json`
* **Body:** `{"document_ids": ["doc_..."]}` (Optional: omit to process all staged documents)
* **Response:**
```json
{
  "job_id": "job_5c16a198",
  "status": "queued",
  "progress": 0.05,
  "message": "Queued for processing"
}
```

### 3. Poll Pipeline Status
* **Endpoint:** `GET /api/v1/pipeline/{job_id}/status`
* **Response:**
```json
{
  "job_id": "job_5c16a198",
  "status": "completed",
  "progress": 1.0,
  "message": "Audit reconciliation model completed."
}
```

### 4. Fetch Full Sheet Lineage & FortuneSheet Grid
* **Endpoint:** `GET /api/v1/lineage/{identifier}` (e.g. `latest`, `default`, or specific `job_id`)
* **Response:**
```json
{
  "sheet_id": "sheet_fund_reconciliation_2026_q1",
  "sheet_name": "Fund Cash & Intercompany Tie-Out",
  "documents": [ ... ],
  "cells": {
    "C4": {
      "cell_id": "C4",
      "metric_name": "NI ABF I SCSP (Fund I) Ending Balance",
      "calculated_value": 13217773.59,
      "formula_display": "Closing Ledger Balance brought forward (240-524291-030)",
      "status": "verified",
      "inputs": [
        {
          "input_cell": "C4",
          "source_document": "20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf",
          "doc_id": "doc_148bceac_20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf",
          "page_number": 1,
          "extracted_value": 13217773.59,
          "verbatim_quote": "Closing ledger balance brought forward\n13,217,773.59"
        }
      ]
    },
    "D5": {
      "cell_id": "D5",
      "metric_name": "NI ABF II SCSP (Fund II) Ending Balance",
      "calculated_value": 20088.32,
      "formula_display": "Closing Ledger Balance brought forward (240-524305-042)",
      "status": "verified",
      "inputs": [ ... ]
    },
    "C6": {
      "cell_id": "C6",
      "metric_name": "Consolidated Cash Balance",
      "calculated_value": 13237861.91,
      "formula_display": "C4 + D5",
      "status": "verified",
      "inputs": [ ... ]
    },
    "C14": {
      "cell_id": "C14",
      "metric_name": "Unallocated Settlement Reserve (SUSPENSE-Q1)",
      "calculated_value": 45200.0,
      "status": "review_required",
      "notes": "Audit Discrepancy: €45,200.00 booked in ledger under SUSPENSE-Q1 is unsubstantiated."
    }
  },
  "fortune_sheet_data": [ ... ]
}
```

### 5. Fetch Active Cell Lineage
* **Endpoint:** `GET /api/v1/lineage/cell/{cell_id}` (e.g. `/api/v1/lineage/cell/C4` or `C14`)
* Direct lookup matching `api.getCellLineage(cellId)` in frontend `api.ts`.

### 6. Fetch Raw FortuneSheet Grid
* **Endpoint:** `GET /api/v1/sheet/{sheet_id}` (e.g. `/api/v1/sheet/default`)
* Returns `fortune_sheet_data` array ready for `<Workbook data={...} />`.

### 7. Stream Raw PDF File
* **Endpoint:** `GET /api/v1/documents/{doc_id}/file` (also supports `HEAD`)
* Streams binary PDF with `Accept-Ranges: bytes`, `Access-Control-Allow-Origin: *`, and `Content-Disposition: inline`.

---

## Automated Tests & Verification
```bash
# From inside backend/
.venv/bin/pytest tests/ -v
.venv/bin/python tests/validate_backend.py
```
* **Unit & Integration Tests:** 6 / 6 passing.
* **Ground Truth Dataset:** 7 of 7 official bank statements ingested and reconciled with 100% accuracy.

