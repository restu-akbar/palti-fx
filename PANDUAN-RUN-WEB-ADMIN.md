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
