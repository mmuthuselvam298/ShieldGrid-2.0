import shutil
import logging
from pathlib import Path
from typing import Dict, Any, List
from PIL import Image, ImageDraw, ImageFont
from app.core.config import settings
from app.ocr.tesseract_engine import ocr_engine

logger = logging.getLogger(__name__)

class ImageParser:
    @staticmethod
    def parse(file_path: Path, doc_id: str) -> Dict[str, Any]:
        """
        Parse image using OCR, generate preview and extract word boxes.
        """
        doc_preview_dir = settings.PREVIEW_DIR / doc_id
        doc_preview_dir.mkdir(parents=True, exist_ok=True)
        preview_path = doc_preview_dir / "page_1.png"
        
        # Save a copy as preview
        shutil.copy(str(file_path), str(preview_path))

        # Run OCR
        ocr_result = ocr_engine.extract_text_and_boxes(str(file_path))
        
        # Get dimensions
        with Image.open(file_path) as img:
            width, height = img.size

        pages_data = [{
            "page": 1,
            "text": ocr_result["text"],
            "width": width,
            "height": height,
            "preview_url": f"/api/documents/{doc_id}/preview/1",
            "words": ocr_result.get("words", [])
        }]

        return {
            "page_count": 1,
            "text": ocr_result["text"],
            "pages": pages_data,
            "is_scanned": True,
            "words": ocr_result.get("words", [])
        }

    @staticmethod
    def redact(input_path: Path, output_path: Path, findings_to_redact: List[Dict[str, Any]], words_boxes: List[Dict[str, Any]] = None) -> int:
        """
        Irreversible image redaction: Paints solid black or masked boxes over sensitive regions.
        """
        img = Image.open(input_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        applied_count = 0

        # Build lookup for word bounding boxes
        ocr_data = ocr_engine.extract_text_and_boxes(str(input_path))
        words = ocr_data.get("words", [])

        for item in findings_to_redact:
            text = item.get("text", "").lower().strip()
            mode = item.get("redaction_mode", "BLACK_BOX").upper()
            replacement = item.get("redacted_value", "")
            
            # Find matching words in OCR results
            matched_boxes = []
            for w in words:
                w_text = w["text"].lower().strip()
                if w_text in text or text in w_text:
                    matched_boxes.append(w["bbox"])

            for bbox in matched_boxes:
                # Add padding
                x0, y0, x1, y1 = bbox
                x0, y0 = max(0, x0 - 3), max(0, y0 - 2)
                x1, y1 = x1 + 3, y1 + 2

                if mode == "BLACK_BOX":
                    draw.rectangle([x0, y0, x1, y1], fill=(0, 0, 0))
                else:
                    draw.rectangle([x0, y0, x1, y1], fill=(230, 230, 230))
                    if replacement:
                        draw.text((x0 + 2, y0 + 1), replacement[:10], fill=(200, 30, 30))

                applied_count += 1

        img.save(str(output_path), quality=95)
        return applied_count

image_parser = ImageParser()
