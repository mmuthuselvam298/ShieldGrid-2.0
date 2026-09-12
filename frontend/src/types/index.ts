export type RedactionMode = 'BLACK_BOX' | 'MASKING' | 'ANONYMIZATION' | 'HASHING' | 'REPLACEMENT';

export type FindingStatus = 'DETECTED' | 'APPROVED' | 'REJECTED' | 'REDACTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Finding {
  id: string;
  document_id: string;
  entity_type: string;
  text: string;
  confidence: number;
  source: string;
  page: number;
  start_char: number;
  end_char: number;
  bbox_json?: string | null;
  status: FindingStatus;
  redaction_mode: RedactionMode;
  redacted_value?: string | null;
  explanation?: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  page_count: number;
  status: 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'REDACTED' | 'FAILED';
  risk_score: number;
  risk_level: RiskLevel;
  is_scanned: boolean;
  ocr_applied: boolean;
  redacted_filename?: string | null;
  findings_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentItem {
  findings: Finding[];
  extracted_text?: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  document_id?: string | null;
  document_name?: string | null;
  action: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details_json?: string | null;
  ip_address: string;
}

export interface PolicyConfig {
  entities: string[];
  min_confidence: number;
  auto_redact: boolean;
}

export interface PolicyItem {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  config_json: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  documents_processed: number;
  total_entities_detected: number;
  high_risk_documents: number;
  total_redactions_applied: number;
  average_confidence: number;
  ocr_usage_count: number;
  entity_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  recent_documents: DocumentItem[];
}

export interface DemoItem {
  id: string;
  name: string;
  format: string;
  description: string;
}
