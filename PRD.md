# Product Requirements Document (PRD): X-Ray Audit Copilot

**Project Name:** X-Ray Audit Copilot (Data Lineage & Verification Agent)  
**Hackathon Event:** Ylookup x Encode AI Hackathon, London  
**Track:** Product Track  
**Target Persona:** Fund Administrator / Fund Accountant  

---

## 1. Executive Summary
**The Problem:** Fund accountants manually extract unstructured financial data from PDFs (K-1s, quarterly portfolio statements, bank notices) and consolidate it into master Excel reconciliation models. When reviewing the final spreadsheet, there is zero traceability: verifying a single calculated cell requires manually hunting through dozens of multi-page PDFs, creating a massive review bottleneck and high friction in team approvals.  
**The Solution:** An autonomous extraction and lineage verification agent powered exclusively by Google Gemini 1.5 models. The system extracts financial KPIs, builds a verifiable JSON data-lineage tree, and populates an interactive web-based Excel grid (`@fortune-sheet/react`). Clicking any calculated cell splits the screen and dynamically opens `@react-pdf-viewer`, automatically highlighting the exact verbatim source text across all underlying PDFs that fed into that formula.

---

## 2. Target Audience & Problem Statements
* **Primary User:** Fund Administrators & Fund Accountants.
* **Key Pain Point:** Lack of cell-level data lineage in financial spreadsheets ("Where did this $250,000 figure come from?").
* **User Story:** "As a Fund Accountant, I want to click any calculated cell in our reconciliation sheet and immediately see the underlying PDF sources with the exact text highlighted, so I can verify accuracy in seconds rather than hours."

---

## 3. System Architecture & Tech Stack

