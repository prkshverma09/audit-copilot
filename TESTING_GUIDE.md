# End-to-End Testing Guide

Comprehensive testing instructions for **X-Ray Audit Copilot**. This guide covers both the **True Autonomous Ingestion Pipeline (Flow 1)** and the **Quick Auditor Review Demo (Flow 2)**.

---

## 1. Start the App (2 Terminal Tabs)

### Terminal 1 — Backend
```bash
cd backend
python3 -m uvicorn app.main:app --port 8000 --reload
```
> Verify backend health: open [http://localhost:8000/health](http://localhost:8000/health) (`{"status":"healthy"}`).

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
> Verify frontend: open [http://localhost:3000](http://localhost:3000) in Chrome.

---

## 2. Flow 1: True End-to-End Autonomous Pipeline Test
*Test the real agentic intake: raw statement ingestion $\to$ LangGraph extraction $\to$ FortuneSheet synthesis.*

1. **Open the Workspace:**
   * Go to [http://localhost:3000](http://localhost:3000).

2. **Open Document Ingestion:**
   * Click **`Upload PDFs`** in the top navigation bar.

3. **Select Statement Documents:**
   * Click **`⚡ Select Official Calder Statements (2 PDFs)`** (or drag & drop your own financial PDFs).
   * Notice the 2 statements queued: `Fund I (ABF I)` and `Fund II (ABF II)`.

4. **Run the Autonomous Pipeline:**
   * Click **`Start Pipeline`**.
   * Watch the live agentic progress stepper:
     * **Step 1:** Document Classification & Layout Parsing (Gemini Flash).
     * **Step 2:** Verbatim Lineage & Equation Reasoning (Gemini Pro).
     * **Step 3:** FortuneSheet Grid & Footing Tie-Out Assembly.

5. **Inspect the Synthesized Output:**
   * Click **`Inspect Reconciled Sheet`**.
   * The newly synthesized financial matrix appears with live cell lineages and calculated totals!

> *Tip: You can also click the **`Run Audit`** button in the header at any time to re-run the LangGraph extraction DAG over all staged documents.*

---

## 3. Flow 2: Quick Auditor Review & Verification Demo (Pre-loaded Sample)
*For rapid demo evaluation, test the interactive audit tracing, multi-document switching, and footing bridges without waiting for extraction.*

> *Click **`⚡ Load Demo Audit`** in the top navigation bar at any time to instantly reset to the verified baseline Q1 Fund Reconciliation.*

### Click 1: Click Cell `C4` (Single Lineage Trace)
* **Action:** Click cell **`C4`** in the spreadsheet or top jump bar.
* **What you see:** 
  * Right inspector shows the source citation: **€13,217,773.59**.
  * PDF viewer below jumps to **Page 1** and highlights the exact verbatim balance in yellow.

### Click 2: Click Cell `C6` (Multi-Document Citation Switcher)
* **Action:** Click cell **`C6`** in the jump bar.
* **What you see:**
  * Top bar shows the multi-statement formula: `Sum: €13,217,773.59 (C4) + €20,088.32 (D5) = €13,237,861.91 (C6)`.
  * Inspector displays two side-by-side evidence cards: **Fund I (`C4`)** and **Fund II (`D5`)**.
  * Click **"View in PDF"** on the `D5` card — the PDF viewer instantly switches statement documents to Fund II and highlights its ledger balance.

### Click 3: Click Cell `C14` (Audit Exception Flag)
* **Action:** Click cell **`C14`** in the jump bar.
* **What you see:**
  * Cell C14 has an amber background and a warning indicator (`€45,200.00 ⚠️`).
  * Inspector displays an amber alert: **`⚠️ AUDIT REVIEW FLAG / DISCREPANCY REASON`**.
  * Notes explain that the €45,200 suspense reserve is unsubstantiated in the PDF statements.

### Click 4: Inspect Footing Engine (`Tie-Outs: 3/4 Tied`)
* **Action:** Click **`Tie-Outs: 3/4 Tied`** in the top navigation header.
* **What you see:**
  * The **Automated Tie-Out & Footing Engine** modal opens.
  * Shows 4 mathematical bridges (Cash Footing, Consolidated Cash, Intercompany Net Tie-Out, Suspense Reserve).
  * Click **"Simulate Discrepancy Test"** — the screen updates live to inject a €12,450 variance with an amber audit warning.

### Click 5: Lineage Coverage Meter
* **Action:** Look at the top bar.
* **What you see:**
  * **`94% Lineage Coverage`** (emerald badge).
  * **`17/18 Traced`** (number of figures grounded in source documents).
  * **`⚠️ 1 Review`** (unmatched exception flag).

---

## 4. Automated E2E Test (1-Command Script)

To run the complete automated browser test suite (verifying backend APIs, cell clicks, modal portals, and highlights):

```bash
cd frontend
node scripts/test_s2_s4_s5_e2e.mjs
```

Expected output:
```text
════════════════════════════════════════════════════════════
📊 RESULTS: 25 PASSED / 0 FAILED / 25 TOTAL
════════════════════════════════════════════════════════════
✅ ALL TESTS PASSING
```

---

## 5. Troubleshooting

* **Port 8000 already in use?**
  ```bash
  lsof -ti :8000 | xargs kill -9
  ```
* **Port 3000 already in use?**
  ```bash
  lsof -ti :3000 | xargs kill -9
  ```
