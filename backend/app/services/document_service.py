import os
import json
import uuid
import shutil
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.core.config import settings
from app.core.security import sanitize_filename, validate_file_extension
from app.models.models import Document, Finding
from app.detectors.presidio_engine import presidio_engine
from app.detectors.spacy_engine import spacy_engine
from app.detectors.merger import merge_findings
from app.documents.pdf_parser import pdf_parser
from app.documents.pdf_redactor import pdf_redactor
from app.documents.docx_parser import docx_parser
from app.documents.text_parser import text_parser
from app.documents.image_parser import image_parser
from app.anonymization.transformer import redaction_transformer
from app.services.risk_engine import risk_engine
from app.services.audit_service import audit_service
from app.services.policy_service import policy_service

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    def ingest_and_analyze(
        db: Session,
        upload_file: UploadFile,
        policy_id: str = "policy_default",
        ip_address: str = "127.0.0.1"
    ) -> Document:
        """
        Full ingestion pipeline: Upload -> Parse -> OCR (if needed) -> Detect PII -> Score Risk -> Persist.
        """
        original_name = upload_file.filename or "unnamed_document"
        clean_name = sanitize_filename(original_name)
        ext = validate_file_extension(clean_name)

        doc_id = str(uuid.uuid4())
        stored_filename = f"{doc_id}_{clean_name}"
        stored_path = settings.UPLOAD_DIR / stored_filename

        # Save uploaded file
        try:
            with open(stored_path, "wb") as f:
                content = upload_file.file.read()
                if len(content) > settings.MAX_FILE_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB")
                f.write(content)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to store file: {e}")
            raise HTTPException(status_code=500, detail="Could not store document safely")

        file_size = os.path.getsize(stored_path)
        mime_type = upload_file.content_type or "application/octet-stream"

        # Create initial Document record
        doc_record = Document(
            id=doc_id,
            filename=stored_filename,
            original_name=original_name,
            mime_type=mime_type,
            file_size=file_size,
            status="PROCESSING"
        )
        db.add(doc_record)
        db.commit()

        audit_service.log_event(
            db=db,
            action="DOCUMENT_UPLOADED",
            severity="INFO",
            document_id=doc_id,
            document_name=original_name,
            details={"file_size": file_size, "mime_type": mime_type},
            ip_address=ip_address
        )

        # Parse document
        extracted_text = ""
        page_count = 1
        is_scanned = False
        ocr_applied = False
        pages_meta = []

        try:
            if ext == ".pdf":
                pdf_res = pdf_parser.parse(stored_path, doc_id)
                page_count = pdf_res["page_count"]
                extracted_text = pdf_res["text"]
                pages_meta = pdf_res["pages"]
                is_scanned = pdf_res["is_scanned"]
                
                # If scanned PDF, run OCR on rendered page previews
                if is_scanned:
                    ocr_applied = True
                    audit_service.log_event(
                        db=db,
                        action="OCR_TRIGGERED",
                        severity="INFO",
                        document_id=doc_id,
                        document_name=original_name,
                        details={"reason": "Scanned PDF detected with low selectable text density"},
                        ip_address=ip_address
                    )
                    ocr_text_parts = []
                    for p in pages_meta:
                        preview_file = settings.PREVIEW_DIR / doc_id / f"page_{p['page']}.png"
                        if preview_file.exists():
                            ocr_res = image_parser.parse(preview_file, f"{doc_id}_{p['page']}")
                            p["words"] = ocr_res.get("words", [])
                            ocr_text_parts.append(ocr_res["text"])
                    if ocr_text_parts:
                        extracted_text = "\n".join(ocr_text_parts)

            elif ext == ".docx":
                docx_res = docx_parser.parse(stored_path)
                extracted_text = docx_res["text"]
                page_count = 1

            elif ext == ".txt":
                txt_res = text_parser.parse(stored_path)
                extracted_text = txt_res["text"]
                page_count = 1

            elif ext in (".png", ".jpg", ".jpeg"):
                ocr_applied = True
                img_res = image_parser.parse(stored_path, doc_id)
                extracted_text = img_res["text"]
                page_count = 1
                is_scanned = True
                pages_meta = img_res["pages"]

        except Exception as e:
            logger.error(f"Document parsing error for {doc_id}: {e}")
            doc_record.status = "FAILED"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

        # Run multi-engine PII detection
        policy = policy_service.get_policy(db, policy_id)
        allowed_entities = policy["config"].get("entities") if policy else None
        min_conf = policy["config"].get("min_confidence", 0.4) if policy else 0.4

        presidio_findings = presidio_engine.analyze(
            text=extracted_text,
            entities=allowed_entities,
            score_threshold=min_conf
        )
        spacy_findings = spacy_engine.analyze(extracted_text)

        # Merge & deduplicate
        all_raw_findings = presidio_findings + spacy_findings
        merged_findings = merge_findings(all_raw_findings)

        # Filter by policy
        if allowed_entities:
            merged_findings = [f for f in merged_findings if f["entity_type"] in allowed_entities]
        merged_findings = [f for f in merged_findings if f["confidence"] >= min_conf]

        # Calculate Risk Score
        risk_score, risk_level, risk_factors = risk_engine.calculate_risk(merged_findings, page_count)

        # Associate bounding boxes and pages where available
        for f in merged_findings:
            # Determine page if available in text markers
            page_num = 1
            if "--- Page " in extracted_text[:f["start_char"]]:
                parts = extracted_text[:f["start_char"]].split("--- Page ")
                try:
                    page_num = int(parts[-1].split(" ---")[0])
                except Exception:
                    page_num = 1

            finding_record = Finding(
                document_id=doc_id,
                entity_type=f["entity_type"],
                text=f["text"],
                confidence=f["confidence"],
                source=f["source"],
                page=page_num,
                start_char=f["start_char"],
                end_char=f["end_char"],
                bbox_json=json.dumps(f.get("bbox", [])),
                explanation=f.get("explanation", f"Detected {f['entity_type']} with {int(f['confidence']*100)}% confidence."),
                status="DETECTED",
                redaction_mode="BLACK_BOX"
            )
            db.add(finding_record)

        doc_record.page_count = page_count
        doc_record.extracted_text = extracted_text
        doc_record.is_scanned = is_scanned
        doc_record.ocr_applied = ocr_applied
        doc_record.risk_score = risk_score
        doc_record.risk_level = risk_level
        doc_record.status = "ANALYZED"

        db.commit()
        db.refresh(doc_record)

        audit_service.log_event(
            db=db,
            action="ANALYSIS_COMPLETED",
            severity="WARNING" if risk_level in ("HIGH", "CRITICAL") else "INFO",
            document_id=doc_id,
            document_name=original_name,
            details={
                "findings_count": len(merged_findings),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "policy": policy_id,
                "ocr_applied": ocr_applied
            },
            ip_address=ip_address
        )

        return doc_record

    @staticmethod
    def apply_redaction(
        db: Session,
        document_id: str,
        default_mode: str = "BLACK_BOX",
        finding_ids: Optional[List[str]] = None,
        custom_replacements: Optional[Dict[str, str]] = None,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        """
        Executes true redaction on the underlying document file based on selected mode.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        input_path = settings.UPLOAD_DIR / doc.filename
        if not input_path.exists():
            raise HTTPException(status_code=404, detail="Original document file not found on disk")

        # Query findings to redact
        query = db.query(Finding).filter(Finding.document_id == document_id)
        if finding_ids:
            query = query.filter(Finding.id.in_(finding_ids))
        else:
            # By default, redact all that are not REJECTED
            query = query.filter(Finding.status != "REJECTED")

        findings_records = query.all()
        if not findings_records:
            raise HTTPException(status_code=400, detail="No active findings to redact")

        # Prepare redactions payload
        findings_payload = []
        redaction_transformer.reset()

        for f in findings_records:
            mode = f.redaction_mode or default_mode
            custom_text = custom_replacements.get(f.id) if custom_replacements else None
            transformed_val = redaction_transformer.transform(
                text=f.text,
                entity_type=f.entity_type,
                mode=mode,
                custom_text=custom_text
            )
            f.status = "REDACTED"
            f.redacted_value = transformed_val
            findings_payload.append({
                "id": f.id,
                "text": f.text,
                "entity_type": f.entity_type,
                "page": f.page,
                "redaction_mode": mode,
                "redacted_value": transformed_val
            })

        # Generate output redacted filename
        ext = Path(doc.filename).suffix.lower()
        base_clean = Path(doc.original_name).stem
        redacted_filename = f"redacted_{doc.id[:8]}_{base_clean}{ext}"
        output_path = settings.REDACTED_DIR / redacted_filename

        applied_count = 0
        if ext == ".pdf":
            applied_count = pdf_redactor.redact(input_path, output_path, findings_payload)
            # Re-render previews of redacted PDF pages so frontend review workspace shows the redacted version!
            try:
                pdf_parser.parse(output_path, f"{doc.id}_redacted")
            except Exception as e:
                logger.warning(f"Could not re-render redacted preview: {e}")

        elif ext == ".docx":
            applied_count = docx_parser.redact(input_path, output_path, findings_payload)

        elif ext == ".txt":
            applied_count = text_parser.redact(input_path, output_path, findings_payload)

        elif ext in (".png", ".jpg", ".jpeg"):
            applied_count = image_parser.redact(input_path, output_path, findings_payload)

        doc.redacted_filename = redacted_filename
        doc.status = "REDACTED"
        db.commit()

        audit_service.log_event(
            db=db,
            action="REDACTION_APPLIED",
            severity="INFO",
            document_id=doc.id,
            document_name=doc.original_name,
            details={
                "redactions_count": len(findings_payload),
                "instances_scrubbed": applied_count,
                "mode": default_mode,
                "output_file": redacted_filename
            },
            ip_address=ip_address
        )

        return {
            "document_id": doc.id,
            "redacted_filename": redacted_filename,
            "redacted_count": len(findings_payload),
            "download_url": f"/api/documents/{doc.id}/download"
        }

document_service = DocumentService()
