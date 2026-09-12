import logging
import fitz # PyMuPDF
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class PDFRedactor:
    @staticmethod
    def redact(
        input_pdf_path: Path,
        output_pdf_path: Path,
        findings_to_redact: List[Dict[str, Any]]
    ) -> int:
        """
        Performs true, irreversible PDF redaction using PyMuPDF.
        Removes underlying character glyphs from the PDF content stream and
        paints permanent black boxes or replacement text.
        """
        doc = fitz.open(input_pdf_path)
        applied_count = 0

        # Group findings by page
        findings_by_page: Dict[int, List[Dict[str, Any]]] = {}
        for f in findings_to_redact:
            p = f.get("page", 1)
            findings_by_page.setdefault(p, []).append(f)

        for page_num, page_findings in findings_by_page.items():
            page_idx = page_num - 1
            if page_idx >= len(doc):
                continue

            page = doc[page_idx]

            for item in page_findings:
                text_to_redact = item.get("text", "").strip()
                if not text_to_redact:
                    continue

                mode = item.get("redaction_mode", "BLACK_BOX").upper()
                replacement_text = item.get("redacted_value", "")

                # Search all occurrences of this exact text on the page
                text_instances = page.search_for(text_to_redact)
                
                # If exact search yields nothing, try partial or individual words
                if not text_instances and " " in text_to_redact:
                    # Fallback: search individual components
                    for word in text_to_redact.split():
                        if len(word) > 2:
                            text_instances.extend(page.search_for(word))

                for rect in text_instances:
                    if mode == "BLACK_BOX":
                        # Permanent black box redaction annotation
                        page.add_redact_annot(
                            rect,
                            fill=(0, 0, 0), # Pure Black
                            text=""
                        )
                    else:
                        # Replacement / Masked / Anonymized / Hashed text annotation
                        page.add_redact_annot(
                            rect,
                            fill=(0.95, 0.95, 0.95), # Light gray background
                            text=replacement_text,
                            text_color=(0.8, 0.1, 0.1), # Crimson warning color
                            fontsize=9
                        )
                    applied_count += 1

            # Irreversibly apply redactions to page (scrubbing text and image pixels)
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)

        # Save with garbage collection and deflated streams for maximum sanitization
        doc.save(
            str(output_pdf_path),
            garbage=4,
            deflate=True,
            clean=True
        )
        doc.close()
        
        logger.info(f"PDF Redaction complete: {applied_count} redactions applied permanently to {output_pdf_path.name}")
        return applied_count

pdf_redactor = PDFRedactor()
