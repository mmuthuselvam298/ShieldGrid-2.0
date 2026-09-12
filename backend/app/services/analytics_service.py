from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
from app.models.models import Document, Finding, AuditLog

class AnalyticsService:
    @staticmethod
    def get_dashboard_analytics(db: Session) -> Dict[str, Any]:
        docs = db.query(Document).all()
        findings = db.query(Finding).all()

        total_docs = len(docs)
        total_findings = len(findings)
        high_risk_docs = sum(1 for d in docs if d.risk_level in ("HIGH", "CRITICAL"))
        redactions_applied = sum(1 for f in findings if f.status == "REDACTED")
        ocr_count = sum(1 for d in docs if d.ocr_applied)

        # Average confidence
        avg_conf = 0.0
        if total_findings > 0:
            avg_conf = round(sum(f.confidence for f in findings) / total_findings, 2)

        # Entity distribution
        entity_dist = {}
        for f in findings:
            entity_dist[f.entity_type] = entity_dist.get(f.entity_type, 0) + 1

        # Risk distribution
        risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for d in docs:
            risk_dist[d.risk_level] = risk_dist.get(d.risk_level, 0) + 1

        # Source distribution
        source_dist = {}
        for f in findings:
            source_dist[f.source] = source_dist.get(f.source, 0) + 1

        recent_docs = db.query(Document).order_by(Document.created_at.desc()).limit(8).all()

        return {
            "documents_processed": total_docs,
            "total_entities_detected": total_findings,
            "high_risk_documents": high_risk_docs,
            "total_redactions_applied": redactions_applied,
            "average_confidence": avg_conf,
            "ocr_usage_count": ocr_count,
            "entity_distribution": entity_dist,
            "risk_distribution": risk_dist,
            "source_distribution": source_dist,
            "recent_documents": recent_docs
        }

analytics_service = AnalyticsService()
