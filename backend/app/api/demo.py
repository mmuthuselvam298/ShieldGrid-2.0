import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.datastructures import UploadFile
import io
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.schemas import DocumentResponse
from app.models.models import Finding
from app.services.document_service import document_service
from app.core.config import settings

router = APIRouter(prefix="/demo", tags=["Demo"])

DEMO_MAP = {
    "kyc": {
        "file": "synthetic_kyc_record.pdf",
        "mime": "application/pdf",
        "policy": "policy_india_privacy"
    },
    "invoice": {
        "file": "synthetic_medical_invoice.pdf",
        "mime": "application/pdf",
        "policy": "policy_financial"
    },
    "resume": {
        "file": "synthetic_executive_resume.pdf",
        "mime": "application/pdf",
        "policy": "policy_default"
    },
    "scanned_id": {
        "file": "synthetic_scanned_id.png",
        "mime": "image/png",
        "policy": "policy_india_privacy"
    },
    "access_log": {
        "file": "synthetic_access_log.txt",
        "mime": "text/plain",
        "policy": "policy_strict"
    }
}

@router.get("/list")
def list_available_demos():
    """List available synthetic demo documents."""
    return [
        {"id": "kyc", "name": "Synthetic India Citizen KYC Record", "format": "PDF", "description": "Features PAN, Aadhaar, Indian Phone, IFSC, Address, Name."},
        {"id": "invoice", "name": "Synthetic Hospital Encounter & Bill", "format": "PDF", "description": "Features Patient PHI, Credit Card, Dollar amounts, Doctor name."},
        {"id": "resume", "name": "Synthetic Executive Cybersecurity Resume", "format": "PDF", "description": "Features Email, Phone, Location, IP Address, URL."},
        {"id": "scanned_id", "name": "Synthetic Scanned Citizen Card (OCR)", "format": "PNG", "description": "Scanned bitmap image exercising Tesseract OCR & bounding boxes."},
        {"id": "access_log", "name": "Synthetic System Access Trail", "format": "TXT", "description": "Server log file with IP addresses, operator credentials, and cards."}
    ]

@router.post("/load/{demo_id}", response_model=DocumentResponse)
def load_synthetic_demo(
    demo_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Instantly ingest one of the pre-built synthetic documents for one-click testing.
    """
    if demo_id not in DEMO_MAP:
        raise HTTPException(status_code=404, detail=f"Unknown demo '{demo_id}'. Choose from: {list(DEMO_MAP.keys())}")

    demo_info = DEMO_MAP[demo_id]
    file_path = settings.DEMO_DIR / demo_info["file"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Synthetic demo file missing from disk")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    upload = UploadFile(
        file=io.BytesIO(file_bytes),
        filename=demo_info["file"],
        headers={"content-type": demo_info["mime"]}
    )

    ip_addr = request.client.host if request.client else "127.0.0.1"
    doc = document_service.ingest_and_analyze(
        db=db,
        upload_file=upload,
        policy_id=demo_info["policy"],
        ip_address=ip_addr
    )

    findings_count = db.query(Finding).filter(Finding.document_id == doc.id).count()
    resp = DocumentResponse.model_validate(doc)
    resp.findings_count = findings_count
    return resp
