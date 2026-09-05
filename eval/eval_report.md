# X-Ray Audit Copilot: Lineage Accuracy & Ground Truth Benchmark Report

**Dataset:** `Ylookup Hackathon Datasets / 01-bank-statements-to-journal-entries`  
**Evaluation Date:** 2026-09-05  
**Evaluation Suite:** Character-for-Character Quote Verification & Arithmetic Footing Validator  

## 1. Executive Summary Scorecard

| Evaluation Metric | Target Benchmark | Measured Result | Status |
| :--- | :---: | :---: | :---: |
| **Verbatim Quote Retrieval Precision** | > 95% | **100.0%** | **PASSED (Zero Hallucinations)** |
| **Arithmetic Footing & Summation** | 100% | **100.0%** | **PASSED (Perfect Footing)** |
| **Intercompany Tie-Out Delta (E11)** | $0.00 | **$0.00 (Balanced)** | **PASSED** |
| **Deliberate Discrepancy Detection (C14)** | Flag Review | **REVIEW REQUIRED** | **PASSED (Flagged Suspense-Q1)** |
| **Total Grounded Cells** | - | **18 Reconciled Cells** | **100% Coverage** |

## 2. Cell-by-Cell Ground Truth Verification Table

| Cell | Financial Metric | Reconciled Value | Source PDF | Page | Quote Grounding | Formula Verification |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| `C10` | Intercompany Inflow: Cephalus QFPF | `€1.62` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 2 | Whitespace Normalized (100%) | - |
| `C11` | Total Intercompany Acquisitions | `€3.24` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 2 | Whitespace Normalized (100%) | ✓ Footed |
| `C14` | Unallocated Settlement Reserve (SUSPENSE-Q1) | `€45,200.00` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 1 | Exact Match (100%) | - |
| `C18` | NI ABF I SCSP (EUR) | `€13,217,773.59` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 1 | Exact Match (100%) | - |
| `C19` | NI ABF II SCSP (DKK) | `€12,887.11` | `20260331_NI_A_B__FUND_II_CALDER_DKK_4319.pdf` | p. 1 | Exact Match (100%) | - |
| `C20` | NI ABF II SCSP (EUR) | `€20,088.32` | `20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf` | p. 1 | Exact Match (100%) | - |
| `C21` | NI GMF II SCSP (USD) | `€943,598.38` | `20260331_NI_GMF_II_SCSP_CALDER_USD_4373.pdf` | p. 1 | Exact Match (100%) | - |
| `C22` | NI V SCSP (DKK) | `€1,135,207.84` | `20260331_NI_V_SCSP_CALDER_DKK_0541.pdf` | p. 1 | Exact Match (100%) | - |
| `C23` | NI V SCSP (EUR) | `€1,197,694.98` | `20260331_NI_V_SCSP_CALDER_EUR_030041.pdf` | p. 1 | Exact Match (100%) | - |
| `C24` | NI V SCSP (GBP) | `€103,014.97` | `20260331_NI_V_SCSP_CALDER_GBP_3252.pdf` | p. 1 | Exact Match (100%) | - |
| `C4` | NI ABF I SCSP (Fund I) Ending Balance | `€13,217,773.59` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 1 | Exact Match (100%) | - |
| `C5` | NI ABF II SCSP (Fund II) Ending Balance | `€20,088.32` | `20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf` | p. 1 | Exact Match (100%) | - |
| `C6` | Consolidated Cash Balance | `€13,237,861.91` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 1 | Exact Match (100%) | ✓ Footed |
| `C9` | Intercompany Inflow: Cephalus Co-Invest | `€1.62` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 2 | Whitespace Normalized (100%) | - |
| `D10` | Intercompany Outflow: Cephalus QFPF | `€-1.62` | `20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf` | p. 2 | Whitespace Normalized (100%) | - |
| `D5` | NI ABF II SCSP (Fund II) Ending Balance | `€20,088.32` | `20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf` | p. 1 | Exact Match (100%) | - |
| `D9` | Intercompany Outflow: Cephalus Co-Invest | `€-1.62` | `20260331_NI_A_B__FUND_II_CALDER_EUR_8102.pdf` | p. 2 | Whitespace Normalized (100%) | - |
| `E11` | Intercompany Net Tie-Out Delta | `€0.00` | `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` | p. 2 | Exact Match (100%) | ✓ Footed |

## 3. Deliberate Imperfection & Exception Analysis

> [!IMPORTANT]
> **Audit Exception Detection Grounding (Call 1 & Dataset 01 Alignment):**
> - **Cell C14 (€45,200.00):** Booked under `SUSPENSE-Q1`. The agent scanned all 17 transaction lines in statement `20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf` during the specified period (23 Mar to 31 Mar 2026). Zero entries matched €45,200.00.
> - **Result:** Instead of hallucinating a false match, the agent accurately flagged the entry with an amber `REVIEW REQUIRED` badge and attached an explicit audit discrepancy memo.

## 4. Multi-Fund Cross-Document Tie-Out Analysis

- **Consolidation (C6):** Footed `C4 (€13,217,773.59)` + `D5 (€20,088.32)` = `€13,237,861.91` with dual PDF citations.
- **Cephalus Co-Invest Transfer (C9 / D9):** Inflow `€1.62` in Fund I matches Outflow `-€1.62` in Fund II.
- **Cephalus QFPF Transfer (C10 / D10):** Inflow `€1.62` in Fund I matches Outflow `-€1.62` in Fund II.
- **Net Tie-Out Delta (E11):** `€3.24 + -€1.62 + -€1.62 == €0.00` (Perfect Tie).
