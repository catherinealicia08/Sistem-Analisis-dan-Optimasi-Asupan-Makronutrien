"""
Firebase Firestore connection module.
Menggantikan SQLAlchemy engine/session dengan Firebase Admin SDK.

Credentials dibaca dari environment variable FIREBASE_CREDENTIALS_JSON
(isi dari service account JSON file), FIREBASE_KEY_PATH, atau fallback file
serviceAccountKey.json untuk local development.
"""

import os
import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BACKEND_DIR / ".env")

_app = None


def _disable_dead_local_proxy() -> None:
    dead_proxy = "http://127.0.0.1:9"
    for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        if os.environ.get(key) == dead_proxy:
            os.environ.pop(key, None)


def _init_firebase():
    global _app
    if _app is not None:
        return

    _disable_dead_local_proxy()

    creds_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    if creds_json:
        # Production / Vercel: credentials dari environment variable
        creds_dict = json.loads(creds_json)
        cred = credentials.Certificate(creds_dict)
    else:
        # Local development: env path first, then backend/serviceAccountKey.json.
        key_path = os.environ.get("FIREBASE_KEY_PATH")
        credential_path = Path(key_path).expanduser() if key_path else BACKEND_DIR / "serviceAccountKey.json"
        if not credential_path.is_absolute():
            credential_path = BACKEND_DIR / credential_path

        if not credential_path.exists():
            raise RuntimeError(
                "Firebase credentials tidak ditemukan. "
                "Set FIREBASE_CREDENTIALS_JSON untuk deployment, atau "
                "FIREBASE_KEY_PATH/serviceAccountKey.json untuk local development."
            )
        cred = credentials.Certificate(str(credential_path))

    _app = firebase_admin.initialize_app(cred)


# Inisialisasi saat modul di-import
_init_firebase()

# Firestore client — digunakan oleh semua router
db: firestore.Client = firestore.client()
