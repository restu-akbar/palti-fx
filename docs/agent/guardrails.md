# Guardrails — anti-hallucination & minimal change (palti-fx)

Aturan di sini mengikat. Pelanggaran = alasan penolakan gate.

## 1. Verify-before-use (wajib)

1. Setiap fungsi, tipe, komponen, file, route, storage key, dependensi, atau
   perilaku yang dipakai/diklaim HARUS dikutip dengan `path:line` atau output
   `grep` yang benar-benar dibaca di sesi ini.
2. Jika tidak ditemukan di repo: STOP. Tulis di artefak sebagai open question
   dan tanya manusia. JANGAN mengarang API, prop, event, config field, atau
   perilaku platform.
3. Contoh yang dilarang: membuat `Route` baru tanpa merujuk `src/nav.tsx:6-14`;
   memakai storage key baru tanpa mencantumkan `src/lib/store.tsx:40`;
   mengklaim flag `eas.json` tanpa membaca `eas.json`.

## 2. Minimal diff

1. Satu perubahan = satu tujuan. Jelaskan setiap file yang diubah di `plan.md §3`
   (kolom Why). File tanpa alasan = hapus dari diff.
2. Dilarang: refactor unrelated, format ulang massal, rename "sambil lewat",
   upgrade dependency di luar scope.
3. Batas praktis: jika `git diff --stat` menyentuh >10 file atau >400 baris tanpa
   alasan yang disetujui Gate 2/3, pecah menjadi sub-tugas atau minta
   persetujuan ulang.
4. Jangan "memperbaiki" hal yang by-design: web 480px (`App.tsx:199-207`),
   silent `persist()` catch, `newId()` berbasis waktu — kecuali `spec.md`
   memintanya eksplisit.

## 3. Permukaan baru butuh persetujuan Gate 2

Semua ini WAJIB tercantum di `plan.md §3-4` sebelum dibuat:

- file baru, file dipindah/dihapus
- dependensi baru / bump versi (`package.json`, `package-lock.json`)
- perubahan `app.json`, `eas.json`, `tsconfig.json`, `eslint.config.js`,
  `vitest.config.ts`
- schema data, tipe publik, storage key, format persist
- API/network contract, permission native, deep link, notifikasi

Tanpa persetujuan: implementasi yang menyentuh daftar di atas ditolak di Gate 4.

## 4. Dilarang tanpa instruksi eksplisit

- Mengedit `approval.md` untuk menyetujui gate sendiri (lihat `AGENTS.md`).
- Mengubah artefak gate yang sudah `APPROVED` lalu lanjut diam-diam — kembali
  ke gate terkait terlebih dahulu.
- Menambah secret/keystore/credential (EAS, Apple, keystore Android, `.env`)
  ke repo. Jangan pernah commit `dist/` generated.
- Mengubah `android/` native manual kecuali plan membuktikan tidak ada jalan
  via config Expo.
- Menjalankan build EAS / submit store / deploy hosting sebagai bagian dari
  "verifikasi rutin". Itu operasi rilis, bukan test.

## 5. Error & edge case

- Pure lib (`src/lib/calc.ts`, `instruments.ts`, `sessions.ts`, `format.ts`):
  kembalikan `null`/fallback yang sudah ada polanya; jangan lempar exception
  baru kecuali spec + plan menyetujuinya.
- I/O (`store.tsx`): pertahankan semantik `load → fallback`, `persist → silent`.
  Setiap perubahan semantik harus punya kasus uji + baris migrasi key versi
  (`pfx.*.v1` → `v2`) bila format berubah.
- Input user (trade form, kalkulator): validasi `NaN`/`Infinity`/negatif/nol dan
  kurs kosong (`Rates` berisi `undefined`) — polanya sudah ada di `calc.ts:6`
  (`valid()`). Tiru, jangan ciptakan gaya validasi baru.

## 6. Backward compatibility

- Perubahan format storage WAJIB menyertakan migrasi baca-tulis (baca `v1`,
  tulis format baru hanya setelah sukses) atau dinyatakan tidak perlu di plan
  dengan alasan.
- Perubahan `Trade`/`Settings` wajib menyebut dampak ke data user yang sudah
  tersimpan dan ke 4 test di `tests/`.
