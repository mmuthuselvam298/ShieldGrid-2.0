import pytest
from app.detectors.custom_recognizers import (
    IndianPanRecognizer,
    IndianAadhaarRecognizer,
    IndianPhoneRecognizer,
    IndianIfscRecognizer,
    validate_verhoeff
)
from app.detectors.presidio_engine import presidio_engine
from app.detectors.merger import merge_findings
from app.anonymization.transformer import redaction_transformer

def test_verhoeff_validation():
    # Valid Verhoeff calculation test
    # Aadhaar numbers ending with proper checksum digit
    # Example: 234567890123 is False
    assert validate_verhoeff("234567890123") is False
    # Test invalid length
    assert validate_verhoeff("1234") is False
    # Test starting with 0
    assert validate_verhoeff("012345678901") is False

def test_custom_india_detection():
    sample_text = (
        "Taxpayer Rajesh Varma holding PAN BCDPV1234K and Aadhaar 4567 8901 2345, "
        "contactable at +91 98450 12345, bank IFSC code HDFC0000123."
    )
    findings = presidio_engine.analyze(sample_text)
    types_found = {f["entity_type"] for f in findings}
    
    assert "IN_PAN" in types_found
    assert "IN_AADHAAR" in types_found
    assert "IN_PHONE_NUMBER" in types_found
    assert "IN_IFSC" in types_found

def test_entity_merger_deduplication():
    raw_findings = [
        {"entity_type": "PHONE_NUMBER", "text": "+91 98765 43210", "confidence": 0.75, "start_char": 10, "end_char": 25, "source": "presidio"},
        {"entity_type": "IN_PHONE_NUMBER", "text": "+91 98765 43210", "confidence": 0.85, "start_char": 10, "end_char": 25, "source": "regex_india"},
        {"entity_type": "DATE_TIME", "text": "98765 43210", "confidence": 0.60, "start_char": 14, "end_char": 25, "source": "presidio"}
    ]
    merged = merge_findings(raw_findings)
    assert len(merged) == 1
    assert merged[0]["entity_type"] == "IN_PHONE_NUMBER"
    assert merged[0]["confidence"] == 0.85

def test_redaction_modes():
    # 1. Black box
    bb = redaction_transformer.transform("SecretData", "PERSON", mode="BLACK_BOX")
    assert "█" in bb
    assert len(bb) == len("SecretData")

    # 2. Masking
    masked_email = redaction_transformer.transform("alexander@test.org", "EMAIL_ADDRESS", mode="MASKING")
    assert masked_email == "a***@test.org"

    masked_phone = redaction_transformer.transform("9876543210", "PHONE_NUMBER", mode="MASKING")
    assert "98" in masked_phone and "10" in masked_phone and "*" in masked_phone

    # 3. Anonymization
    redaction_transformer.reset()
    anon1 = redaction_transformer.transform("John Doe", "PERSON", mode="ANONYMIZATION")
    anon2 = redaction_transformer.transform("John Doe", "PERSON", mode="ANONYMIZATION")
    assert anon1 == "PERSON_001"
    assert anon2 == "PERSON_001" # Consistent within document

    # 4. Hashing
    hashed = redaction_transformer.transform("TopSecretPassword", "CREDIT_CARD", mode="HASHING")
    assert hashed.startswith("SHA256:")

    # 5. Replacement
    rep = redaction_transformer.transform("John Doe", "PERSON", mode="REPLACEMENT")
    assert rep == "[REDACTED PERSON]"
