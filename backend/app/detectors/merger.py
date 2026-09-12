from typing import List, Dict, Any

SPECIFICITY_WEIGHTS = {
    "IN_PAN": 10,
    "IN_AADHAAR": 10,
    "IN_VOTER_ID": 10,
    "IN_IFSC": 9,
    "CREDIT_CARD": 9,
    "US_SSN": 9,
    "IBAN_CODE": 9,
    "EMAIL_ADDRESS": 8,
    "IN_PHONE_NUMBER": 8,
    "PHONE_NUMBER": 7,
    "IP_ADDRESS": 7,
    "URL": 6,
    "PERSON": 5,
    "ORGANIZATION": 4,
    "LOCATION": 4,
    "DATE_TIME": 3,
    "FINANCIAL_AMOUNT": 3
}

def merge_findings(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Intelligently merge and deduplicate entity findings from multiple engines.
    Resolves overlapping char spans by choosing highest specificity and confidence.
    """
    if not findings:
        return []

    # Sort primarily by start_char, then by length descending
    sorted_findings = sorted(
        findings,
        key=lambda f: (f.get("start_char", 0), -(f.get("end_char", 0) - f.get("start_char", 0)))
    )

    merged: List[Dict[str, Any]] = []

    for curr in sorted_findings:
        curr_start = curr.get("start_char", 0)
        curr_end = curr.get("end_char", 0)
        curr_type = curr.get("entity_type", "")
        curr_conf = curr.get("confidence", 0.5)

        if not merged:
            merged.append(curr)
            continue

        prev = merged[-1]
        prev_start = prev.get("start_char", 0)
        prev_end = prev.get("end_char", 0)
        prev_type = prev.get("entity_type", "")
        prev_conf = prev.get("confidence", 0.5)

        # Check for overlap
        has_overlap = not (curr_start >= prev_end or curr_end <= prev_start)

        if not has_overlap:
            merged.append(curr)
            continue

        # Overlapping case: Decide which one to keep or merge
        prev_weight = SPECIFICITY_WEIGHTS.get(prev_type, 1) + prev_conf
        curr_weight = SPECIFICITY_WEIGHTS.get(curr_type, 1) + curr_conf

        if curr_type == prev_type:
            # Same type, choose higher confidence and widen span if needed
            merged[-1]["confidence"] = max(prev_conf, curr_conf)
            merged[-1]["source"] = f"{prev.get('source')}, {curr.get('source')}" if curr.get('source') not in prev.get('source', '') else prev.get('source')
            if curr_end > prev_end:
                merged[-1]["end_char"] = curr_end
                merged[-1]["text"] = curr.get("text")
        elif curr_weight > prev_weight:
            # Replace previous with higher priority entity
            merged[-1] = curr
        else:
            # Keep previous, but if current is longer and same start, update span
            pass

    return merged
