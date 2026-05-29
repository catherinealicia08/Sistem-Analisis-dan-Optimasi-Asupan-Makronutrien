"""
Firebase Firestore connection module.
Menggantikan SQLAlchemy engine/session dengan Firebase Admin SDK.

Credentials dibaca dari environment variable FIREBASE_CREDENTIALS_JSON
(isi dari service account JSON file).
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

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
        # Local development: coba baca dari file serviceAccountKey.json
        key_path = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
        if os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
        else:
            raise RuntimeError(
                "Firebase credentials tidak ditemukan. "
                "Set env var FIREBASE_CREDENTIALS_JSON atau letakkan "
                "serviceAccountKey.json di folder backend/"
            )

    _app = firebase_admin.initialize_app(cred)


# Inisialisasi saat modul di-import
_init_firebase()

# Firestore client — digunakan oleh semua router
db: firestore.Client = firestore.client()