### 3.1. AI & LLM Infrastructure (Strictly Google Gemini)
* **Primary Model (Reasoning & Extraction):** **Google Gemini 1.5 Pro** (via Google AI Studio API / Vertex AI).
  * *Role:* Takes raw, unstructured multi-page PDFs as native multimodal inputs (leveraging Gemini's 2M token context window) and outputs structured data lineage JSON using Gemini's native Structured Outputs / JSON Schema enforcement.
  * *Why Gemini 1.5 Pro:* Eliminates traditional OCR pipelines (Tesseract/PyPDF) while accurately reading complex, embedded financial tables and text snippets across large document sets simultaneously.
* **Secondary Model (Fast Classification & Indexing):** **Google Gemini 1.5 Flash**.
  * *Role:* Rapid document classification, metadata tagging, and fast search indexing prior to deep lineage extraction.

### 3.2. Technical Stack Breakdown
* **Frontend:** Next.js (React, TypeScript).
  * **Spreadsheet Grid:** `@fortune-sheet/react` (Open-source Excel drop-in component with native `onSelect`/`onClick` cell event hooks).
  * **PDF Viewer & Visual Highlighter:** `@react-pdf-viewer/core` + `@react-pdf-viewer/highlight` (Open-source React PDF viewer with programmatic text string highlighting).
* **Backend & API Layer:** FastAPI (Python 3.11+).
* **Orchestration Framework:** LangGraph (Python DAG state machine managing: Ingest -> Classify -> Extract Lineage -> Map Grid).
* **Vector DB / Layout Memory:** Qdrant (Running locally in Docker for caching historical document mappings).
* **Local Cloud Infrastructure:** Floci local emulator (Mocking AWS S3 bucket staging during development).

---

## 4. Lineage Data Model & JSON Schema
To guarantee deterministic UI rendering, Gemini 1.5 Pro is prompted to adhere strictly to the following JSON schema output:

```json
{
  "cell_id": "C5",
  "metric_name": "Net Asset Value",
  "calculated_value": 250000,
  "formula_display": "A5 + B5",
  "inputs": [
    {
      "input_cell": "A5",
      "source_document": "portfolio_company_A_Q3.pdf",
      "extracted_value": 150000,
      "verbatim_quote": "Operating revenue for Q3 totaled $150,000"
    },
    {
      "input_cell": "B5",
      "source_document": "portfolio_company_B_K1.pdf",
      "extracted_value": 100000,
      "verbatim_quote": "Part III, Box 1: 100,000"
    }
  ]
}

```

---

## 5. End-to-End User & System Flow

```text
[1. Multi-PDF Upload] ──> [2. Gemini 1.5 Flash] ──> [3. Gemini 1.5 Pro] ──> [4. LangGraph DAG]
   (K-1s, Statements)       (Classifies Docs)         (Extracts Lineage JSON)    (Builds State)
                                                                                      │
                                                                                      ▼
[6. Visual Split Screen] <── [5. Audit Click Trigger] <── [FastAPI Server] <── [FortuneSheet Grid]
   (Highlights PDF Quote)      (Admin Clicks Cell)        (Serves JSON)         (Renders Excel)

```

1. **Ingest:** User drags and drops multi-page financial PDFs into the Next.js app.
2. **Classify:** Gemini 1.5 Flash categorizes documents and extracts basic metadata.
3. **Extract & Trace:** Gemini 1.5 Pro ingests full PDFs natively, computes formula inputs, and extracts exact verbatim text quotes into the structured JSON lineage model.
4. **Render:** Next.js loads `@fortune-sheet/react` populated with the reconciled values.
5. **Audit Click:** The Fund Admin clicks Cell `C5` ("Net Asset Value: $250,000").
6. **Evidence Reveal:** FortuneSheet's selection event triggers `@react-pdf-viewer`. The screen splits, showing the formula breakdown on top ($150,000 + $100,000) and the underlying PDF(s) on the bottom, with the exact verbatim text quotes highlighted in yellow.

---

## 6. Open-Source Component Selection & Alternatives

| Component Role | Primary Selection | Recommended Open-Source Library | Alternative Option (Fallback) |
| --- | --- | --- | --- |
| **Spreadsheet UI** | FortuneSheet | `@fortune-sheet/react` | `ag-grid-react` (Community) |
| **PDF Viewer** | React PDF Viewer | `@react-pdf-viewer/core` | `react-pdf` (`pdfjs-dist`) |
| **Highlight Engine** | Search/Highlight Plugin | `@react-pdf-viewer/highlight` | Custom Canvas Overlay / Bounding Box |
| **Orchestration** | LangGraph | `langgraph` (Python) | `LlamaIndex` Workflows |
| **Vector Database** | Qdrant | `qdrant-client` (Docker) | ChromaDB / FAISS |

---

## 7. 48-Hour Execution Roadmap

* **Saturday 12:00 - 15:00:** Frontend scaffolding in Next.js. Implement `@fortune-sheet/react` and `@react-pdf-viewer/core`. Hardcode mock lineage JSON to test split-screen cell click events.
* **Saturday 15:00 - 20:00:** Backend set up with FastAPI & Gemini 1.5 Pro via Google AI Studio API keys. Develop structured output prompts for PDF table and text lineage mapping.
* **Saturday 20:00 - 22:00:** Integrate local Qdrant Vector DB & Floci S3 emulator in Docker for document caching and staging.
* **Sunday 08:00 - 10:00:** End-to-end integration: wire FastAPI Gemini output to Next.js FortuneSheet & PDF highlighter.
* **Sunday 10:00 - 12:00:** UI polish, edge case testing, demo video recording (3-5 min), and GitHub submission.

---

## 8. Judging Criteria Alignment (25% Each)

* **Problem Identification (25%):** Directly addresses the document extraction and audit friction explicitly stated in fund manager and fund admin interviews.
* **Product (25%):** Eliminates the "black box" nature of financial AI by providing visual proof for every generated number.
* **UI (25%):** Clean, professional desktop workspace built with `@fortune-sheet/react` that avoids generic "AI chatbot slop."
* **Code Review (25%):** Clean FastAPI backend, modular LangGraph state machine, and zero-headache local Docker environment setup.

---

## 9. Stretch Goals (Post-Core Scope — Strict Priority Order)

> [!WARNING]
> **STRICT EXECUTION RULE:**
> The following features are **STRETCH GOALS**. They must **NOT** be worked on until Sections 1 through 8 (the core cell-to-PDF lineage viewer, FortuneSheet grid, Gemini 1.5 extraction, and end-to-end integration) are 100% completed, tested, and verified.

The stretch features below are ranked in strict priority order, grounded in the Ylookup hackathon call transcripts (especially **Call 1: NAV workflow review**) and the real dataset characteristics:

### Priority 1 (Highest Impact): Automated "Tie-Out & Footing" Engine
* **Interview Grounding (Call 1, Page 2):** *"Nobody reads it and asks whether this number foots to that number. How does my balance sheet have nothing in common with my equity balance? In reality you could build a bridge between the two."*
* **Feature Description:** An automated mathematical reconciliation layer running across the FortuneSheet grid:
  * **Vertical Footing:** Asserts that sub-items sum to total rows (e.g. `Beginning Balance + Credits - Debits == Ending Balance`).
  * **Cross-Statement Tie:** Verifies that Cash on the Balance sheet ties to the Cash Statement ending balance.
  * **UI Indication:** Cells display green shield badges (`✓ Tied`) or amber warning badges (`⚠️ Discrepancy: Δ $12,450`) with a 1-click bridge explanation.

### Priority 2: Deliberate Imperfection & Exception Badges (Unmatched Resolver)
* **Dataset Grounding (`01-bank-statements-to-journal-entries/README.md`):** *"52 of 100 rows have no counterparty match at all... 3 rows are flagged Review... Preserved from the original, do not treat as errors."*
* **Feature Description:** Graceful UI handling for real-world messy data:
  * Rows with truncated narratives (e.g., `ACME HLDS TRNSFR...`) that cannot be cleanly matched to the master list are tagged with an amber `Review Required` badge rather than hallucinating or failing silently.
  * Clicking the cell displays candidate counterparties with fuzzy match scores and an "Accept Match" action.

### Priority 3: One-Click "13-Page Audit Review Memo" Export
* **Interview Grounding (Call 1, Page 1 & 3):** *"I put it through an AI coding tool first, and it produced a forty-point memo of what was wrong... I have a thirteen-page review pack the tool prepares."*
* **Feature Description:** A single button in the header (`Export Audit Memo`) that compiles a clean, publication-ready PDF/Markdown report containing:
  1. Executive Summary & Verification Coverage (% of sheet backed by source PDFs).
  2. Footing & Cross-Statement Tie Status.
  3. Action Item / Exception List (the specific rows flagged for human review with exact PDF page citations).

### Priority 4: Audit Trail Confidence & Lineage Coverage Meter
* **Feature Description:** A sleek header widget displaying real-time audit health:
  * Example: `Lineage Coverage: 96% | 42/44 Cells Traced | 0 Hallucinations Detected`.
  * Instantly conveys trust to a non-technical fund manager before signing off.

### Priority 5: Multi-Document Tabbed Split Viewer
* **Feature Description:** When a formula combines numbers from multiple separate PDFs (e.g., `C5 = A5 [Fund_I.pdf] + B5 [Fund_II.pdf]`), the bottom viewer provides quick-toggle document tabs or a dual-document view to inspect both verbatim quotes simultaneously.
