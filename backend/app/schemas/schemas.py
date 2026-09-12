from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class FindingBase(BaseModel):
    entity_type: str
    text: str
    confidence: float
    source: str
    page: int = 1
    start_char: int = 0
    end_char: int = 0
    bbox_json: Optional[str] = None
    status: str = "DETECTED"
    redaction_mode: str = "BLACK_BOX"
    redacted_value: Optional[str] = None
    explanation: Optional[str] = None

class FindingResponse(FindingBase):
    id: str
    document_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class FindingUpdate(BaseModel):
    status: Optional[str] = None # APPROVED, REJECTED, REDACTED
    redaction_mode: Optional[str] = None # BLACK_BOX, MASKING, ANONYMIZATION, HASHING, REPLACEMENT

class DocumentBase(BaseModel):
    original_name: str
    mime_type: str
    file_size: int
    page_count: int = 1

class DocumentResponse(DocumentBase):
    id: str
    filename: str
    status: str
    risk_score: float
    risk_level: str
    is_scanned: bool
    ocr_applied: bool
    redacted_filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    findings_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    findings: List[FindingResponse] = []
    extracted_text: Optional[str] = None

class RedactionRequest(BaseModel):
    default_mode: str = "BLACK_BOX"
    finding_ids: Optional[List[str]] = None # If None or empty, redact all approved/detected
    custom_replacements: Optional[Dict[str, str]] = None

class RedactionResponse(BaseModel):
    document_id: str
    redacted_filename: str
    redacted_count: int
    download_url: str

class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    action: str
    severity: str
    details_json: Optional[str] = None
    ip_address: str

    class Config:
        from_attributes = True

class PolicyBase(BaseModel):
    id: str
    name: str
    description: str
    is_default: bool = False
    config_json: str

class PolicyResponse(PolicyBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RiskScoreBreakdown(BaseModel):
    score: float
    level: str
    factors: List[Dict[str, Any]]

class AnalyticsResponse(BaseModel):
    documents_processed: int
    total_entities_detected: int
    high_risk_documents: int
    total_redactions_applied: int
    average_confidence: float
    ocr_usage_count: int
    entity_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    source_distribution: Dict[str, int]
    recent_documents: List[DocumentResponse]
