# api/index.py
"""Vercel serverless entrypoint for ShieldGrid FastAPI app.
Uses Mangum to adapt the FastAPI ASGI app to Vercel's Lambda style handler.
"""
import os
import sys
from pathlib import Path

# Ensure backend code is importable from the project root
PROJECT_ROOT = Path(__file__).resolve().parents[1]
backend_path = PROJECT_ROOT / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Override tesseract path for Vercel Linux environment
if not os.getenv("TESSERACT_CMD"):
    os.environ["TESSERACT_CMD"] = "/usr/bin/tesseract"

# Import the FastAPI app defined in backend/main.py
from main import app  # noqa: E402

# Wrap with Mangum for Vercel Lambda-style execution
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except Exception as exc:
    raise RuntimeError(f"Mangum import failed: {exc}") from exc
