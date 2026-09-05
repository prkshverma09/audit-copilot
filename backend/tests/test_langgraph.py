import os
import pytest
from app.graph.workflow import run_audit_pipeline
from app.storage.s3_adapter import storage_adapter


@pytest.mark.asyncio
async def test_langgraph_pipeline_with_real_pdf():
    # Load real statement PDF from Ylookup Hackathon Datasets
    dataset_path = os.path.abspath(
        "../Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"
    )
    if not os.path.exists(dataset_path):
        # Fallback path if run from project root
        dataset_path = os.path.abspath(
            "Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements/20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"
        )

    assert os.path.exists(dataset_path), f"Dataset file not found at {dataset_path}"

    with open(dataset_path, "rb") as f:
        pdf_bytes = f.read()

    # Stage the document in storage adapter
    doc_meta = storage_adapter.save_file(
        filename="20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf",
        content=pdf_bytes
    )

    # Run LangGraph pipeline
    result = await run_audit_pipeline(document_ids=[doc_meta.doc_id])

    assert result.sheet_id is not None
    assert len(result.documents) == 1
    assert result.documents[0].filename == "20260331_NI_ABF_I_SCSP_CALDER_EUR_0894.pdf"
    
    # Check that cells were extracted
    assert len(result.cells) > 0

    # Verify cell structure
    for cell_id, cell in result.cells.items():
        assert cell.cell_id == cell_id
        assert cell.metric_name != ""
        assert cell.status in ["verified", "review_required", "unmatched"]
        if cell.inputs:
            for inp in cell.inputs:
                assert inp.verbatim_quote != ""
                assert inp.page_number >= 1

    # Fund I cell C4 must have verified input from the provided statement
    assert "C4" in result.cells
    assert len(result.cells["C4"].inputs) > 0
    assert result.cells["C4"].inputs[0].verbatim_quote != ""

    # Verify FortuneSheet data was populated
    assert len(result.fortune_sheet_data) > 0
    sheet = result.fortune_sheet_data[0]
    assert "celldata" in sheet
    assert len(sheet["celldata"]) > 0
