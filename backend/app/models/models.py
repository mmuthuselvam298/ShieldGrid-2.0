import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, default=1)
    status = Column(String(50), default="UPLOADED") # UPLOADED, PROCESSING, ANALYZED, REDACTED, FAILED
    risk_score = Column(Float, default=0.0) # 0 to 100
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    is_scanned = Column(Boolean, default=False)
    ocr_applied = Column(Boolean, default=False)
    extracted_text = Column(Text, nullable=True)
    redacted_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    findings = relationship("Finding", back_populates="document", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(100), nullable=False)
    text = Column(String(500), nullable=False)
    confidence = Column(Float, nullable=False)
    source = Column(String(50), nullable=False) # presidio, spacy, regex_india, ocr
    page = Column(Integer, default=1)
    start_char = Column(Integer, default=0)
    end_char = Column(Integer, default=0)
    bbox_json = Column(Text, nullable=True) # JSON list of bounding boxes [[x0, y0, x1, y1], ...]
    status = Column(String(50), default="DETECTED") # DETECTED, APPROVED, REJECTED, REDACTED
    redaction_mode = Column(String(50), default="BLACK_BOX") # BLACK_BOX, MASKING, ANONYMIZATION, HASHING, REPLACEMENT
    redacted_value = Column(String(500), nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    document = relationship("Document", back_populates="findings")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=utc_now)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    document_name = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    severity = Column(String(20), default="INFO") # INFO, WARNING, CRITICAL
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")

    document = relationship("Document", back_populates="audit_logs")

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False)
    config_json = Column(Text, nullable=False) # JSON specifying enabled entity types, min confidence, auto-redact
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
