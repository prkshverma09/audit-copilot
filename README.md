# X-Ray Audit Copilot 🔍
### Autonomous Financial Data Lineage, Automated Multi-Fund Reconciliation & Character-Grounded PDF Audit Trail
> **Ylookup × Encode AI Hackathon — Product Track**  
> *Transforming the painful 7-turn fund administration review loop into an instant, verifiable, zero-hallucination audit.*

---

## ⚡ 1. Quick Start

Clone the repository:
```bash
git clone https://github.com/prkshverma09/audit-copilot.git
cd audit-copilot
```

You can run the project in **two ways**:

### Option A: Instant Evaluation (No API Key Required)
Runs offline using our built-in PDF coordinate extraction & automated reconciliation engine. Perfect for fast, zero-friction testing:
```bash
./run_docker.sh
```

---

### Option B: Live Google Gemini 2.5 AI Mode (With API Key)
Enables live **Google Gemini 2.5 Flash & Pro** multimodal PDF statement extraction:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
./run_docker.sh
```
*(Or create a `.env` file in the root directory containing `GEMINI_API_KEY=your_key`)*

---

*(Alternatively, to run natively without Docker: `./start_all.sh`)*

Once started, open your browser:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧭 2. How to Test the 2 User Flows

### Flow A: Load Demo Audit (Instant 1-Click Verification)
1. On the home screen (or top header), click the amber button: **`Load Demo Audit`**.
2. **What loads immediately:**
   - A complete 4-tab fund accounting workbook on the left:
     - **`Fund Cash Reconciliation`**: Primary cross-fund consolidation matrix.
     - **`Staging Sheet`**: Transaction-level detail across funds.
     - **`DIU (Journal Entries)`**: Balanced debit & credit accounting legs.
     - **`Chart of Accounts`**: Master fund accounting taxonomy.
   - The PDF statement viewer on the right.

---

### Flow B: Upload Statements & Run Audit
1. Click **`Upload Statements & Run Audit`** (or **`Upload PDFs`** in the top navigation).
2. Drag & drop (or select) any PDF bank statements from the repository:  
   📂 `Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements/`  
   *(e.g., select `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` and `20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf`)*
3. Click **`Run Audit Pipeline`**.
4. Watch the real-time AI pipeline extract transactions, compute cross-fund reconciliations, and dynamically build the multi-tab workbook from scratch.

---

## ✅ 3. How to Validate That the Audit Is Working

Once data is loaded in the sheet, test these 3 key verification features:

### 1. Click a Cell to Verify Live PDF Citation (Zero Hallucination)
- On the **`Fund Cash Reconciliation`** tab, click on cell **`C4`** (`€13,217,773.59`).
- **Look at the right panel:** The viewer automatically loads `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf`, navigates to **Page 1**, and **highlights the closing ledger balance in yellow**.
- Click cell **`D5`** (`€20,088.32`): It automatically switches to the Fund II statement PDF and highlights its balance on Page 1.
- Switch to the **`Staging Sheet`** tab or **`DIU (Journal Entries)`** tab and click any transaction row: it immediately navigates to and highlights that specific transaction inside the statement PDF.

### 2. Inspect the Automated Reconciliation Engine ("The Bridges")
- Select cell **`C6`** (Consolidated Cash Balance).
- Click the **`Reconciled: 3/4`** button in the top header (or click the green **`✓ Fully Reconciled`** pill in the formula ribbon).
- **The Reconciliation Modal opens and verifies:**
  - **Bridge 1 (Consolidation)**: `Fund I (€13.2M) + Fund II (€20k) = €13.26M` with **`€0.00 (Reconciled)`** delta.
  - **Bridge 2 (Intercompany Clearing)**: Fund I's `-€1.62` transfer is cleared by Fund II's two tranches (`€0.85 + €0.77`), verifying net-zero settlement.
  - **Bridge 3 (Vertical Footing)**: Opening balance (`€0.00`) + verified receipts = ending balance.

### 3. Check Audit Exception Quarantine
- In the modal (or on the sheet at row 13), look at cell **`C14`**:
- It is flagged with **`⚠️ Review Required`** because `€45,200.00` was booked in the ledger under `SUSPENSE-Q1`, but **no corresponding transaction appeared on the bank statement**.
- The copilot autonomously quarantined the unallocated wire and generated an auditor memo explaining why it needs investigation.

---

## 🎯 4. The Problem This Solves (Customer Interview Grounding)

In **Call 1: NAV Workflow Review with a Fund Manager** (`call-1-nav-workflow-review.pdf`), the fund manager explained that quarterly reporting takes **6 to 7 back-and-forth turns** with administrators because:
1. Managers cannot trust numbers without manually hunting through dozens of PDF statements.
2. Nobody checks whether numbers foot or balance before sending spreadsheets.

**X-Ray Audit Copilot** solves this by providing:
- **Instant proof of origin:** Every cell is linked to a character-grounded PDF highlight.
- **Automated mathematical bridges:** Verifying consolidation sums and intercompany settlements.
- **Automated discrepancy flags:** Highlighting unverified suspense items before they reach the client.

*(For full transcript analysis, see [CALL_TRANSCRIPT_ALIGNMENT.md](CALL_TRANSCRIPT_ALIGNMENT.md))*

---

## 🧪 Automated Test Suite (Optional)

Run our automated verification suites directly from your terminal:

```bash
# Test all backend APIs against real hackathon statement PDFs
./backend/.venv/bin/python backend/tests/test_all_apis_real_data.py

# Run headless browser interactive audit trail test (Playwright)
node frontend/scripts/test_interactive_audit_trail.mjs
```
