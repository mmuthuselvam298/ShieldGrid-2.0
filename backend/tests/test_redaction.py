import os
from pathlib import Path
import fitz # PyMuPDF
import pytest
from app.documents.pdf_redactor import pdf_redactor

def test_true_irreversible_pdf_redaction(tmp_path):
    # 1. Create a genuine test PDF containing sensitive strings
    original_pdf_path = tmp_path / "original_sensitive.pdf"
    redacted_pdf_path = tmp_path / "sanitized_redacted.pdf"

    sensitive_ssn = "123-45-6789"
    sensitive_pan = "ABCDE1234F"
    sensitive_name = "Vikram Sharma"
    innocent_text = "This is a public document header and non-sensitive footer."

    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    full_content = f"{innocent_text}\nTaxpayer Name: {sensitive_name}\nCitizen PAN: {sensitive_pan}\nSSN Number: {sensitive_ssn}\nEnd of document."
    page.insert_text((50, 100), full_content, fontsize=12)
    doc.save(str(original_pdf_path))
    doc.close()

    # Verify sensitive text exists in original PDF
    verify_orig_doc = fitz.open(original_pdf_path)
    orig_extracted = verify_orig_doc[0].get_text()
    assert sensitive_pan in orig_extracted
    assert sensitive_ssn in orig_extracted
    assert sensitive_name in orig_extracted
    verify_orig_doc.close()

    # 2. Perform True Redaction
    findings_to_redact = [
        {"text": sensitive_pan, "page": 1, "redaction_mode": "BLACK_BOX", "redacted_value": "████████"},
        {"text": sensitive_ssn, "page": 1, "redaction_mode": "BLACK_BOX", "redacted_value": "████████"},
        {"text": sensitive_name, "page": 1, "redaction_mode": "MASKING", "redacted_value": "V*****a"}
    ]
    applied_count = pdf_redactor.redact(original_pdf_path, redacted_pdf_path, findings_to_redact)
    assert applied_count >= 3

    # 3. VERIFY IRREVERSIBILITY:
    # Open the redacted PDF and ensure the raw underlying text search finds ZERO occurrences!
    sanitized_doc = fitz.open(redacted_pdf_path)
    sanitized_page = sanitized_doc[0]
    sanitized_text = sanitized_page.get_text()

    # Sensitive strings MUST NOT be in the extracted text stream
    assert sensitive_pan not in sanitized_text, "Sensitive PAN was still extractable from sanitized PDF!"
    assert sensitive_ssn not in sanitized_text, "Sensitive SSN was still extractable from sanitized PDF!"
    assert sensitive_name not in sanitized_text, "Sensitive Name was still extractable from sanitized PDF!"

    # Search instances must return empty lists
    assert len(sanitized_page.search_for(sensitive_pan)) == 0
    assert len(sanitized_page.search_for(sensitive_ssn)) == 0
    assert len(sanitized_page.search_for(sensitive_name)) == 0

    # Non-sensitive text MUST still be preserved
    assert innocent_text in sanitized_text

    sanitized_doc.close()
