"""
CORS middleware configuration.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI) -> None:
    """Attach CORS middleware to the FastAPI app.

    Set CORS_ORIGINS env variable to a comma-separated list of allowed origins
    for production (e.g. "https://macroplus.vercel.app").
    Falls back to ["*"] for local development.
    """
    raw = os.environ.get("CORS_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()] or ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
