# PALTI FX — Monorepo Workspace

Aplikasi pendamping trading forex premium (*exclusive VIP community*) berbasis mobile (**Expo / React Native**) dengan integrasi cloud database **Supabase** (Auth, PostgreSQL, Row Level Security) serta server API pendukung (**Express + TypeScript**).

---

## 🌟 Fitur Utama Sistem

1. **Sistem Autentikasi Eksklusif Berbasis Undangan (*Zero Public Registration*)**:
   - Pendaftaran mandiri publik ditiadakan. Akun hanya bisa dibuat menggunakan **Kode Undangan VIP** aktif.
   - Mendukung **Dual Identifier**: Masuk menggunakan alamat **Email** atau **ID Member Unik** (`PFX-XXXXXXXX`).
   - Fitur pemulihan kata sandi modern menggunakan kode OTP 6-digit ke email.

2. **Hak Akses Berbasis Peran (*Role-Based Access Control / RBAC*)**:
   - **Akun Member** (`role: 'member'`): Membaca materi kurikulum, menonton video analisa, mencatat jurnal trading, kalkulator lot/risiko, dan mengumpulkan medali pencapaian.
     - *Akun Testing Resmi*: `diorahmanputra@gmail.com` (Kode Undangan: `PFX-MEMBER-VIP`)
   - **Akun Admin** (`role: 'admin'`): Memiliki seluruh akses member ditambah hak kelola penuh kurikulum edukasi langsung dari smartphone.
     - *Akun Testing Resmi*: `dioraput@gmail.com` (Kode Undangan: `PFX-ADMIN-VIP`)

3. **Manajemen Edukasi & Multi-Video YouTube Dinamis**:
   - Admin dapat menambah, mengedit judul/isi/ikon, dan menghapus Modul & Bab langsung dari HP.
   - **Fleksibilitas Video YouTube**: Admin dapat menyematkan 0, 1, hingga banyak video per bab (mendukung format link YouTube standar, tautan pendek `youtu.be`, maupun YouTube Shorts).
   - Pengatur urutan praktis satu sentuhan menggunakan tombol panah `[⬆️]` dan `[⬇️]`.
   - Dilengkapi *Speed Toolbar* template Markdown cepat serta modal konfirmasi keamanan (*Unsaved Changes Alert* dan konfirmasi hapus).

4. **Ketahanan Data Cloud (*Cloud Persistence & Auto-Sync*)**:
   - **Anti-Hilang Data**: Seluruh progres bab selesai (`user_lesson_progress`), medali pencapaian (`user_achievements`), riwayat jurnal (`user_trades`), dan nama panggilan diselaraskan ke database cloud Supabase.
   - Jika aplikasi di-uninstall, ponsel di-reset, atau pengguna berganti HP, seluruh data otomatis pulih saat login kembali.
   - Dilindungi **Row Level Security (RLS)** ketat: setiap pengguna hanya dapat membaca dan mengubah datanya sendiri.

---

## 📁 Struktur Direktori Monorepo

```
palti-fx/
├── frontend/                     # Aplikasi Mobile Expo / React Native
│   ├── assets/                   # Ikon, splash screen, logo brand
│   ├── src/
│   │   ├── components/           # Komponen UI (YouTubePlayer, EduEditorModals, Medal, dll)
│   │   ├── context/              # EduContext (State manajemen modul & bab online)
│   │   ├── data/                 # Modul edukasi default & kamus kuis
│   │   ├── lib/                  # Service (AuthService, UserSyncService, EduService, Store)
│   │   ├── screens/              # Halaman aplikasi (Login, Edu, Home, Journal, Tools, dll)
│   │   └── theme/                # Tema warna emas gelap & tipografi Plus Jakarta Sans
│   ├── tests/                    # Unit testing (Kalkulator lot, Streak, Auth, Storage)
│   ├── App.tsx                   # Root component & Session Bootstrapper
│   ├── app.json                  # Konfigurasi Expo & EAS Build
│   └── package.json              # Dependensi frontend (@palti-fx/frontend)
│
├── backend/                      # Server API RESTful & Migrasi Database
│   ├── supabase/                 # Skema SQL Supabase lengkap
│   │   ├── schema.sql            # Master schema (Auth, Profiles, Invitations, Edu, User Data)
│   │   ├── edu_schema.sql        # Skema CRUD edukasi, video YouTube, & seed materi
│   │   └── user_data_schema.sql  # Skema progres bab, medali pencapaian, & jurnal RLS
│   ├── src/                      # API Express TypeScript (Controllers, Routes, Middlewares)
│   ├── package.json              # Dependensi backend (@palti-fx/backend)
│   └── tsconfig.json             # Konfigurasi TypeScript backend
│
├── AuthFlow.md                   # Blueprint arsitektur auth, RBAC, CRUD edukasi, & sync cloud
├── LoginFlow.md                  # Spesifikasi alur UI/UX login, onboarding, OTP, & aktivasi
├── PANDUAN-BUILD-APK.md          # Panduan kompilasi APK standalone menggunakan EAS Cloud
└── package.json                  # Root monorepo workspace scripts
```

