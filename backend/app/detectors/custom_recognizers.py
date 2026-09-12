import re
from typing import List, Optional
from presidio_analyzer import Pattern, PatternRecognizer

# =====================================================================
# Verhoeff Checksum Algorithm for Aadhaar Validation
# =====================================================================
_verhoeff_d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

_verhoeff_p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

_verhoeff_inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def validate_verhoeff(number_str: str) -> bool:
    """Validate 12-digit number using Verhoeff algorithm."""
    digits = [int(c) for c in number_str if c.isdigit()]
    if len(digits) != 12:
        return False
    # First digit of Aadhaar cannot be 0 or 1
    if digits[0] in (0, 1):
        return False
    c = 0
    reversed_digits = digits[::-1]
    for i, digit in enumerate(reversed_digits):
        c = _verhoeff_d[c][_verhoeff_p[i % 8][digit]]
    return c == 0

def generate_verhoeff_checksum(eleven_digits: str) -> str:
    """Generate the 12th Verhoeff checksum digit for 11 digits."""
    digits = [int(c) for c in eleven_digits if c.isdigit()]
    c = 0
    reversed_digits = digits[::-1]
    for i, digit in enumerate(reversed_digits):
        c = _verhoeff_d[c][_verhoeff_p[(i + 1) % 8][digit]]
    return str(_verhoeff_inv[c])

# =====================================================================
# Indian PAN Card Recognizer
# =====================================================================
class IndianPanRecognizer(PatternRecognizer):
    PATTERNS = [
        Pattern(
            name="pan_pattern",
            regex=r"\b[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]\b",
            score=0.92
        ),
        Pattern(
            name="pan_general",
            regex=r"\b[A-Z]{5}\d{4}[A-Z]\b",
            score=0.75
        )
    ]

    CONTEXT = [
        "pan", "pan card", "pan no", "pan number", "permanent account number",
        "income tax", "incometax", "taxpayer", "tax id"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PAN",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="en"
        )

# =====================================================================
# Indian Aadhaar Recognizer
# =====================================================================
class IndianAadhaarRecognizer(PatternRecognizer):
    PATTERNS = [
        Pattern(
            name="aadhaar_spaced",
            regex=r"\b[2-9]\d{3}\s\d{4}\s\d{4}\b",
            score=0.88
        ),
        Pattern(
            name="aadhaar_hyphenated",
            regex=r"\b[2-9]\d{3}-\d{4}-\d{4}\b",
            score=0.88
        ),
        Pattern(
            name="aadhaar_continuous",
            regex=r"\b[2-9]\d{11}\b",
            score=0.70
        )
    ]

    CONTEXT = [
        "aadhaar", "aadhar", "uid", "uidai", "unique identification",
        "identity", "resident", "citizen", "my aadhaar"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_AADHAAR",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="en"
        )

    def validate_result(self, pattern_text: str) -> bool:
        clean = re.sub(r"[\s\-]", "", pattern_text)
        # Must be 12 digits not starting with 0 or 1
        if len(clean) == 12 and clean[0] not in ("0", "1"):
            return True
        return False

# =====================================================================
# Indian Phone Number Recognizer
# =====================================================================
class IndianPhoneRecognizer(PatternRecognizer):
    PATTERNS = [
        Pattern(
            name="in_phone_full",
            regex=r"(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}\b",
            score=0.85
        ),
        Pattern(
            name="in_phone_std",
            regex=r"\b0[1-9]\d{1,3}[\s\-]?\d{6,8}\b",
            score=0.75
        )
    ]

    CONTEXT = [
        "phone", "mobile", "contact", "call", "cell", "tel", "whatsapp",
        "contact number", "mobile number"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PHONE_NUMBER",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="en"
        )

# =====================================================================
# Indian Bank IFSC Code Recognizer
# =====================================================================
class IndianIfscRecognizer(PatternRecognizer):
    PATTERNS = [
        Pattern(
            name="ifsc_pattern",
            regex=r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
            score=0.90
        )
    ]

    CONTEXT = [
        "ifsc", "ifsc code", "bank code", "rtgs", "neft", "branch code",
        "bank branch", "bank"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_IFSC",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="en"
        )

# =====================================================================
# Indian Voter ID (EPIC) Recognizer
# =====================================================================
class IndianVoterIdRecognizer(PatternRecognizer):
    PATTERNS = [
        Pattern(
            name="voter_id_pattern",
            regex=r"\b[A-Z]{3}\d{7}\b",
            score=0.80
        )
    ]

    CONTEXT = [
        "voter", "voter id", "epic", "election", "electoral", "election commission"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_VOTER_ID",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="en"
        )
