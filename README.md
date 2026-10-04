# PALTI FX — Monorepo Workspace

Aplikasi pendamping trading forex premium (*exclusive VIP community*) berbasis mobile (**Expo / React Native**) dengan integrasi cloud database **Supabase** (Auth, PostgreSQL, Row Level Security) serta portal web landing page dan backoffice admin (**React 19 + Vite**).

---

## 🌟 Fitur Utama Sistem

1. **Sistem Autentikasi Eksklusif Berbasis Undangan (*Zero Public Registration*)**:
   - Pendaftaran mandiri publik ditiadakan. Akun hanya bisa dibuat menggunakan **Kode Undangan VIP** aktif.
   - Mendukung **Dual Identifier**: Masuk menggunakan alamat **Email** atau **ID Member Unik** (`PFX-XXXXXXXX`).
   - Fitur pemulihan kata sandi modern menggunakan kode OTP 6-digit ke email.

2. **Hak Akses Berbasis Peran (*Role-Based Access Control / RBAC*)**:
   - **Akun Member** (`role: 'member'`): Membaca materi kurikulum, menonton video analisa, mencatat jurnal trading, kalkulator lot/risiko, dan mengumpulkan medali pencapaian.
     - *Akun Testing Resmi*: `diorahmanputra@gmail.com` (Kode Undangan: `PFX-MEMBER-VIP`)
   - **Akun Admin** (`role: 'admin'`): Memiliki seluruh akses member ditambah hak kelola penuh kurikulum edukasi, generator kode undangan VIP, dan pemantauan member.
     - *Akun Testing Resmi*: `dioraput@gmail.com` (Kode Undangan: `PFX-ADMIN-VIP`)

3. **Manajemen Edukasi & Multi-Video YouTube Dinamis**:
   - Admin dapat mengelola Modul & Bab langsung dari Web Admin Backoffice maupun dari aplikasi mobile.
   - **Fleksibilitas Video YouTube**: Mendukung 0, 1, hingga banyak video per bab (mendukung format link YouTube standar, tautan pendek `youtu.be`, maupun YouTube Shorts).
   - Pengatur urutan praktis satu sentuhan menggunakan tombol panah `[⬆️]` dan `[⬇️]`.
   - Dilengkapi live student preview, dirty check safeguard, dan modal konfirmasi hapus.

4. **Ketahanan Data Cloud (*Cloud Persistence & Auto-Sync*)**:
   - **Anti-Hilang Data**: Seluruh progres bab selesai (`user_lesson_progress`), medali pencapaian (`user_achievements`), riwayat jurnal (`user_trades`), dan nama panggilan diselaraskan ke database cloud Supabase.
   - Jika aplikasi di-uninstall, ponsel di-reset, atau pengguna berganti HP, seluruh data otomatis pulih saat login kembali.
   - Dilindungi **Row Level Security (RLS)** ketat: setiap pengguna hanya dapat membaca dan mengubah datanya sendiri.

---

## 📁 Struktur Direktori Monorepo

```
palti-fx/
├── mobile/                       # Aplikasi Mobile Expo / React Native & Database Schema
│   ├── assets/                   # Ikon, splash screen, logo brand PALTI FX
│   ├── src/
│   │   ├── components/           # Komponen UI (YouTubePlayer, EduEditorModals, Medal, dll)
│   │   ├── context/              # EduContext (State manajemen modul & bab online)
│   │   ├── data/                 # Modul edukasi default & kamus kuis
│   │   ├── lib/                  # Service (AuthService, UserSyncService, EduService, Store)
│   │   ├── screens/              # Halaman aplikasi (Login, Edu, Home, Journal, Tools, dll)
│   │   └── theme/                # Tema warna emas gelap & tipografi Plus Jakarta Sans
│   ├── supabase/                 # Skema migrasi SQL Supabase (schema.sql, admin_web_schema.sql)
│   ├── tests/                    # Unit testing (Kalkulator lot, Streak, Auth, Storage)
│   ├── App.tsx                   # Root component & Session Bootstrapper
│   ├── app.json                  # Konfigurasi Expo & EAS Build
│   └── package.json              # Dependensi mobile (@palti-fx/mobile)
│
├── web/                          # Portal Web Publik & Backoffice Admin (React 19 + Vite)
│   ├── src/
│   │   ├── pages/                # LandingPage, AdminLogin, AdminLayout, AdminMateri, dll.
│   │   ├── components/admin/     # AdminSidebar (Fixed Navigation Module)
│   │   ├── lib/                  # adminAuth, adminMateri, adminInvitations, adminUsers
│   │   └── index.css             # Desain Sistem Frosted Transparent Glassmorphism
│   ├── vite.config.ts            # Konfigurasi Vite & Deduplikasi React Context
│   └── package.json              # Dependensi web (React 19, Lucide, Supabase JS)
│
├── DOKUMENTASI-SISTEM-LENGKAP.md # Master Technical Documentation (Full Version)
├── AuthFlow.md                   # Blueprint arsitektur auth, RBAC, CRUD edukasi, & sync cloud
├── LoginFlow.md                  # Spesifikasi alur UI/UX login, onboarding, OTP, & aktivasi
├── PANDUAN-BUILD-APK.md          # Panduan kompilasi APK standalone menggunakan EAS Cloud
├── AGENTS.md                     # Aturan baku & konvensi AI developer
└── package.json                  # Root monorepo workspace scripts
```

