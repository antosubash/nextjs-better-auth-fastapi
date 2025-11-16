"""Application entry point."""

from pathlib import Path
import sys

# Add backend directory to Python path to ensure imports work
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn  # noqa: E402

from core.app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
