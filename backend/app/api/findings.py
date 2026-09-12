from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Finding
from app.schemas.schemas import FindingResponse, FindingUpdate
from app.services.audit_service import audit_service

router = APIRouter(prefix="/findings", tags=["Findings"])

@router.put("/{finding_id}", response_model=FindingResponse)
def update_finding(
    finding_id: str,
    payload: FindingUpdate,
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if payload.status:
        finding.status = payload.status
    if payload.redaction_mode:
        finding.redaction_mode = payload.redaction_mode

    db.commit()
    db.refresh(finding)

    audit_service.log_event(
        db=db,
        action="FINDING_REVIEWED",
        severity="INFO",
        document_id=finding.document_id,
        details={
            "finding_id": finding.id,
            "entity_type": finding.entity_type,
            "new_status": finding.status,
            "new_mode": finding.redaction_mode
        }
    )

    return finding
