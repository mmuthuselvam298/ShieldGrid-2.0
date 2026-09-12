import re
import hashlib
from typing import Dict

# Counter mapping for consistent pseudonymization within a session/document
class RedactionTransformer:
    def __init__(self):
        self.entity_counters: Dict[str, int] = {}
        self.pseudonym_map: Dict[str, str] = {}

    def reset(self):
        self.entity_counters.clear()
        self.pseudonym_map.clear()

    def transform(self, text: str, entity_type: str, mode: str = "BLACK_BOX", custom_text: str = None) -> str:
        """
        Transform sensitive text based on the selected mode:
        1. BLACK_BOX: Full block characters (████████)
        2. MASKING: Preserves first and last characters, masks middle
        3. ANONYMIZATION: Consistent pseudonym (e.g., PERSON_001)
        4. HASHING: Deterministic SHA-256 digest preview
        5. REPLACEMENT: Categorical tag e.g. [REDACTED <TYPE>] or custom text
        """
        if not text:
            return ""

        mode = mode.upper()

        if mode == "BLACK_BOX":
            # Matching length block characters
            return "█" * max(len(text), 4)

        elif mode == "MASKING":
            return self._mask_value(text, entity_type)

        elif mode == "ANONYMIZATION":
            # Consistent pseudonym mapping
            key = f"{entity_type}:{text}"
            if key not in self.pseudonym_map:
                count = self.entity_counters.get(entity_type, 0) + 1
                self.entity_counters[entity_type] = count
                clean_type = entity_type.replace("IN_", "").upper()
                self.pseudonym_map[key] = f"{clean_type}_{count:03d}"
            return self.pseudonym_map[key]

        elif mode == "HASHING":
            digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
            return f"SHA256:{digest}..."

        elif mode == "REPLACEMENT":
            if custom_text:
                return custom_text
            clean_type = entity_type.replace("IN_", "").upper()
            return f"[REDACTED {clean_type}]"

        else:
            return "█" * max(len(text), 4)

    def _mask_value(self, text: str, entity_type: str) -> str:
        # Email masking: j***@domain.com
        if "@" in text:
            parts = text.split("@")
            user, domain = parts[0], parts[1]
            masked_user = user[0] + "***" if len(user) > 1 else "***"
            return f"{masked_user}@{domain}"

        # Digits / IDs / Phone numbers: Show first 2 and last 2, mask middle
        digits_only = re.sub(r"\D", "", text)
        if len(digits_only) >= 6:
            # Mask inner digits
            chars = list(text)
            digit_indices = [i for i, c in enumerate(chars) if c.isdigit()]
            for idx in digit_indices[2:-2]:
                chars[idx] = "*"
            return "".join(chars)

        # General text masking: keep first letter, mask remainder
        if len(text) <= 2:
            return "**"
        return text[0] + ("*" * (len(text) - 2)) + text[-1]

redaction_transformer = RedactionTransformer()
