from typing import List, Dict, Any, Tuple

# Severity factor weights
ENTITY_WEIGHTS = {
    # Government Identifiers
    "IN_PAN": 25,
    "IN_AADHAAR": 30,
    "IN_VOTER_ID": 20,
    "US_SSN": 30,
    
    # Financial Information
    "CREDIT_CARD": 30,
    "IBAN_CODE": 25,
    "IN_IFSC": 15,
    "FINANCIAL_AMOUNT": 10,
    
    # Contact & Identifiers
    "EMAIL_ADDRESS": 10,
    "IN_PHONE_NUMBER": 12,
    "PHONE_NUMBER": 10,
    "IP_ADDRESS": 8,
    
    # Personal & Location
    "PERSON": 6,
    "LOCATION": 5,
    "DATE_TIME": 3,
    "ORGANIZATION": 4
}

class RiskEngine:
    @staticmethod
    def calculate_risk(findings: List[Dict[str, Any]], page_count: int = 1) -> Tuple[float, str, List[Dict[str, Any]]]:
        """
        Calculates the ShieldGrid Privacy Risk Score (0 - 100) and factor breakdown.
        """
        if not findings:
            return 0.0, "LOW", [{"name": "No sensitive entities detected", "points": 0, "category": "Clean Document"}]

        factors: List[Dict[str, Any]] = []
        raw_score = 0.0

        # Group counts by category
        categories = {
            "Government Identifiers": {"points": 0, "count": 0, "max": 40},
            "Financial Information": {"points": 0, "count": 0, "max": 35},
            "Contact Information": {"points": 0, "count": 0, "max": 25},
            "Personal Identifiers": {"points": 0, "count": 0, "max": 15}
        }

        for f in findings:
            etype = f.get("entity_type", "")
            weight = ENTITY_WEIGHTS.get(etype, 5)

            if etype in ("IN_PAN", "IN_AADHAAR", "IN_VOTER_ID", "US_SSN"):
                categories["Government Identifiers"]["points"] += weight
                categories["Government Identifiers"]["count"] += 1
            elif etype in ("CREDIT_CARD", "IBAN_CODE", "IN_IFSC", "FINANCIAL_AMOUNT"):
                categories["Financial Information"]["points"] += weight
                categories["Financial Information"]["count"] += 1
            elif etype in ("EMAIL_ADDRESS", "IN_PHONE_NUMBER", "PHONE_NUMBER", "IP_ADDRESS"):
                categories["Contact Information"]["points"] += weight
                categories["Contact Information"]["count"] += 1
            else:
                categories["Personal Identifiers"]["points"] += weight
                categories["Personal Identifiers"]["count"] += 1

        for cat_name, cat_data in categories.items():
            if cat_data["count"] > 0:
                # Cap per category to avoid single-type overflow
                capped_points = min(cat_data["points"], cat_data["max"])
                raw_score += capped_points
                factors.append({
                    "category": cat_name,
                    "count": cat_data["count"],
                    "points": capped_points,
                    "description": f"{cat_data['count']} {cat_name.lower()} instances detected"
                })

        # Volume bonus (density of entities)
        occurrence_bonus = min(len(findings) * 1.5, 15)
        raw_score += occurrence_bonus
        factors.append({
            "category": "Finding Density",
            "count": len(findings),
            "points": round(occurrence_bonus, 1),
            "description": f"Aggregate sensitive findings density ({len(findings)} items across {page_count} page(s))"
        })

        final_score = min(round(raw_score, 1), 100.0)

        # Classify risk level
        if final_score >= 75:
            level = "CRITICAL"
        elif final_score >= 50:
            level = "HIGH"
        elif final_score >= 25:
            level = "MEDIUM"
        else:
            level = "LOW"

        return final_score, level, factors

risk_engine = RiskEngine()
