# End-to-End Testing Guide

Simple step-by-step instructions to test **X-Ray Audit Copilot** end to end.

---

## 1. Start the App (2 Terminal Tabs)

### Terminal 1 — Backend
```bash
cd backend
python3 -m uvicorn app.main:app --port 8000 --reload
```
> Verify it's running: open [http://localhost:8000/health](http://localhost:8000/health) in your browser. You should see `{"status":"healthy"}`.

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
> Verify it's running: open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Option A: Automated E2E Test (1-Command)

Run our automated browser test script. It tests all backend APIs, clicks every cell, verifies highlights, and takes screenshots:

```bash
cd frontend
node scripts/test_s2_s4_s5_e2e.mjs
```

You should see:
```text
════════════════════════════════════════════════════════════
📊 RESULTS: 25 PASSED / 0 FAILED / 25 TOTAL
════════════════════════════════════════════════════════════
✅ ALL TESTS PASSING
```

---

## 3. Option B: Manual UI Test (5 Simple Clicks)

Open [http://localhost:3000](http://localhost:3000) in Chrome and try these 5 clicks:

### Click 1: Click Cell `C4` (Single Lineage)
* **What to do:** In the spreadsheet or top jump bar, click **`C4`**.
* **What you see:** 
  * Right pane displays the source citation: **€13,217,773.59**.
  * PDF viewer below jumps to **Page 1** and highlights the balance in yellow.

### Click 2: Click Cell `C6` (Multi-Document Formula & Switcher)
* **What to do:** Click **`C6`** in the jump bar.
* **What you see:**
  * Top bar shows the formula: `Sum: €13,217,773.59 (C4) + €20,088.32 (D5) = €13,237,861.91 (C6)`.
  * Inspector shows two side-by-side evidence cards for Fund I (`C4`) and Fund II (`D5`).
  * Click **"View in PDF"** on the `D5` card — the PDF viewer instantly switches to Fund II's statement and highlights its balance.

### Click 3: Click Cell `C14` (Audit Discrepancy & Exception)
* **What to do:** Click **`C14`** in the jump bar.
* **What you see:**
  * Cell C14 has an amber background and a warning icon (`€45,200.00 ⚠️`).
  * Inspector shows a big amber alert box: **`⚠️ AUDIT REVIEW FLAG / DISCREPANCY REASON`**.
  * Notes explain that the €45,200 suspense reserve is unsubstantiated in the PDF statements.

### Click 4: Click the "Tie-Outs: 3/4 Tied" Button (Mathematical Engine)
* **What to do:** Click **`Tie-Outs: 3/4 Tied`** in the top navigation header.
* **What you see:**
  * The **Automated Tie-Out & Footing Engine** modal opens.
  * Shows 4 mathematical bridges (Cash Footing, Consolidated Cash, Intercompany Net Tie-Out, Suspense Reserve).
  * Click **"Simulate Discrepancy Test"** — the screen updates live to show an injected €12,450 variance with an amber warning.

### Click 5: Check the Header Coverage Meter
* **What to do:** Look at the top bar.
* **What you see:**
  * **`94% Lineage Coverage`** (emerald badge).
  * **`17/18 Traced`** (number of cells verified).
  * **`⚠️ 1 Review`** (unmatched exception flag).

---

## 4. Troubleshooting

* **Port 8000 already in use?**
  ```bash
  lsof -ti :8000 | xargs kill -9
  ```
* **Port 3000 already in use?**
  ```bash
  lsof -ti :3000 | xargs kill -9
  ```
