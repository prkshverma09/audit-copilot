import io
import re
from typing import Any, Dict, List, Optional
import pypdf

LEGAL_ENTITY_MAP = {
    "NI ABF I SCSP": "Nordvik Infrastructure Advanced Bioenergy Fund I SCSp",
    "NI ABF II SCSP": "Nordvik Infrastructure Advanced Bioenergy Fund II SCSp",
    "NI V SCSP": "Nordvik Infrastructure Fund V SCSp",
    "NI GMF II SCSP": "Nordvik Global Macro Fund II SCSp",
}

PROJECT_CODES = [
    ("CEPHALUS", "Cephalus", "Cephalus Biogas 001 Ltd"),
    ("ATRIA", "Atria", "Atria Energy Ltd"),
    ("IAPETUS", "Iapetus", "Iapetus Holdings"),
    ("WILLOWBANK", "Willowbank", "Willowbank Solar Ltd"),
    ("AZURITE", "Azurite", "Azurite Renewables Ltd"),
    ("MIZAR", "Mizar", "Mizar Clean Power Ltd"),
    ("BOREAS", "Boreas", "Boreas Wind Holdings"),
    ("GALENE", "Galene", "Galene Offshore Ltd"),
    ("TRENTBECK", "Trentbeck", "Trentbeck Audit / Operations"),
]


def extract_transactions_from_pdf(
    pdf_bytes: bytes,
    filename: str,
    doc_id: str
) -> Dict[str, Any]:
    """
    Extracts account header metadata and every transaction row directly from a statement PDF.
    """
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    num_pages = len(reader.pages)

    # 1. Page 1 Account Metadata
    p1_text = reader.pages[0].extract_text() if num_pages > 0 else ""
    acc_name_m = re.search(r"Account name\s*\n\s*(.+)", p1_text)
    acc_num_m = re.search(r"Account number\s*\n\s*(.+)", p1_text)
    curr_m = re.search(r"Currency\s*\n\s*(.+)", p1_text)
    bal_m = re.search(r"Current ledger balance\s*\n\s*([0-9,]+\.[0-9]{2})", p1_text) or re.search(
        r"Closing ledger balance brought forward\s*\n\s*([0-9,]+\.[0-9]{2})", p1_text
    )

    acc_name = acc_name_m.group(1).strip() if acc_name_m else "Fund Account"
    acc_num = acc_num_m.group(1).strip() if acc_num_m else ""
    currency = curr_m.group(1).strip() if curr_m else "EUR"
    closing_bal = float(bal_m.group(1).replace(",", "")) if bal_m else 0.0

    matched_entity = LEGAL_ENTITY_MAP.get(acc_name, acc_name)

    # 2. Iterate pages to extract transaction records
    transactions = []
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        i = 0
        while i < len(lines):
            if lines[i] == "Narrative" and i + 1 < len(lines):
                narrative = lines[i + 1]

                # Look backwards for date, amount, bank ref
                window = lines[max(0, i - 12): i]

                num_matches = []
                date_matches = []
                bank_ref = "NONREF"

                for w in window:
                    if re.match(r"^\d{1,2}\s+[A-Za-z]{3}\s+20\d\d$", w):
                        date_matches.append(w)
                    elif re.match(r"^-?[0-9,]+\.[0-9]{2}$", w):
                        num_matches.append(float(w.replace(",", "")))
                    elif re.match(r"^[0-9A-Z]{12}$", w) and w != "CLDRLULL":
                        bank_ref = w

                amount = num_matches[0] if num_matches else 0.0
                running_bal = num_matches[1] if len(num_matches) > 1 else (num_matches[0] if num_matches else 0.0)
                tx_date = date_matches[-1] if date_matches else "31 Mar 2026"

                # Categorize equity/loan/fees
                upper_narr = narrative.upper()
                eq_loan = "Other"
                if "EQUITY" in upper_narr or "SHARES" in upper_narr:
                    eq_loan = "Equity"
                elif "LOAN" in upper_narr or "ACC INT" in upper_narr or "INTEREST" in upper_narr:
                    eq_loan = "Loan"
                elif "SEPA" in upper_narr or "COMMISSION" in upper_narr or "CHARGES" in upper_narr:
                    eq_loan = "Bank Fees"

                # Match project
                project_code = ""
                deal_name = "ZZZ Operations " + currency
                for kw, pcode, dname in PROJECT_CODES:
                    if kw in upper_narr:
                        project_code = pcode
                        deal_name = dname
                        break

                if not project_code and eq_loan == "Bank Fees":
                    project_code = "OH - Bank Fees"

                # Transaction types
                if amount < 0:
                    cash_transtype = f"Cash - Disbursed - {currency}"
                    if eq_loan == "Bank Fees":
                        counter_transtype = "Expense - Bank Charges"
                    elif eq_loan == "Equity":
                        counter_transtype = "Cephalus Biogas 001 Ltd" if "CEPHALUS" in upper_narr else "Payable - Third Party"
                    else:
                        counter_transtype = "Payable - Third Party"
                else:
                    cash_transtype = f"Cash - Received - {currency}"
                    counter_transtype = "Cephalus Biogas 001 Ltd" if "CEPHALUS" in upper_narr else "Accounts Payable"

                transactions.append({
                    "doc_id": doc_id,
                    "filename": filename,
                    "page_number": page_idx + 1,
                    "account_name": acc_name,
                    "account_number": acc_num,
                    "matched_legal_entity": matched_entity,
                    "currency": currency,
                    "bank_reference": bank_ref,
                    "narrative": narrative,
                    "equity_loan": eq_loan,
                    "matched_project_code": project_code,
                    "deal_name": deal_name,
                    "amount": amount,
                    "running_balance": running_bal,
                    "date": tx_date,
                    "cash_transtype": cash_transtype,
                    "counterparty_transtype": counter_transtype,
                })
                i += 2
            else:
                i += 1

    return {
        "doc_id": doc_id,
        "filename": filename,
        "account_name": acc_name,
        "account_number": acc_num,
        "matched_legal_entity": matched_entity,
        "currency": currency,
        "closing_balance": closing_bal,
        "transactions": transactions,
    }


