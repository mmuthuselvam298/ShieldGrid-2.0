import os
import re
import hashlib
from pathlib import Path
from fastapi import HTTPException
from app.core.config import settings

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and special character issues."""
    # Keep only base name
    base_name = os.path.basename(filename)
    # Remove dangerous characters
    cleaned = re.sub(r'[^a-zA-Z0-9_\.\-]', '_', base_name)
    if not cleaned or cleaned.startswith('.'):
        cleaned = f"doc_{cleaned}"
    return cleaned

def validate_file_extension(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )
    return ext

def compute_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()
