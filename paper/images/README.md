# Screenshot untuk laporan

Letakkan tujuh berkas PNG berikut di folder ini sebelum mengompilasi
`main.tex`. Resolusi disarankan minimal 1200×900 px agar tidak buram saat
diperkecil ke lebar satu kolom IEEE.

| Berkas               | Disarankan diambil dari                                           |
| -------------------- | ----------------------------------------------------------------- |
| `arsitektur.png`     | Diagram blok (boleh dibuat di draw.io / Excalidraw)               |
| `erd.png`            | ERD (boleh dibuat di dbdiagram.io, draw.io, atau diagrams.net)    |
| `dashboard.png`      | Halaman utama aplikasi (`http://localhost:5173`)                  |
| `food-logger.png`    | Komponen "Catat Makanan" pada dasbor                              |
| `analysis.png`       | Komponen "Insight Nutrisi" pada dasbor                            |
| `recommendation.png` | Komponen "Rekomendasi Optimasi" pada dasbor                       |
| `github.png`         | Halaman utama repository GitHub                                   |

Setelah file PNG ditaruh, kompilasi ulang dari folder `paper/`:

```bash
pdflatex main && bibtex main && pdflatex main && pdflatex main
```
