from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    top: Optional[float] = Field(default=None, description="Top coordinate percentage or pt")
    left: Optional[float] = Field(default=None, description="Left coordinate percentage or pt")
    width: Optional[float] = Field(default=None, description="Width percentage or pt")
    height: Optional[float] = Field(default=None, description="Height percentage or pt")


class LineageInput(BaseModel):
    input_cell: str = Field(..., description="Grid coordinate for this input, e.g. 'A5'")
    source_document: str = Field(..., description="Original filename of the source PDF")
    doc_id: str = Field(..., description="Unique ID of the document")
    page_number: int = Field(default=1, ge=1, description="1-indexed PDF page where quote appears")
    extracted_value: Union[float, int, str] = Field(..., description="Extracted numerical or textual value")
    verbatim_quote: str = Field(..., description="Exact verbatim text string found in the source PDF")
    bounding_box: Optional[BoundingBox] = Field(default=None, description="Optional bounding box for quote")


class CellLineage(BaseModel):
    cell_id: str = Field(..., pattern=r"^[A-Z]+[0-9]+$", description="Spreadsheet cell coordinate, e.g. 'C5'")
    metric_name: str = Field(..., description="Name of financial KPI, e.g. 'Ending Cash Balance'")
    calculated_value: Union[float, int, str] = Field(..., description="Calculated or reconciled value")
    formula_display: str = Field(..., description="Human-readable formula, e.g. 'A5 + B5'")
    status: Literal["verified", "review_required", "unmatched"] = Field(
        default="verified", description="Audit verification status"
    )
    notes: Optional[str] = Field(default=None, description="Audit exception notes or reconciliation commentary")
    tie_out_delta: Optional[float] = Field(default=None, description="Optional tie-out delta value")
    inputs: List[LineageInput] = Field(default_factory=list, description="List of source inputs feeding into formula")


class DocumentMetadata(BaseModel):
    doc_id: str = Field(..., description="Unique document ID")
    filename: str = Field(..., description="File name of the uploaded document")
    url: str = Field(..., description="Download/streaming URL for the PDF")
    page_count: int = Field(default=1, ge=1, description="Total number of pages")
    category: Literal["bank_statement", "k1", "portfolio_statement", "notice", "other"] = Field(
        default="other", description="Classified document type"
    )
    entity_name: Optional[str] = Field(default=None, description="Fund or corporate entity identified")
    reporting_period: Optional[str] = Field(default=None, description="Reporting period, e.g. 'Q1 2026' or '2026-03-31'")
    file_size: Optional[int] = Field(default=None, description="File size in bytes")
    upload_date: Optional[str] = Field(default=None, description="Upload date string (YYYY-MM-DD)")


class UploadResponse(BaseModel):
    doc_ids: List[str] = Field(default_factory=list, description="List of assigned document IDs")
    filenames: List[str] = Field(default_factory=list, description="List of uploaded filenames")
    total_files: int = Field(default=0, description="Total number of uploaded files")
    documents: List[DocumentMetadata] = Field(default_factory=list, description="List of document metadata objects")


class FortuneSheetCellData(BaseModel):
    r: int = Field(..., ge=0, description="0-indexed row number")
    c: int = Field(..., ge=0, description="0-indexed column number")
    v: Dict[str, Any] = Field(..., description="FortuneSheet cell value object")


class SheetLineageResponse(BaseModel):
    sheet_id: str = Field(..., description="Identifier of the generated reconciliation sheet")
    sheet_name: str = Field(..., description="Display title of the sheet")
    documents: List[DocumentMetadata] = Field(default_factory=list, description="Underlying source documents")
    cells: Dict[str, CellLineage] = Field(
        default_factory=dict, description="Dictionary of cell_id -> CellLineage"
    )
    fortune_sheet_data: List[Dict[str, Any]] = Field(
        default_factory=list, description="Array of FortuneSheet workbook sheet objects ready for UI"
    )


class JobStatus(BaseModel):
    job_id: str = Field(..., description="Unique processing job ID")
    status: Literal["queued", "processing", "completed", "failed"] = Field(..., description="Processing status")
    progress: float = Field(default=0.0, ge=0.0, le=1.0, description="Progress fraction from 0.0 to 1.0")
    message: str = Field(default="", description="Current step status message")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    result: Optional[SheetLineageResponse] = Field(default=None, description="Completed lineage response")
