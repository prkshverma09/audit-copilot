# X-Ray Audit Copilot — Demo Video Script
**Target Duration:** ~3 to 3.5 minutes  
**Hackathon Track:** Ylookup × Encode AI Hackathon — Product Track  

---

## Quick Setup Before Recording
1. **Frontend:** Open `http://localhost:3000` in Google Chrome (press `Cmd + Option + I` to close DevTools, use 100% or 110% zoom).
2. **Slides:** Open `presentation/index.html` in another browser tab and click **Fullscreen** (or press `F`).
3. **Pacing:** Move the mouse smoothly; pause 1 second after each click so the viewer registers the UI update.

---

## Scene 1: Problem & Solution (Slide Deck)
**Duration:** ~45 seconds  
**Where:** Presentation Slides (`presentation/index.html`)

### [0:00 - 0:20] Slide 1 — The Problem
* **On Screen:** Slide 1: *"The Problem: Manual Reconciliation"*
* **Spoken Script:**
  > "Hi everyone, I'm excited to introduce **X-Ray Audit Copilot**."
  > 
  > "In private capital and fund accounting, quarterly reconciliation is painful. Auditors spend over 70% of their reporting time manually checking spreadsheet cells against hundreds of pages of PDF bank statements."
  > 
  > "Formulas in Excel are completely disconnected from source documents, manual entry causes costly errors, and unallocated wires stay buried until year-end audits."

### [0:20 - 0:45] Slide 2 & 3 — Solution & Architecture
* **On Screen:** Press `Right Arrow` to advance to Slide 2 (*The Solution*), then Slide 3 (*Architecture*).
* **Spoken Script:**
  > "We built X-Ray Audit Copilot to solve this with three core engines:
  > First, **Google Gemini 2.5** extracts and classifies messy statement data into structured JSON with verbatim quotes.
  > Second, a **Deterministic Python AST Math Engine** recalculates every formula with zero hallucinations.
  > And third, **sub-millimeter PDF bounding boxes** give auditors instant click-to-source evidence."
  > 
  > *(Advance to Slide 3)*
  > "Here is our 4-stage pipeline: from raw ingestion to formula parsing, mathematical verification, and a live synchronized auditor interface."
  > 
  > "Let's jump straight into the live product."

---

## Scene 2: Live UI Demo — Ingestion & Workspace
**Duration:** ~2 minutes  
**Where:** Web Application (`http://localhost:3000`)

### [0:45 - 1:10] Step 1: Intake & Pipeline Stepper
* **On Screen Action:**
  1. Switch tab to `http://localhost:3000`.
  2. If on the landing/intake screen, click **"Upload Working Papers & Bank Statements"** (or **"Load Sample Portfolio Audit"**).
  3. Show the **7 staged documents** across 3 funds (*Apex Growth Fund*, *Beacon Venture Fund*, *Crestline Capital* + *Excel Master Working Paper*).
  4. Click **"Run Full Audit Pipeline"**.
  5. Point mouse to the **real-time 4-step progress stepper** as it progresses through Classification -> AST Parsing -> PDF BBox -> Ledger Population.
* **Spoken Script:**
  > "Here is the intake workspace. In a real audit, funds manage dozens of entities at once. Here we load our multi-fund working papers alongside raw bank and custodian statement PDFs."
  > 
  > "When we click 'Run Full Audit Pipeline', Gemini 2.5 classifies each statement and extracts key financial balances, while our backend parses formula dependencies."

---

### [1:10 - 1:40] Step 2: Instant Cell-to-PDF Lineage (Cell C4 & C6)
* **On Screen Action:**
  1. Once the workspace loads, you are on the **Primary Portfolio** sheet.
  2. Click cell **`C4`** ($1,250,000.00).
  3. Hover over the green **"Verified (Delta: $0.00)"** badge above the grid.
  4. Look at the right inspector panel: highlight the **Account**, **Statement Period**, and **Verbatim Quote**.
  5. Highlight the synchronized **PDF Viewer on the right**: show the **yellow bounding box** auto-scrolled directly over the bank statement amount!
  6. Next, click cell **`C6`** ($3,075,000.00) which has the formula `=C4+D5`.
  7. Point out the **Formula Dependency Tree** in the inspector: `C4 ($1,250,000) + D5 ($1,825,000) = C6`.
  8. Click **"Citation 1 (Apex Q4)"** then **"Citation 2 (Beacon Dec)"** in the right panel to show the PDF viewer switch documents and highlights instantly.
