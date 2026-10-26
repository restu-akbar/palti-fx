# Panduan Menjalankan Web Admin PALTI FX

Web admin adalah aplikasi React + Vite yang berada di folder `web`. Aplikasi ini terpisah dari aplikasi mobile Expo.

## Persiapan

- Install Node.js **20.19 atau lebih baru**, atau **22.12 atau lebih baru**. Vite versi proyek ini tidak mendukung Node.js 20.18.
- Buka terminal di root repository `palti-fx`.
- Install dependency jika belum pernah dilakukan:

  ```bash
  npm install
  ```

## Menjalankan web admin

Dari root repository, jalankan:

```bash
npm run start:web
```

Atau jalankan langsung dari folder `web`:

```bash
cd web
npm run dev
```

Vite akan menampilkan alamat lokal di terminal, biasanya `http://localhost:5173`. Buka halaman login admin di:

```text
http://localhost:5173/admin/login
```

Terminal harus tetap berjalan selama aplikasi digunakan. Hentikan server dengan `Ctrl+C`.

> `npm start` di root repository menjalankan aplikasi mobile. Untuk web admin gunakan `npm run start:web`.

## Konfigurasi Supabase

Web admin memakai Supabase untuk autentikasi dan data admin. File contoh environment tersedia di `web/.env.example`.

1. Buat file lokal `web/.env` berdasarkan `web/.env.example`.
2. Isi URL project dan anon/public key dari pengaturan API project Supabase:

   ```dotenv
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<supabase-anon-public-key>
   ```

3. Simpan file, lalu jalankan ulang Vite agar nilai environment termuat.

Jangan masukkan `service_role` key atau secret Supabase ke variabel `VITE_*` atau ke dalam kode frontend. Variabel dengan awalan `VITE_` dapat diakses oleh browser.

## Penyimpanan Gambar & Video Materi

Foto dan video yang disisipkan di editor materi diunggah ke Supabase Storage; naskah hanya menyimpan URL-nya. Gambar base64 lama tetap tampil seperti biasa.

| Bucket | Isi | Batas |
| --- | --- | --- |
| `lesson-images` | PNG, JPG, WEBP, GIF, AVIF (dikompres ke WebP di browser) | 5 MB |
| `lesson-videos` | MP4 (H.264) dan WebM, diunggah apa adanya | 50 MB |

1. Jalankan `mobile/supabase/migrations/002_lesson_images_bucket.sql` lalu `003_lesson_videos_bucket.sql` di SQL Editor Supabase. Hanya admin yang boleh mengunggah/menghapus; semua orang boleh membaca.
2. Opsional di `web/.env`: `VITE_STORAGE_DRIVER=supabase` (default), `VITE_STORAGE_BUCKET=lesson-images`, `VITE_STORAGE_VIDEO_BUCKET=lesson-videos`.
3. Batas 50 MB mengikuti batas unggah global paket gratis Supabase. Bila paket Anda lebih besar, naikkan `file_size_limit` di migrasi 003 **dan** `VIDEO_MAX_BYTES` di `web/src/lib/mediaStorage.ts`. Video yang lebih besar sebaiknya memakai tautan YouTube.
4. Video MOV (iPhone/HEVC) tidak diterima karena tidak diputar di semua perangkat; ekspor ke MP4 terlebih dulu. Aplikasi mobile memutar video unggahan lewat `VideoFilePlayer` (elemen `<video>` di dalam WebView), jadi tidak perlu build native ulang.

**Pembersihan file di storage:** file ikut terhapus dari storage (setelah operasi database berhasil) saat (1) media dibuang dari naskah lalu bab disimpan, (2) bab dihapus, atau (3) modul dihapus. File yang masih dirujuk bab lain tidak dihapus, dan kegagalan pembersihan hanya dicatat di konsol (tidak menggagalkan simpan/hapus). File yang diunggah lalu editnya dibatalkan tetap ada selama drafnya masih tersimpan di browser.

**Editor bab:** Tambah/Edit Bab membuka halaman editor penuh bergaya dokumen (WYSIWYG, berbasis TipTap): toolbar format (judul 1-3, tebal, miring, kode, tautan, daftar poin/bernomor, Tips emas, blok kode, garis pemisah), foto dan video tampil langsung di tulisan (keterangan foto diketik di bawah foto). Seret file atau tempel (Ctrl+V) gambar ke halaman untuk langsung mengunggah. Ctrl/Cmd+S menyimpan; tombol Kembali meminta konfirmasi bila ada perubahan belum disimpan (draf tersimpan di browser). Hasil disimpan tetap sebagai teks format ringan (`## judul`, `- poin`, `> tips`, `![foto](url)`, URL video per baris), sehingga aplikasi mobile dan data lama tidak berubah. Fitur yang tidak didukung mobile (rata tengah, warna, garis bawah, daftar bersarang, tebal+miring sekaligus) sengaja tidak tersedia.

**Pindah ke Cloudflare R2 nanti:** kode unggah memakai antarmuka `MediaStorageDriver` di `web/src/lib/mediaStorage.ts`, jadi UI tidak perlu diubah. Yang perlu ditambahkan: driver `r2` dan Cloudflare Pages Function (mis. `web/functions/api/upload-url.ts`) yang memverifikasi JWT Supabase + role admin lalu mengembalikan presigned PUT URL (S3 API). Untuk video besar, gunakan multipart upload. Kunci R2 hanya boleh ada di Function, bukan di variabel `VITE_*`.

Login membutuhkan akun Supabase yang memiliki hak admin (`role = 'admin'`) dan tidak berstatus suspended. Menjalankan web hanya menyalakan frontend; itu tidak membuat akun admin atau mengatur hak akses Supabase.

## Build dan preview

Untuk memeriksa TypeScript dan membuat build produksi dari root:

```bash
npm run build:web
```

Untuk menjalankan hasil build secara lokal:

```bash
cd web
npm run preview
```

Vite akan menampilkan alamat preview di terminal. Untuk deploy, host web perlu mendukung fallback SPA agar URL seperti `/admin/login` tetap diarahkan ke `index.html`.

## Troubleshooting

- **`npm start` malah membuka Expo/mobile:** gunakan `npm run start:web` dari root repository.
- **Node.js tidak didukung:** perbarui Node.js ke versi minimal 20.19 atau 22.12, lalu buka terminal baru dan cek dengan `node -v`.
- **Tidak bisa login atau data admin gagal dimuat:** pastikan URL dan anon/public key di `web/.env` benar, akun tersedia di Supabase, serta role akun adalah `admin` dan statusnya tidak suspended.
- **Port 5173 sudah dipakai:** gunakan alamat port alternatif yang ditampilkan Vite di terminal.
- **Perubahan `.env` tidak terbaca:** hentikan server dengan `Ctrl+C`, lalu jalankan kembali `npm run start:web`.
