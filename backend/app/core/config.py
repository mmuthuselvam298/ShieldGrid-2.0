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
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/shieldgrid.db"
    
    # OCR Settings
    TESSERACT_CMD: str = "/opt/homebrew/bin/tesseract"
    TESSERACT_LANG: str = "eng"
    
    # Retention
    RETENTION_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure storage directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REDACTED_DIR.mkdir(parents=True, exist_ok=True)
settings.PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
settings.DEMO_DIR.mkdir(parents=True, exist_ok=True)
