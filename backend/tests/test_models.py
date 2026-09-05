from app.models.lineage import (
    CellLineage,
    DocumentMetadata,
    LineageInput,
    SheetLineageResponse,
)


def test_lineage_models_validation():
    # Test LineageInput
    input_item = LineageInput(
        input_cell="A5",
        source_document="sample_statement.pdf",
        doc_id="doc_123",
        page_number=2,
        extracted_value=150000.0,
        verbatim_quote="Operating revenue for Q3 totaled $150,000"
    )
    assert input_item.input_cell == "A5"
    assert input_item.page_number == 2

    # Test CellLineage
    cell = CellLineage(
        cell_id="C5",
        metric_name="Net Asset Value",
        calculated_value=250000.0,
        formula_display="A5 + B5",
        status="verified",
        inputs=[input_item]
    )
    assert cell.cell_id == "C5"
    assert len(cell.inputs) == 1

    # Test DocumentMetadata
    doc_meta = DocumentMetadata(
        doc_id="doc_123",
        filename="sample_statement.pdf",
        url="/api/v1/documents/doc_123/file",
        page_count=3,
        category="bank_statement"
    )
    assert doc_meta.category == "bank_statement"

    # Test SheetLineageResponse
    response = SheetLineageResponse(
        sheet_id="sheet_nav_01",
        sheet_name="NAV Statement Reconciliation",
        documents=[doc_meta],
        cells={"C5": cell},
        fortune_sheet_data=[{"name": "Reconciliation", "celldata": []}]
    )
    assert "C5" in response.cells
    json_data = response.model_dump_json()
    assert "Net Asset Value" in json_data
