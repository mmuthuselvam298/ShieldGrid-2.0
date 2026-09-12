import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShieldGrid 2.0"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    REDACTED_DIR: Path = STORAGE_DIR / "redacted"
    PREVIEW_DIR: Path = STORAGE_DIR / "previews"
    DEMO_DIR: Path = BASE_DIR / "demo_data"
    
    # Security & limits
    MAX_FILE_SIZE_MB: int = 25
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".txt"}
    
    # Database
    DATABASE_URL: str = ""

    # OCR Settings
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")
    TESSERACT_LANG: str = "eng"
    
    # Retention
    RETENTION_DAYS: int = 30
    
    # CORS - allow all Vercel preview URLs + localhost
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "https://shieldgrid-2-0.vercel.app",
    ]
    CORS_ALLOW_ALL: bool = True  # set True to allow all origins (for Vercel preview URLs)

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Adjust paths for Vercel's read-only filesystem
if os.getenv("VERCEL"):
    tmp_root = Path("/tmp")
    settings.BASE_DIR = tmp_root
    settings.STORAGE_DIR = tmp_root / "storage"
    settings.UPLOAD_DIR = settings.STORAGE_DIR / "uploads"
    settings.REDACTED_DIR = settings.STORAGE_DIR / "redacted"
    settings.PREVIEW_DIR = settings.STORAGE_DIR / "previews"
    settings.DEMO_DIR = tmp_root / "demo_data"
    settings.DATABASE_URL = f"sqlite:///{tmp_root}/shieldgrid.db"
else:
    if not settings.DATABASE_URL:
        settings.DATABASE_URL = f"sqlite:///{settings.BASE_DIR}/shieldgrid.db"

# Ensure storage directories exist (writable location)
for d in [settings.UPLOAD_DIR, settings.REDACTED_DIR, settings.PREVIEW_DIR, settings.DEMO_DIR]:
    try:
        d.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass
