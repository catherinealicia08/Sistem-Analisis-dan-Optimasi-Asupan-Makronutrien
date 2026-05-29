"""
Script untuk seed data ke Firestore.
Jalankan: python seed_firestore.py [opsi]

Opsi:
  --overwrite       Timpa data foods yang sudah ada
  --no-user         Skip pembuatan demo user
  --with-logs       Tambahkan contoh log makanan untuk demo user
  --clear-foods     Hapus semua foods sebelum seed ulang

Pastikan serviceAccountKey.json sudah ada di folder backend/
"""

import json
import sys
from pathlib import Path
from datetime import date, timedelta

# ── Firebase Admin SDK ──────────────────────────────────────────────────────
import firebase_admin
from firebase_admin import credentials, firestore

KEY_PATH  = Path(__file__).resolve().parent / "serviceAccountKey.json"
DATA_PATH = Path(__file__).resolve().parent / "data" / "foods.json"

FOODS_COL = "foods"
USERS_COL = "users"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def init_firebase():
    if not KEY_PATH.exists():
        print(
            "[ERROR] serviceAccountKey.json tidak ditemukan!\n"
            "   Download dari: Firebase Console -> Project Settings -> Service Accounts\n"
            f"   Letakkan di: {KEY_PATH}"
        )
        sys.exit(1)

    cred = credentials.Certificate(str(KEY_PATH))
    firebase_admin.initialize_app(cred)
    print("[OK] Firebase Admin SDK berhasil diinisialisasi.")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Seed Foods
# ─────────────────────────────────────────────────────────────────────────────

def seed_foods(db: firestore.Client, overwrite: bool = False, clear: bool = False):
    """Upload semua makanan dari data/foods.json ke Firestore collection 'foods'."""
    with DATA_PATH.open(encoding="utf-8") as f:
        foods = json.load(f)

    col_ref = db.collection(FOODS_COL)

    # Hapus dulu jika --clear-foods
    if clear:
        print(f"[WARN] Menghapus semua dokumen di collection '{FOODS_COL}'...")
        docs = col_ref.stream()
        batch = db.batch()
        count = 0
        for doc in docs:
            batch.delete(doc.reference)
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
        if count % 400 != 0:
            batch.commit()
        print(f"   {count} dokumen dihapus.")

    # Cek apakah sudah ada data
    elif not overwrite:
        existing = list(col_ref.limit(1).stream())
        if existing:
            print(
                f"[SKIP] Collection '{FOODS_COL}' sudah berisi data. "
                "Gunakan --overwrite atau --clear-foods untuk memperbarui."
            )
            return

    print(f"[INFO] Memulai seeding {len(foods)} makanan ke Firestore...")

    batch = db.batch()
    batch_count = 0
    total_written = 0

    for food in foods:
        doc_ref = col_ref.document()   # auto-generate Firestore document ID
        batch.set(doc_ref, food)
        batch_count += 1

        # Firestore batch limit = 500 operasi
        if batch_count >= 400:
            batch.commit()
            total_written += batch_count
            print(f"   Committed {total_written}/{len(foods)} dokumen...")
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()
        total_written += batch_count

    print(f"[DONE] {total_written} makanan berhasil diupload ke collection '{FOODS_COL}'.")


# ─────────────────────────────────────────────────────────────────────────────
# 2. Seed Demo Users
# ─────────────────────────────────────────────────────────────────────────────

DEMO_USERS = [
    {
        "name": "Budi Santoso",
        "age": 22,
        "sex": "male",
        "weight": 70.0,
        "height": 175.0,
        "activity_level": "moderate",
        "goal": "muscle_gain",
    },
    {
        "name": "Siti Rahayu",
        "age": 25,
        "sex": "female",
        "weight": 55.0,
        "height": 160.0,
        "activity_level": "light",
        "goal": "weight_loss",
    },
    {
        "name": "Andi Pratama",
        "age": 30,
        "sex": "male",
        "weight": 80.0,
        "height": 178.0,
        "activity_level": "very_active",
        "goal": "maintenance",
    },
]


def seed_demo_users(db: firestore.Client):
    """Buat demo users jika belum ada. Kembalikan list (id, data) yang berhasil dibuat."""
    users_col = db.collection(USERS_COL)
    existing = list(users_col.limit(1).stream())
    if existing:
        # Kembalikan user yang sudah ada untuk dipakai seed logs
        docs = list(users_col.stream())
        print(f"[INFO] Collection '{USERS_COL}' sudah berisi {len(docs)} user, skip pembuatan user baru.")
        return [(d.id, d.to_dict()) for d in docs]

    created = []
    for user_data in DEMO_USERS:
        _, ref = users_col.add(user_data)
        print(f"[OK] User '{user_data['name']}' dibuat (ID: {ref.id})")
        created.append((ref.id, user_data))

    return created