---

## ⚡ Panduan Menjalankan Proyek

### 1. Prasyarat (*Prerequisites*)
- Node.js (v20+ disarankan)
- Proyek akun [Supabase](https://supabase.com) (URL & Anon Key)

### 2. Konfigurasi Environment
Pastikan file `.env` di folder `frontend/` telah berisi kredensial Supabase Anda:
```env
EXPO_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
```

### 3. Migrasi Skema Database di Supabase
1. Buka **Supabase Dashboard** -> Masuk menu **SQL Editor**.
2. Buat query baru, salin isi file [`backend/supabase/schema.sql`](file:///c:/Work/palti-fx/palti-fx/backend/supabase/schema.sql) (atau file parsial [`edu_schema.sql`](file:///c:/Work/palti-fx/palti-fx/backend/supabase/edu_schema.sql) dan [`user_data_schema.sql`](file:///c:/Work/palti-fx/palti-fx/backend/supabase/user_data_schema.sql)).
3. Klik **Run**. Skrip akan otomatis membuat tabel-tabel, pemicu (*triggers*), aturan keamanan (RLS), materi kurikulum awal, serta undangan VIP untuk akun pengujian.

### 4. Menjalankan Aplikasi Frontend (Mobile Expo)
Dari root monorepo:
```bash
npm run start:frontend
# atau cukup:
npm start
```
Atau langsung dari folder frontend:
```bash
cd frontend
npm run dev
```
- Tekan `w` untuk membuka di browser Web.
- Tekan `a` untuk membuka di emulator Android.
- Pindai QR Code dengan aplikasi **Expo Go** pada ponsel fisik Anda.

### 5. Menjalankan Backend API Server (Opsional / Development)
Dari root monorepo:
```bash
npm run start:backend
```
Server berjalan di `http://localhost:5000` (Health check: `http://localhost:5000/health`).

---

## 🧪 Validasi Kualitas Kode & Pengujian

Seluruh skrip pengujian dan linter dapat dijalankan langsung dari root workspace:

```bash
# Menjalankan seluruh unit test frontend (Kalkulator, Streak, Auth, Storage)
npm run test:frontend

# Menjalankan linter ESLint frontend
npm run lint:frontend

# Validasi typecheck TypeScript frontend
cd frontend && npx tsc --noEmit

# Mengompilasi backend TypeScript ke dist/
npm run build:backend
```

---

## 📚 Dokumentasi Terkait

- 📘 [`AuthFlow.md`](file:///c:/Work/palti-fx/palti-fx/AuthFlow.md): Spesifikasi mendalam arsitektur autentikasi, RBAC admin/member, YouTube embeds, dan sinkronisasi database cloud.
- 📙 [`LoginFlow.md`](file:///c:/Work/palti-fx/palti-fx/LoginFlow.md): Rincian menyeluruh 6 layar auth (Splash, Onboarding, Login, OTP, Sandi Baru, Aktivasi).
- 📱 [`PANDUAN-BUILD-APK.md`](file:///c:/Work/palti-fx/palti-fx/PANDUAN-BUILD-APK.md): Tutorial step-by-step membuat file installer APK Android via EAS Build.
