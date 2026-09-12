import os
import fitz # PyMuPDF
from pathlib import Path
from typing import Dict, Any, List
from app.core.config import settings

class PDFParser:
    @staticmethod
    def parse(file_path: Path, doc_id: str) -> Dict[str, Any]:
        """
        Extract text, page count, render preview images, and detect scanned status.
        """
        doc = fitz.open(file_path)
        page_count = len(doc)
        pages_data = []
        total_text = ""
        is_scanned = False
        
        # Directory for this doc's page preview images
        doc_preview_dir = settings.PREVIEW_DIR / doc_id
        doc_preview_dir.mkdir(parents=True, exist_ok=True)

        for page_idx, page in enumerate(doc):
            page_num = page_idx + 1
            page_text = page.get_text("text")
            total_text += f"\n--- Page {page_num} ---\n" + page_text

            # Render page to high-res PNG preview
            pix = page.get_pixmap(dpi=150)
            preview_filename = f"page_{page_num}.png"
            preview_path = doc_preview_dir / preview_filename
            pix.save(str(preview_path))

            # Extract word bounding boxes: (x0, y0, x1, y1, word, block_no, line_no, word_no)
            words = page.get_text("words")
            word_boxes = [
                {
                    "text": w[4],
                    "bbox": [round(w[0], 2), round(w[1], 2), round(w[2], 2), round(w[3], 2)]
                }
                for w in words
            ]

            pages_data.append({
                "page": page_num,
                "text": page_text,
                "width": page.rect.width,
                "height": page.rect.height,
                "preview_url": f"/api/documents/{doc_id}/preview/{page_num}",
                "words": word_boxes
            })

        # Determine if document is scanned: Average characters per page < 40
        avg_chars = len(total_text.strip()) / max(page_count, 1)
        if avg_chars < 40:
            is_scanned = True

        doc.close()

        return {
            "page_count": page_count,
            "text": total_text.strip(),
            "pages": pages_data,
            "is_scanned": is_scanned
        }

pdf_parser = PDFParser()
