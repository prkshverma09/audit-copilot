import pytest
from app.core.tieout_engine import evaluate_tieouts
from app.models.lineage import SheetLineageResponse, CellLineage, LineageInput


def test_tieout_engine_evaluation():
    mock_lineage = SheetLineageResponse(
        sheet_id="sheet_test",
        sheet_name="Test Reconciliation",
        documents=[],
        cells={
            "C4": CellLineage(
                cell_id="C4",
                metric_name="Fund I Ending Cash",
                calculated_value=13243300.91,
                formula_display="A4 + B4",
                status="verified",
            ),
            "D5": CellLineage(
                cell_id="D5",
                metric_name="Fund II Ending Cash",
                calculated_value=20000.00,
                formula_display="A5 + B5",
                status="verified",
            ),
            "C6": CellLineage(
                cell_id="C6",
                metric_name="Consolidated Cash",
                calculated_value=13263300.91,
                formula_display="C4 + D5",
                status="verified",
            ),
            "C11": CellLineage(
                cell_id="C11",
                metric_name="Cephalus Inflow Total",
                calculated_value=-1.62,
                formula_display="-Sum(C9, C10)",
                status="verified",
            ),
            "D9": CellLineage(
                cell_id="D9",
                metric_name="Tranche A Settlement",
                calculated_value=0.85,
                formula_display="Bank Stmt 0923",
                status="verified",
            ),
            "D10": CellLineage(
                cell_id="D10",
                metric_name="Tranche B Settlement",
                calculated_value=0.77,
                formula_display="Bank Stmt 0923",
                status="verified",
            ),
            "E11": CellLineage(
                cell_id="E11",
                metric_name="Intercompany Net Settlement",
                calculated_value=0.00,
                formula_display="C11 + D9 + D10 == 0.00",
                status="verified",
            ),
            "C14": CellLineage(
                cell_id="C14",
                metric_name="Suspense Reserve",
                calculated_value=45200.00,
                formula_display="SUSPENSE-Q1 Reserve",
                status="review_required",
            ),
        },
    )

    report = evaluate_tieouts(mock_lineage, simulate_discrepancy=False)
    assert report.total_bridges == 4
    assert report.passed_bridges == 3
    assert report.flagged_bridges == 1  # Suspense reserve is review_required
    assert report.total_unexplained_delta == 0.00
    assert "C6" in report.cell_decorations
    assert report.cell_decorations["C6"].status == "footed_and_tied"
    assert report.cell_decorations["C6"].icon == "shield"
    assert "E11" in report.cell_decorations
    assert report.cell_decorations["E11"].status == "footed_and_tied"
    assert report.cell_decorations["C14"].status == "review_required"
    assert report.cell_decorations["C14"].icon == "flag"


def test_tieout_engine_simulated_discrepancy():
    mock_lineage = SheetLineageResponse(
        sheet_id="sheet_test",
        sheet_name="Test Reconciliation",
        documents=[],
        cells={},
    )
    report = evaluate_tieouts(mock_lineage, simulate_discrepancy=True)
    assert report.simulated_discrepancy_active is True
    # Bridge 1 should now be flagged as a discrepancy
    bridge_1 = next(b for b in report.bridges if b.bridge_id == "bridge_fund_consolidation")
    assert bridge_1.status == "discrepancy"
    assert bridge_1.delta == 12450.00
    assert report.cell_decorations["C6"].status == "discrepancy"
    assert report.cell_decorations["C6"].icon == "flag"
