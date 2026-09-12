import logging
import spacy
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Map spaCy entity labels to standardized ShieldGrid entity types
SPACY_LABEL_MAP = {
    "PERSON": "PERSON",
    "ORG": "ORGANIZATION",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "DATE": "DATE_TIME",
    "TIME": "DATE_TIME",
    "MONEY": "FINANCIAL_AMOUNT",
    "CARDINAL": None, # Ignore numbers
    "ORDINAL": None
}

class SpacyEngine:
    _instance: Optional["SpacyEngine"] = None

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy en_core_web_sm model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
            self.nlp = None

    @classmethod
    def get_instance(cls) -> "SpacyEngine":
        if cls._instance is None:
            cls._instance = SpacyEngine()
        return cls._instance

    def analyze(self, text: str) -> List[Dict[str, Any]]:
        if not self.nlp or not text or not text.strip():
            return []

        doc = self.nlp(text[:100000]) # Protect against oversized strings
        findings = []

        for ent in doc.ents:
            standardized_type = SPACY_LABEL_MAP.get(ent.label_)
            if not standardized_type:
                continue

            findings.append({
                "entity_type": standardized_type,
                "text": ent.text.strip(),
                "confidence": 0.85, # Default spaCy statistical model score
                "source": "spacy_ner",
                "start_char": ent.start_char,
                "end_char": ent.end_char,
                "explanation": f"Statistical Named Entity Recognition model recognized label '{ent.label_}'."
            })

        return findings

spacy_engine = SpacyEngine.get_instance()