* **Spoken Script:**
  > "Now we're in the Auditor Workspace. On the left is our interactive spreadsheet; on the right is our synchronized PDF viewer."
  > 
  > "Clicking on cell C4 immediately verifies the balance. Notice how the PDF viewer automatically navigated to the exact page and highlighted the source figure in a sub-millimeter bounding box."
  > 
  > "When I select cell C6, our Python AST engine analyzes the formula: C4 plus D5 equals C6. The balance is validated with zero delta, and I can switch between citations with one click."

---

### [1:40 - 2:05] Step 3: Catching Exceptions & Suspense Reserves (Cell C14)
* **On Screen Action:**
  1. Scroll down the sheet and click cell **`C14`** ($45,200.00 - Suspense/Unallocated Wire).
  2. Show the amber badge: **"Review Required: Suspense / Unallocated"**.
  3. Show the inspector alert: warning that this deposit is unallocated and requires human review.
  4. Point to the PDF viewer showing the corresponding wire note in the source PDF.
* **Spoken Script:**
  > "Crucially, X-Ray Copilot doesn't just verify good data—it flags anomalies.
  > 
  > Look at row 14: a suspense reserve of $45,200. Our pipeline detected this unallocated wire and flagged it with an amber 'Review Required' badge, preventing an unverified variance from slipping into final reporting."

---

### [2:05 - 2:30] Step 4: Multi-Sheet & Cross-Fund Reconciliation
* **On Screen Action:**
  1. Click the sheet tab **"DIU Sub-Fund"** at the bottom/top of the spreadsheet to show multi-sheet support.
  2. Click cell **`C4`** in DIU Sub-Fund to show verified lineage.
  3. Click **"Cross-Fund Reconciliation"** button in the top navigation bar.
  4. Inside the modal, show the clean variance breakdown ($0.00 variance across funds).
  5. Toggle **"Simulate Discrepancy"** on: show how the modal instantly flags the mismatch with red variance indicators and visual warnings.
  6. Toggle it off and close the modal.
* **Spoken Script:**
  > "The copilot fully supports multi-fund portfolios. We can switch tabs between funds and working sheets with full lineage preserved."
  > 
  > "Opening the **Cross-Fund Reconciliation** modal gives us a bird's-eye view across all portfolio entities. If an error is introduced—which we can simulate here—the engine immediately flags the variance and identifies the offending leg."

---

## Scene 3: Tech Stack & Conclusion (Slide Deck)
**Duration:** ~30 seconds  
**Where:** Slide 4 (`presentation/index.html`)

### [2:30 - 3:00] Slide 4 — Tech Stack & Wrap-Up
* **On Screen Action:**
  1. Switch back to `presentation/index.html` and advance to **Slide 4** (*Technology & Deployment*).
* **Spoken Script:**
  > "Under the hood, X-Ray Audit Copilot is built on:
  > • **Google Gemini 2.5** for fast classification and structured multimodal extraction,
  > • **FastAPI & Python 3.11** for AST formula evaluation with sub-50 millisecond response times,
  > • **Next.js 14 & FortuneSheet** for a virtualized auditor spreadsheet,
  > • And single-command **Docker containerization** with `./run_docker.sh`."
  > 
  > "X-Ray Audit Copilot turns days of painful, manual audit cross-checking into seconds of verified, click-to-source clarity. Thank you!"

---

## Checklist for a Flawless Recording
- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Presentation opened and set to Fullscreen
- [ ] Audio mic test completed (no background noise)
- [ ] Clear browser cache / refresh page before starting recording