def build_dynamic_staging_and_diu_sheets(
    all_parsed_docs: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Builds FortuneSheet JSON configurations for Staging Sheet and DIU Journal Entries
    directly from dynamically parsed transactions across all uploaded statements.
    """
    # Aggregate all transactions across uploaded statements
    all_txs: List[Dict[str, Any]] = []
    for doc in all_parsed_docs:
        all_txs.extend(doc.get("transactions", []))

    # 1. BUILD STAGING SHEET
    staging_celldata = []
    staging_headers = [
        ("Account Name", 140),
        ("Account Number", 130),
        ("Matched Legal Entity", 240),
        ("Currency", 80),
        ("Bank Reference", 130),
        ("Narrative", 320),
        ("Equity/Loan", 100),
        ("Matched Project Code", 140),
        ("Amount", 120),
        ("Running Balance", 130),
        ("Cash Leg Transtype", 160),
        ("Counterparty Transtype", 160),
        ("Value Date", 100),
        ("Source Document", 160),
    ]

    staging_col_lens = {str(i): w for i, (_, w) in enumerate(staging_headers)}

    for col_idx, (hdr, _) in enumerate(staging_headers):
        staging_celldata.append({
            "r": 0,
            "c": col_idx,
            "v": {
                "v": hdr,
                "m": hdr,
                "bl": 1,
                "bg": "#0F172A",
                "fc": "#38BDF8",
                "fs": 11,
            }
        })

    for row_idx, tx in enumerate(all_txs, start=1):
        bg = "#F8FAFC" if row_idx % 2 == 1 else "#FFFFFF"
        amt = tx["amount"]
        bal = tx["running_balance"]

        row_vals = [
            tx["account_name"],
            tx["account_number"],
            tx["matched_legal_entity"],
            tx["currency"],
            tx["bank_reference"],
            tx["narrative"],
            tx["equity_loan"],
            tx["matched_project_code"],
            amt,
            bal,
            tx["cash_transtype"],
            tx["counterparty_transtype"],
            tx["date"],
            f"{tx['filename']} (p. {tx['page_number']})",
        ]

        for col_idx, val in enumerate(row_vals):
            cell_obj: Dict[str, Any] = {
                "fc": "#0F172A",
                "fs": 10,
                "bg": bg,
            }
            if isinstance(val, (int, float)):
                cell_obj.update({
                    "v": val,
                    "m": f"{val:,.2f}",
                    "ct": {"fa": "#,##0.00", "t": "n"},
                    "fc": "#047857" if val >= 0 else "#B91C1C",
                })
            else:
                s_val = str(val)
                cell_obj.update({"v": s_val, "m": s_val})

            staging_celldata.append({
                "r": row_idx,
                "c": col_idx,
                "v": cell_obj,
            })

    staging_sheet = {
        "name": "Staging Sheet",
        "id": "sheet_staging_transactions",
        "status": 0,
        "order": 1,
        "defaultColWidth": 130,
        "defaultRowHeight": 24,
        "rowCount": max(len(all_txs) + 5, 50),
        "columnCount": len(staging_headers),
        "config": {"columnlen": staging_col_lens},
        "celldata": staging_celldata,
    }

    # 2. BUILD DIU (JOURNAL ENTRIES) SHEET
    diu_celldata = []
    diu_headers = [
        ("Legal Entity", 240),
        ("Transaction Type", 180),
        ("Deal Name", 180),
        ("Position", 200),
        ("GL Date", 100),
        ("Effective Date", 100),
        ("Currency", 80),
        ("Debit", 120),
        ("Credit", 120),
        ("Narrative", 300),
        ("Source Ref", 140),
    ]
    diu_col_lens = {str(i): w for i, (_, w) in enumerate(diu_headers)}

    for col_idx, (hdr, _) in enumerate(diu_headers):
        diu_celldata.append({
            "r": 0,
            "c": col_idx,
            "v": {
                "v": hdr,
                "m": hdr,
                "bl": 1,
                "bg": "#0F172A",
                "fc": "#38BDF8",
                "fs": 11,
            }
        })

    diu_row = 1
    for tx in all_txs:
        amt = abs(tx["amount"])
        is_disbursed = tx["amount"] < 0
        date_str = tx["date"]

        # Leg 1: Cash Leg
        debit_1 = 0.0 if is_disbursed else amt
        credit_1 = amt if is_disbursed else 0.0
        bg_1 = "#F8FAFC" if diu_row % 2 == 1 else "#FFFFFF"

        leg_1_vals = [
            tx["matched_legal_entity"],
            tx["cash_transtype"],
            tx["deal_name"],
            f"{tx['deal_name']} (Admin Position)",
            date_str,
            date_str,
            tx["currency"],
            debit_1,
            credit_1,
            tx["narrative"],
            tx["bank_reference"],
        ]

        for col_idx, val in enumerate(leg_1_vals):
            cell_obj: Dict[str, Any] = {"fc": "#0F172A", "fs": 10, "bg": bg_1}
            if isinstance(val, (int, float)):
                cell_obj.update({
                    "v": val,
                    "m": f"{val:,.2f}" if val > 0 else "-",
                    "ct": {"fa": "#,##0.00", "t": "n"},
                })
            else:
                cell_obj.update({"v": str(val), "m": str(val)})
            diu_celldata.append({"r": diu_row, "c": col_idx, "v": cell_obj})

        diu_row += 1

        # Leg 2: Counterparty / Expense Leg
        debit_2 = amt if is_disbursed else 0.0
        credit_2 = 0.0 if is_disbursed else amt
        bg_2 = "#F8FAFC" if diu_row % 2 == 1 else "#FFFFFF"

        leg_2_vals = [
            tx["matched_legal_entity"],
            tx["counterparty_transtype"],
            tx["deal_name"],
            f"{tx['deal_name']} (Position)",
            date_str,
            date_str,
            tx["currency"],
            debit_2,
            credit_2,
            tx["narrative"],
            tx["bank_reference"],
        ]

        for col_idx, val in enumerate(leg_2_vals):
            cell_obj = {"fc": "#0F172A", "fs": 10, "bg": bg_2}
            if isinstance(val, (int, float)):
                cell_obj.update({
                    "v": val,
                    "m": f"{val:,.2f}" if val > 0 else "-",
                    "ct": {"fa": "#,##0.00", "t": "n"},
                })
            else:
                cell_obj.update({"v": str(val), "m": str(val)})
            diu_celldata.append({"r": diu_row, "c": col_idx, "v": cell_obj})

        diu_row += 1

    diu_sheet = {
        "name": "DIU (Journal Entries)",
        "id": "sheet_diu_journal_entries",
        "status": 0,
        "order": 2,
        "defaultColWidth": 130,
        "defaultRowHeight": 24,
        "rowCount": max(diu_row + 5, 60),
        "columnCount": len(diu_headers),
        "config": {"columnlen": diu_col_lens},
        "celldata": diu_celldata,
    }

    return [staging_sheet, diu_sheet]
