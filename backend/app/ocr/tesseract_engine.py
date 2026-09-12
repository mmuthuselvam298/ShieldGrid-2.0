import os
import logging
import numpy as np
from PIL import Image, ImageFilter, ImageOps
from typing import Dict, Any, List
import pytesseract
from pytesseract import Output
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure pytesseract binary path
if os.path.exists(settings.TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

class OCREngine:
    @staticmethod
    def preprocess_image(image_path: str) -> np.ndarray:
        """
        Enhance image for OCR using Pillow: Grayscale, sharpening, and thresholding.
        Returns a numpy array for pytesseract.
        """
        img = Image.open(image_path).convert("RGB")

        # Convert to grayscale
        gray = img.convert("L")

        # Sharpen to improve OCR accuracy
        sharpened = gray.filter(ImageFilter.SHARPEN)

        # Otsu-style threshold via numpy
        arr = np.array(sharpened)
        threshold = arr.mean()
        binary = (arr > threshold).astype(np.uint8) * 255
        return binary

    @staticmethod
    def extract_text_and_boxes(image_path: str) -> Dict[str, Any]:
        """
        Extract full text and word-level bounding boxes from an image using Tesseract.
        """
        try:
            processed = OCREngine.preprocess_image(image_path)
            pil_processed = Image.fromarray(processed)

            # OCR with bounding box data
            data = pytesseract.image_to_data(pil_processed, lang=settings.TESSERACT_LANG, output_type=Output.DICT)

            words = []
            full_text_parts = []

            n_boxes = len(data['text'])
            for i in range(n_boxes):
                text = data['text'][i].strip()
                conf = int(data['conf'][i])

                if text and conf > 20:  # Filter out noisy empty boxes
                    full_text_parts.append(text)
                    words.append({
                        "text": text,
                        "confidence": conf / 100.0,
                        "bbox": [
                            data['left'][i],
                            data['top'][i],
                            data['left'][i] + data['width'][i],
                            data['top'][i] + data['height'][i]
                        ]
                    })

            full_text = " ".join(full_text_parts)
            return {
                "text": full_text,
                "words": words,
                "engine": "tesseract_v5"
            }
        except Exception as e:
            logger.error(f"OCR extraction failed for {image_path}: {e}")
            # Fallback to direct string extraction
            try:
                raw_text = pytesseract.image_to_string(Image.open(image_path))
                return {
                    "text": raw_text.strip(),
                    "words": [],
                    "engine": "tesseract_fallback"
                }
            except Exception as e2:
                logger.error(f"Fallback OCR also failed: {e2}")
                return {"text": "", "words": [], "engine": "failed"}

ocr_engine = OCREngine()
