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

export type TieOutStatus = 'footed_and_tied' | 'discrepancy' | 'review_required';
export type BridgeType = 'consolidation' | 'vertical_footing' | 'intercompany_tieout' | 'exception_check';

export interface TieOutInput {
  cell_id: string;
  label: string;
  amount: number;
  source_doc?: string;
  page_number?: number;
  verbatim_quote?: string;
}

export interface TieOutBridge {
  bridge_id: string;
  name: string;
  target_cell: string;
  bridge_type: BridgeType;
  formula_display: string;
  expected_value: number;
  reported_value: number;
  delta: number;
  status: TieOutStatus;
  status_label: string;
  inputs: TieOutInput[];
  notes: string;
}

export interface TieOutDecoration {
  cell_id: string;
  status: TieOutStatus;
  icon: 'shield' | 'flag' | 'dot';
  badge_label: string;
  delta: number;
  bridge_id: string;
}

export interface TieOutReport {
  total_bridges: number;
  passed_bridges: number;
  flagged_bridges: number;
  accuracy_rate: number;
  total_unexplained_delta: number;
  simulated_discrepancy_active: boolean;
  bridges: TieOutBridge[];
  cell_decorations: Record<string, TieOutDecoration>;
}

