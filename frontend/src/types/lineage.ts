export type AuditStatus = 'verified' | 'review_required' | 'unmatched';

export type DocumentCategory =
  | 'bank_statement'
  | 'k1'
  | 'portfolio_statement'
  | 'notice'
  | 'other';

export interface BoundingBox {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

export interface LineageInput {
  input_cell: string;
  source_document: string;
  doc_id: string;
  page_number: number;
  extracted_value: number | string;
  verbatim_quote: string;
  bounding_box?: BoundingBox;
}

export interface CellLineage {
  cell_id: string;
  metric_name: string;
  calculated_value: number | string;
  formula_display: string;
  status: AuditStatus;
  inputs: LineageInput[];
  notes?: string;
  tie_out_delta?: number;
}

export interface DocumentMeta {
  doc_id: string;
  filename: string;
  url: string;
  page_count: number;
  category: DocumentCategory;
  upload_date?: string;
  file_size?: number;
}

export interface SheetLineageResponse {
  sheet_id: string;
  sheet_name: string;
  documents: DocumentMeta[];
  cells: Record<string, CellLineage>;
  fortune_sheet_data?: FortuneSheetData[];
}

export interface FortuneCellData {
  v?: string | number;
  m?: string | number;
  f?: string;
  bg?: string;
  fc?: string;
  bl?: number;
  it?: number;
  fs?: number;
  ff?: string;
  tb?: number;
  ct?: { fa?: string; t?: string };
  [key: string]: unknown;
}

export interface FortuneSheetData {
  name: string;
  id?: string;
  order?: number;
  status?: number;
  celldata?: Array<{
    r: number;
    c: number;
    v: FortuneCellData | null;
  }>;
  data?: Array<Array<FortuneCellData | null>>;
  rowCount?: number;
  columnCount?: number;
  hide?: number;
  [key: string]: unknown;
}
