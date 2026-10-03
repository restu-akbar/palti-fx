# Verification — definisi selesai & perintah kanonis (palti-fx)

Dokumen ini mendefinisikan "selesai" secara operasional. Klaim selesai tanpa
bukti di bawah = ditolak di Gate 4.

Bedakan dari `specs/<id>-<slug>/validation.md` (artefak per-fitur):
file ini adalah *aturan main*, artefak itu adalah *bukti per fitur*.

## 1. Urutan validasi wajib

1. Focused test: `npx vitest run tests/<area>.test.ts` untuk area yang diubah.
2. Suite relevan: `npx vitest run` (penuh; kecil di repo ini — wajib penuh
   kecuali plan memberi alasan dengan daftar file yang dikecualikan).
3. Typecheck: `npx tsc --noEmit`.
4. Lint: `npm run lint`.
5. Build/export HANYA bila menyentuh config/UI lintas platform:
   `npx expo export --platform web` untuk perubahan web shell. Jangan jalankan
   EAS build sebagai verifikasi rutin.

## 2. Bukti yang wajib dicatat di `validation.md` artefak

- Tabel perintah: command persis | exit code | ringkasan output (bukan "PASS"
  tanpa log). Contoh: `npx vitest run` → `exit 0` → `Test Files 4 passed (4)`.
- Tabel AC: setiap checkbox `spec.md` → bukti (nama test / output perintah /
  observasi) → PASS/FAIL.
- `git status --short` + `git diff --stat` untuk membuktikan tidak ada file
  tak terduga.
- Sisa gap eksplisit. Jika perintah tidak bisa dijalankan: tulis alasan +
  tandai `NOT EXECUTED`. Jangan klaim PASS.

## 3. Aturan kesegaran bukti

- Bukti harus dari sesi kerja ini, setelah diff final. Uji yang dijalankan
  sebelum edit terakhir tidak berlaku untuk klaim akhir — jalankan ulang.
- Test hijau bukan bukti lengkap: setiap AC harus dipetakan ke minimal satu
  baris bukti. AC tanpa bukti = FAIL.

## 4. Kegagalan yang harus menghentikan klaim selesai

- `vitest` gagal (termasuk 1 file).
- `tsc --noEmit` error.
- `expo lint` error (warning: catat, tidak memblokir kecuali plan menyatakan).
- `git status` menunjukkan file tak terkait / secret / `dist/` yang ikut berubah.
- Ada AC tanpa bukti atau edge case di `tdd.md` yang belum dieksekusi.
