import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Policy

logger = logging.getLogger(__name__)

DEFAULT_POLICIES = [
    {
        "id": "policy_default",
        "name": "Standard Privacy Baseline",
        "description": "General privacy scan detecting common personal identifiers, contact info, and credentials.",
        "is_default": True,
        "config": {
            "entities": ["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOCATION", "CREDIT_CARD", "IN_PAN", "IN_AADHAAR"],
            "min_confidence": 0.40,
            "auto_redact": False
        }
    },
    {
        "id": "policy_strict",
        "name": "Strict Vault Mode",
        "description": "Maximum sensitivity audit. Flags all detected entities across all categories with lowest threshold.",
        "is_default": False,
        "config": {
            "entities": [
                "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOCATION", "CREDIT_CARD",
                "US_SSN", "IBAN_CODE", "IP_ADDRESS", "URL", "DATE_TIME", "ORGANIZATION",
                "IN_PAN", "IN_AADHAAR", "IN_PHONE_NUMBER", "IN_IFSC", "IN_VOTER_ID", "FINANCIAL_AMOUNT"
            ],
            "min_confidence": 0.30,
            "auto_redact": True
        }
    },
    {
        "id": "policy_india_privacy",
        "name": "India DPDP Act & Statutory Identifiers",
        "description": "Targeted compliance with India DPDP Act. Prioritizes PAN, Aadhaar, Voter ID, IFSC, and Indian phone numbers.",
        "is_default": False,
        "config": {
            "entities": ["IN_PAN", "IN_AADHAAR", "IN_PHONE_NUMBER", "IN_IFSC", "IN_VOTER_ID", "PERSON", "EMAIL_ADDRESS"],
            "min_confidence": 0.40,
            "auto_redact": False
        }
    },
    {
        "id": "policy_financial",
        "name": "Financial & PCI-DSS Focus",
        "description": "Scans documents for payment cards, bank account identifiers, transaction amounts, and IFSC codes.",
        "is_default": False,
        "config": {
            "entities": ["CREDIT_CARD", "IBAN_CODE", "IN_IFSC", "FINANCIAL_AMOUNT", "US_BANK_NUMBER"],
            "min_confidence": 0.50,
            "auto_redact": False
        }
    },
    {
        "id": "policy_contact",
        "name": "Contact & Telemetry Masking",
        "description": "Specialized in stripping contact records, email trails, phone numbers, and network IP addresses.",
        "is_default": False,
        "config": {
            "entities": ["EMAIL_ADDRESS", "PHONE_NUMBER", "IN_PHONE_NUMBER", "IP_ADDRESS", "URL"],
            "min_confidence": 0.45,
            "auto_redact": False
        }
    }
]

class PolicyService:
    @staticmethod
    def seed_policies(db: Session):
        """Seed default policies into the database if they don't exist."""
        for pol_data in DEFAULT_POLICIES:
            existing = db.query(Policy).filter(Policy.id == pol_data["id"]).first()
            if not existing:
                pol = Policy(
                    id=pol_data["id"],
                    name=pol_data["name"],
                    description=pol_data["description"],
                    is_default=pol_data["is_default"],
                    config_json=json.dumps(pol_data["config"])
                )
                db.add(pol)
        db.commit()

    @staticmethod
    def get_policy(db: Session, policy_id: str) -> Optional[Dict[str, Any]]:
        pol = db.query(Policy).filter(Policy.id == policy_id).first()
        if pol:
            return {
                "id": pol.id,
                "name": pol.name,
                "description": pol.description,
                "is_default": pol.is_default,
                "config": json.loads(pol.config_json)
            }
        return None

policy_service = PolicyService()
