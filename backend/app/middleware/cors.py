"""
CORS middleware configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI) -> None:
    """Attach CORS middleware to the FastAPI app."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],          # ganti dengan domain spesifik saat production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
