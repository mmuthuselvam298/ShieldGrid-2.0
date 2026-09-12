import logging
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class TextParser:
    @staticmethod
    def parse(file_path: Path) -> Dict[str, Any]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

        return {
            "page_count": 1,
            "text": text,
            "is_scanned": False
        }

    @staticmethod
    def redact(input_path: Path, output_path: Path, findings_to_redact: List[Dict[str, Any]]) -> int:
        with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        applied_count = 0
        for item in findings_to_redact:
            target = item.get("text", "")
            replacement = item.get("redacted_value", "████████")
            if target and target in content:
                count = content.count(target)
                content = content.replace(target, replacement)
                applied_count += count

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return applied_count

text_parser = TextParser()
