# PALTI FX — Landing Page Standalone Module

Modul landing page resmi untuk ekosistem **PALTI FX (Private Forex Trading Community & Academy)**.
Modul ini telah dipisahkan sebagai project frontend standalone yang mandiri dan siap dideploy di platform hosting statis apa pun (Vercel, Netlify, Cloudflare Pages, VPS, dll.).

---

## 🚀 Fitur Utama Modul
1. **Header Adaptif**: Navigasi responsif dengan efek blur dan deteksi kontras dinamis pada area light/dark section.
2. **Hero Section Eksklusif**: Presentasi branding kelas institusional, statistik ekosistem PALTI FX, dan tombol call-to-action (CTA).
3. **Horizontal Scroll Showcase**: Navigasi horizontal interaktif (scroll-hijacking terkontrol) yang memamerkan 6 pilar inovasi aplikasi mobile:
   - 01: Kurikulum Bertingkat
   - 02: Kalkulator Risiko & Lot Presisi
   - 03: Jurnal Transaksi Cloud & Evaluasi Psikologi
   - 04: Gamifikasi, Streak & Medali
   - 05: Proteksi Immutabilitas Data (Wasalaam Rule)
   - 06: Jam Sesi Pasar Forex Global Real-time
4. **Alur Aktivasi VIP**: Panduan 3 langkah mudah untuk bergabung menjadi anggota resmi.
5. **Akses Portal Admin**: Tombol pintas navigasi ke Web Admin Console.

---

## 🛠️ Prasyarat
- **Node.js**: Versi 18+ atau 20+
- **NPM** atau **Yarn** / **PNPM**

---

## 💻 Panduan Menjalankan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Mode Pengembangan (Local Dev Server)
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5174`.

### 3. Konfigurasi URL Admin (Opsional)
Jika ingin mengarahkan tombol "Portal Admin" ke alamat hosting web admin tertentu, buat file `.env` di root folder ini:
```env
VITE_ADMIN_URL=https://admin.paltifx.com
```

### 4. Build untuk Produksi
```bash
npm run build
```
Hasil build produksi siap saji akan berada di folder `dist/`.
Folder `dist/` dapat langsung di-upload ke Vercel, Netlify, Cloudflare Pages, atau server web Nginx/Apache.
