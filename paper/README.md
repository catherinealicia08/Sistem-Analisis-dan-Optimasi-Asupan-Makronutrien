# Laporan IEEE — IF3211 Kelompok 07

LaTeX IEEE Conference Template untuk laporan ilmiah proyek
**Pengembangan Sistem Analisis dan Optimasi Asupan Makronutrien Berbasis Kebutuhan Metabolik**.

## Berkas

```
paper/
├── main.tex          # Naskah utama (IEEE conference, 2 kolom)
├── references.bib    # Bibliografi BibTeX (12 referensi ilmiah valid)
├── images/           # Tempat menaruh screenshot (lihat images/README.md)
└── README.md         # File ini
```

## Cara mengompilasi (lokal)

Butuh distribusi LaTeX yang lengkap (TeX Live atau MikTeX). Kelas `IEEEtran`
sudah disertakan secara default pada keduanya.

### Cara cepat — pdflatex + bibtex

```bash
cd paper
pdflatex main
bibtex main
pdflatex main
pdflatex main
```

Hasil: `main.pdf`.

### Alternatif — latexmk (satu perintah)

```bash
cd paper
latexmk -pdf main.tex
```

### Overleaf

1. Buat project baru → "Upload Project" → unggah folder `paper/`.
2. Pastikan _Compiler_ = `pdfLaTeX` dan _Main document_ = `main.tex`.
3. Klik **Recompile**.

## Screenshot

`main.tex` mengacu pada 7 gambar di folder `images/`:

| Berkas                | Konten                                            |
| --------------------- | ------------------------------------------------- |
| `arsitektur.png`      | Diagram arsitektur (Frontend ↔ FastAPI ↔ DB ↔ PuLP)|
| `erd.png`             | ERD: foods, users, daily_logs, daily_log_items    |
| `dashboard.png`       | Dasbor utama aplikasi                             |
| `food-logger.png`     | Antarmuka pencatatan makanan                      |
| `analysis.png`        | Panel quality scores + insights                   |
| `recommendation.png`  | Panel rekomendasi ILP                             |
| `github.png`          | Halaman GitHub repository                         |

Jika gambar belum ada, kompilasi akan memunculkan _warning_ tetapi tetap
menghasilkan PDF (kotak abu-abu kosong). Setelah Anda mengambil
_screenshot_, simpan ke `paper/images/` lalu kompilasi ulang.

## Referensi (BibTeX)

Semua sitasi adalah referensi ilmiah valid:

1. Mifflin et al. (1990) — BMR equation
2. Institute of Medicine (2005) — AMDR
3. ACSM Guidelines, 10th ed. (2018)
4. Thomas, Erdman, Burke (2016) — AND/DC/ACSM position
5. Frankenfield, Roth-Yousey, Compher (2005) — RMR equation comparison
6. Hall et al. (2011) — Energy balance & body weight
7. Stigler (1945) — The Cost of Subsistence (classic diet problem)
8. Wolsey (1998) — Integer Programming
9. Tran et al. (2018) — Recommender systems in healthy food
10. Mitchell, O'Sullivan, Dunning (2011) — PuLP
11. Forrest, Lougee-Heimer (2005) — CBC
12. Panganku Indonesia — Kemenkes RI
13. USDA FoodData Central

Tidak ada referensi fiktif. Semua DOI/URL dapat diverifikasi.