---

## ⚡ Panduan Menjalankan Proyek

### 1. Prasyarat (*Prerequisites*)
- Node.js (v20+ disarankan)
- Proyek akun [Supabase](https://supabase.com) (URL & Anon Key)

### 2. Konfigurasi Environment
Pastikan file `.env` di folder `mobile/` dan `web/` telah berisi kredensial Supabase Anda:
```env
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...

# web/.env
VITE_SUPABASE_URL=https://proyek-anda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
```

### 3. Migrasi Skema Database di Supabase
1. Buka **Supabase Dashboard** -> Masuk menu **SQL Editor**.
2. Buat query baru, salin isi file [`mobile/supabase/schema.sql`](file:///c:/Work/palti-fx/palti-fx/mobile/supabase/schema.sql) dan [`mobile/supabase/admin_web_schema.sql`](file:///c:/Work/palti-fx/palti-fx/mobile/supabase/admin_web_schema.sql).
3. Klik **Run**. Skrip akan otomatis membuat tabel-tabel, pemicu (*triggers*), aturan keamanan (RLS), materi kurikulum awal, serta undangan VIP untuk akun pengujian.

### 4. Menjalankan Aplikasi Mobile (Expo)
Dari root monorepo:
```bash
npm run start:mobile
# atau cukup:
npm start
```
Atau langsung dari folder mobile:
```bash
cd mobile
npm run start
```
- Tekan `w` untuk membuka di browser Web.
- Tekan `a` untuk membuka di emulator Android.
- Pindai QR Code dengan aplikasi **Expo Go** pada ponsel fisik Anda.

### 5. Menjalankan Portal Web & Admin Backoffice (Vite)
Dari root monorepo:
```bash
npm run start:web
```
Portal Web berjalan di `http://localhost:5173` (Admin: `http://localhost:5173/admin`).

---

## 🧪 Validasi Kualitas Kode & Pengujian

Seluruh skrip pengujian dan linter dapat dijalankan langsung dari root workspace:

```bash
# Menjalankan seluruh unit test mobile (Kalkulator, Streak, Auth, Storage)
npm run test:mobile

# Menjalankan linter ESLint mobile
npm run lint:mobile

# Validasi typecheck TypeScript mobile
cd mobile && npx tsc --noEmit

# Mengompilasi Web Portal & Admin ke dist/
npm run build:web
```

---

## 📚 Dokumentasi Terkait

- 📄 [`DOKUMENTASI-SISTEM-LENGKAP.md`](file:///c:/Work/palti-fx/palti-fx/DOKUMENTASI-SISTEM-LENGKAP.md): Master technical documentation lengkap dengan ERD, DDL, trigger, dan RPC.
- 📘 [`AuthFlow.md`](file:///c:/Work/palti-fx/palti-fx/AuthFlow.md): Spesifikasi mendalam arsitektur autentikasi, RBAC admin/member, YouTube embeds, dan sinkronisasi database cloud.
- 📙 [`LoginFlow.md`](file:///c:/Work/palti-fx/palti-fx/LoginFlow.md): Rincian menyeluruh 6 layar auth (Splash, Onboarding, Login, OTP, Sandi Baru, Aktivasi).
- 📱 [`PANDUAN-BUILD-APK.md`](file:///c:/Work/palti-fx/palti-fx/PANDUAN-BUILD-APK.md): Tutorial step-by-step membuat file installer APK Android via EAS Build.
