import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        severity: str = "INFO",
        document_id: Optional[str] = None,
        document_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: str = "127.0.0.1"
    ) -> AuditLog:
        """
        Record a privacy audit event without leaking sensitive PII payload.
        """
        # Ensure raw PII is stripped from details
        safe_details = {}
        if details:
            for k, v in details.items():
                if k.lower() in ("text", "raw_pii", "value", "password", "token", "ssn", "pan", "aadhaar"):
                    safe_details[k] = "[REDACTED_FROM_AUDIT]"
                else:
                    safe_details[k] = v

        entry = AuditLog(
            action=action,
            severity=severity,
            document_id=document_id,
            document_name=document_name,
            details_json=json.dumps(safe_details),
            ip_address=ip_address,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        logger.info(f"AUDIT [{severity}] {action} - Doc: {document_name or document_id}")
        return entry

audit_service = AuditService()
