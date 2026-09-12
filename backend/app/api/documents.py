import os
import io
import zipfile
import shutil
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Document, Finding
from app.schemas.schemas import (
    DocumentResponse,
    DocumentDetailResponse,
    RedactionRequest,
    RedactionResponse
)
from app.services.document_service import document_service
from app.services.audit_service import audit_service
from app.core.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    request: Request,
    file: UploadFile = File(...),
    policy_id: str = Form("policy_default"),
    db: Session = Depends(get_db)
):
    """
    Upload and analyze document via ingestion pipeline.
    """
    ip_addr = request.client.host if request.client else "127.0.0.1"
    doc = document_service.ingest_and_analyze(
        db=db,
        upload_file=file,
        policy_id=policy_id,
        ip_address=ip_addr
    )
    # Calculate findings count
    findings_count = db.query(Finding).filter(Finding.document_id == doc.id).count()
    resp = DocumentResponse.model_validate(doc)
    resp.findings_count = findings_count
    return resp

@router.post("/batch-upload", response_model=List[DocumentResponse])
def batch_upload_documents(
    request: Request,
    files: List[UploadFile] = File(...),
    policy_id: str = Form("policy_default"),
    db: Session = Depends(get_db)
):
    """
    Batch upload multiple documents for processing.
    """
    ip_addr = request.client.host if request.client else "127.0.0.1"
    results = []
    for file in files:
        try:
            doc = document_service.ingest_and_analyze(
                db=db,
                upload_file=file,
                policy_id=policy_id,
                ip_address=ip_addr
            )
            findings_count = db.query(Finding).filter(Finding.document_id == doc.id).count()
            resp = DocumentResponse.model_validate(doc)
            resp.findings_count = findings_count
            results.append(resp)
        except Exception as e:
            # Continue with other files on failure
            continue
    return results

@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """
    List all uploaded documents with status and risk score.
    """
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        findings_count = db.query(Finding).filter(Finding.document_id == d.id).count()
        resp = DocumentResponse.model_validate(d)
        resp.findings_count = findings_count
        results.append(resp)
    return results

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """
    Retrieve document details, extracted text, and sensitive findings.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    findings = db.query(Finding).filter(Finding.document_id == document_id).all()
    findings_count = len(findings)
    resp = DocumentDetailResponse.model_validate(doc)
    resp.findings = findings
    resp.findings_count = findings_count
    return resp

@router.get("/{document_id}/preview/{page_num}")
def get_document_preview(document_id: str, page_num: int):
    """
    Serve high-resolution rendered page preview image.
    """
    # Check redacted preview first if exists
    redacted_preview = settings.PREVIEW_DIR / f"{document_id}_redacted" / f"page_{page_num}.png"
    if redacted_preview.exists():
        return FileResponse(str(redacted_preview), media_type="image/png")

    preview_path = settings.PREVIEW_DIR / document_id / f"page_{page_num}.png"
    if not preview_path.exists():
        # Fallback to page 1
        preview_path = settings.PREVIEW_DIR / document_id / "page_1.png"

    if not preview_path.exists():
        raise HTTPException(status_code=404, detail="Preview not available for this page")

    return FileResponse(str(preview_path), media_type="image/png")

@router.post("/{document_id}/redact", response_model=RedactionResponse)
def redact_document(
    document_id: str,
    payload: RedactionRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Apply permanent, irreversible redactions to the document.
    """
    ip_addr = request.client.host if request.client else "127.0.0.1"
    result = document_service.apply_redaction(
        db=db,
        document_id=document_id,
        default_mode=payload.default_mode,
        finding_ids=payload.finding_ids,
        custom_replacements=payload.custom_replacements,
        ip_address=ip_addr
    )
    return result

@router.get("/{document_id}/download")
def download_sanitized_document(document_id: str, db: Session = Depends(get_db)):
    """
    Download the sanitized and redacted document.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.redacted_filename:
        raise HTTPException(status_code=404, detail="Redacted document not found. Please apply redaction first.")

    file_path = settings.REDACTED_DIR / doc.redacted_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sanitized file not found on disk")

    audit_service.log_event(
        db=db,
        action="DOCUMENT_EXPORTED",
        severity="INFO",
        document_id=doc.id,
        document_name=doc.original_name,
        details={"redacted_file": doc.redacted_filename}
    )

    return FileResponse(
        str(file_path),
        filename=doc.redacted_filename,
        media_type=doc.mime_type
    )

@router.delete("/{document_id}")
def delete_document(document_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Securely delete document, original file, redacted file, and preview images.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ip_addr = request.client.host if request.client else "127.0.0.1"
    doc_name = doc.original_name

    # Remove files
    try:
        orig_file = settings.UPLOAD_DIR / doc.filename
        if orig_file.exists():
            orig_file.unlink()

        if doc.redacted_filename:
            redacted_file = settings.REDACTED_DIR / doc.redacted_filename
            if redacted_file.exists():
                redacted_file.unlink()

        preview_dir = settings.PREVIEW_DIR / doc.id
        if preview_dir.exists():
            shutil.rmtree(str(preview_dir))

        redacted_preview_dir = settings.PREVIEW_DIR / f"{doc.id}_redacted"
        if redacted_preview_dir.exists():
            shutil.rmtree(str(redacted_preview_dir))
    except Exception as e:
        pass

    db.delete(doc)
    db.commit()

    audit_service.log_event(
        db=db,
        action="DOCUMENT_DELETED",
        severity="INFO",
        document_id=document_id,
        document_name=doc_name,
        details={"status": "All storage assets purged"},
        ip_address=ip_addr
    )

    return {"status": "success", "message": f"Document '{doc_name}' and all associated assets purged."}

@router.get("/export/batch-zip")
def export_batch_zip(db: Session = Depends(get_db)):
    """
    Export all currently sanitized documents as a consolidated ZIP archive.
    """
    redacted_docs = db.query(Document).filter(Document.status == "REDACTED").all()
    if not redacted_docs:
        raise HTTPException(status_code=400, detail="No redacted documents found for batch export")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for doc in redacted_docs:
            if doc.redacted_filename:
                file_path = settings.REDACTED_DIR / doc.redacted_filename
                if file_path.exists():
                    zip_file.write(file_path, arcname=doc.redacted_filename)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=shieldgrid_sanitized_batch.zip"}
    )