# ─────────────────────────────────────────────────────────────────────────────
# 3. Seed Demo Logs (opsional: --with-logs)
# ─────────────────────────────────────────────────────────────────────────────

def _get_food_ids(db: firestore.Client):
    """Ambil semua food ID dari Firestore, kelompokkan per kategori."""
    docs = list(db.collection(FOODS_COL).stream())
    by_cat = {}
    for d in docs:
        data = d.to_dict()
        cat = data.get("category", "Lainnya")
        by_cat.setdefault(cat, []).append(d.id)
    return by_cat


# Contoh pola makan per goal (kategori: jumlah porsi)
MEAL_PATTERNS = {
    "muscle_gain": [
        # (kategori, grams)
        ("Karbohidrat",    200),
        ("Protein Hewani", 150),
        ("Protein Nabati",  80),
        ("Sayuran",        100),
        ("Susu & Olahan",  100),
    ],
    "weight_loss": [
        ("Protein Hewani", 120),
        ("Sayuran",        200),
        ("Buah",           150),
        ("Protein Nabati",  80),
        ("Karbohidrat",    100),
    ],
    "maintenance": [
        ("Karbohidrat",    180),
        ("Protein Hewani", 120),
        ("Sayuran",        150),
        ("Buah",           100),
        ("Lemak & Minyak",  15),
    ],
}


def seed_demo_logs(db: firestore.Client, users: list):
    """
    Buat log makanan contoh untuk 7 hari terakhir bagi setiap demo user.
    Struktur: users/{uid}/logs/{YYYY-MM-DD}/items/{auto_id}
    """
    food_by_cat = _get_food_ids(db)
    if not food_by_cat:
        print("[WARN] Tidak ada food di Firestore, skip seed logs.")
        return

    today = date.today()

    for uid, udata in users:
        goal = udata.get("goal", "maintenance")
        pattern = MEAL_PATTERNS.get(goal, MEAL_PATTERNS["maintenance"])

        print(f"\n[INFO] Seeding logs untuk user '{udata.get('name', uid)}' (goal: {goal})...")

        for days_ago in range(6, -1, -1):   # 6 hari lalu s/d hari ini
            day = today - timedelta(days=days_ago)
            day_str = str(day)

            # Referensi log document
            log_ref = (
                db.collection(USERS_COL)
                .document(uid)
                .collection("logs")
                .document(day_str)
            )

            # Skip jika log hari ini sudah ada
            if log_ref.get().exists:
                print(f"   [SKIP] Log {day_str} sudah ada.")
                continue

            # Buat log document
            log_ref.set({"user_id": uid, "date": day_str})

            # Tambah items
            items_col = log_ref.collection("items")
            items_added = 0

            for cat, grams in pattern:
                food_ids = food_by_cat.get(cat, [])
                if not food_ids:
                    continue
                # Pilih food berdasarkan hari (rotasi supaya variatif)
                food_id = food_ids[days_ago % len(food_ids)]

                # Sedikit variasi ±10% berdasarkan hari
                variance = 1.0 + (days_ago % 3 - 1) * 0.1
                actual_grams = round(grams * variance, 1)

                items_col.add({
                    "food_id": food_id,
                    "grams": actual_grams,
                })
                items_added += 1

            print(f"   [OK] Log {day_str}: {items_added} item ditambahkan.")

    print("\n[DONE] Seeding logs selesai.")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    overwrite   = "--overwrite"   in sys.argv
    skip_user   = "--no-user"     in sys.argv
    with_logs   = "--with-logs"   in sys.argv
    clear_foods = "--clear-foods" in sys.argv

    print("=" * 55)
    print("  Firestore Seeder — NutriTrack App")
    print("=" * 55)

    init_firebase()
    db = firestore.client()

    # 1. Seed foods
    seed_foods(db, overwrite=overwrite, clear=clear_foods)

    # 2. Seed users
    users = []
    if not skip_user:
        users = seed_demo_users(db)

    # 3. (Opsional) Seed logs
    if with_logs and users:
        seed_demo_logs(db, users)
    elif with_logs and not users:
        print("[WARN] --with-logs diaktifkan tapi tidak ada user. Gunakan tanpa --no-user.")

    print("\n" + "=" * 55)
    print("  Seeding selesai!")
    print("  Cek Firestore Console:")
    print("  https://console.firebase.google.com/project/tubes-kds/firestore")
    print("=" * 55)


if __name__ == "__main__":
    main()
