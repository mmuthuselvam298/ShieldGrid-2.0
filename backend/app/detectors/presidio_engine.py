import logging
from typing import List, Dict, Any, Optional
from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
from presidio_analyzer.nlp_engine import NlpEngineProvider
from app.detectors.custom_recognizers import (
    IndianPanRecognizer,
    IndianAadhaarRecognizer,
    IndianPhoneRecognizer,
    IndianIfscRecognizer,
    IndianVoterIdRecognizer
)

logger = logging.getLogger(__name__)

class PresidioEngine:
    _instance: Optional["PresidioEngine"] = None

    def __init__(self):
        logger.info("Initializing Microsoft Presidio Analyzer Engine with en_core_web_sm...")
        
        # Explicitly configure spaCy model to en_core_web_sm to avoid downloading en_core_web_lg
        nlp_config = {
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
        }
        nlp_provider = NlpEngineProvider(nlp_configuration=nlp_config)
        nlp_engine = nlp_provider.create_engine()

        registry = RecognizerRegistry()
        registry.load_predefined_recognizers(nlp_engine=nlp_engine, languages=["en"])
        
        # Register custom India recognizers
        registry.add_recognizer(IndianPanRecognizer())
        registry.add_recognizer(IndianAadhaarRecognizer())
        registry.add_recognizer(IndianPhoneRecognizer())
        registry.add_recognizer(IndianIfscRecognizer())
        registry.add_recognizer(IndianVoterIdRecognizer())
        
        self.analyzer = AnalyzerEngine(
            nlp_engine=nlp_engine,
            registry=registry,
            supported_languages=["en"]
        )
        logger.info("Presidio Analyzer initialized successfully.")

    @classmethod
    def get_instance(cls) -> "PresidioEngine":
        if cls._instance is None:
            cls._instance = PresidioEngine()
        return cls._instance

    def analyze(self, text: str, entities: Optional[List[str]] = None, score_threshold: float = 0.4) -> List[Dict[str, Any]]:
        """
        Analyze text using Presidio and return structured findings.
        """
        if not text or not text.strip():
            return []
            
        try:
            results = self.analyzer.analyze(
                text=text,
                language="en",
                entities=entities,
                score_threshold=score_threshold,
                return_decision_process=True
            )
        except Exception as e:
            logger.error(f"Presidio analyze error: {e}")
            return []

        findings = []
        for res in results:
            detected_text = text[res.start:res.end]
            explanation = f"Detected as {res.entity_type} via Presidio pattern analysis."
            if res.analysis_explanation:
                explanation = f"Presidio: {res.analysis_explanation.recognizer}"
                if res.analysis_explanation.pattern_name:
                    explanation += f" (Pattern: {res.analysis_explanation.pattern_name})"

            findings.append({
                "entity_type": res.entity_type,
                "text": detected_text,
                "confidence": round(res.score, 2),
                "source": "presidio",
                "start_char": res.start,
                "end_char": res.end,
                "explanation": explanation
            })

        return findings

presidio_engine = PresidioEngine.get_instance()
