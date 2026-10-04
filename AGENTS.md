# AGENTS.md — Petunjuk & Aturan Pengembang AI (Antigravity / Agentic Coding)

Dokumen ini berisi arsitektur inti, aturan proyek, alur kerja, dan konvensi baku monorepo **PALTI FX** yang **WAJIB** dipatuhi oleh seluruh AI Agent.

---

## 📁 Ikhtisar Monorepo

Monorepo ini terdiri dari 2 workspace utama:
- `mobile/`: Aplikasi mobile berbasis **Expo / React Native** (React 19, TypeScript) serta skema database **Supabase PostgreSQL** (`mobile/supabase/`). Mengedepankan pola *mobile-first*, estetika *glassmorphism* bertema *gold/dark*, performa responsif, dan kompabilitas lintas platform (Android, iOS, Web).
- `web/`: Portal Web Publik (Landing Page) & Backoffice Admin (**React 19 + Vite + TypeScript**). Dikhususkan untuk input kurikulum edukasi skala besar (CRUD Modul & Bab, Multi-Video YouTube, live preview), generator kode undangan VIP otomatis/kustom, serta monitoring akun member.

---

## 🛠️ Perintah Workspace Baku (Commands)

Jalankan perintah dari direktori root atau workspace terkait:

```bash
# Mobile (Expo / React Native App)
npm run start:mobile          # Jalankan mobile dev server dari root
npm run lint:mobile           # Linter ESLint mobile app
npm run test:mobile           # Unit test mobile (kalkulator, streak, auth, storage)
cd mobile && npx tsc --noEmit # Typecheck TypeScript mobile app
cd mobile && npm run start    # Jalankan Expo dev server langsung dari mobile/

# Web (Landing Page & Admin Backoffice)
npm run start:web             # Jalankan web portal dalam dev mode (Vite)
npm run build:web             # Kompilasi web TypeScript & bundle production
cd web && npm run build       # Typecheck & build production workspace web
```

> **Wajib:** Jalankan `npm run lint:mobile`, `cd mobile && npx tsc --noEmit`, dan `npm run build:web` sebelum menyatakan tugas selesai (*Definition of Done*).

---

## 🔐 Arsitektur Autentikasi, Keamanan & RBAC

1. **Sistem Tertutup Berbasis Undangan (*Zero Public Registration*)**:
   - Pendaftaran akun Member baru wajib divalidasi via kode undangan resmi di tabel `public.invitations`.
   - **Admin Tanpa Kode Undangan**: Administrator login langsung menggunakan Email & Kata Sandi tanpa memerlukan kode undangan. Kode undangan hanya untuk calon Member biasa.
   - Mendukung **Dual Identifier**: Pengguna dapat masuk menggunakan **Email** atau **ID Member Unik** (`PFX-XXXXXXXX`).
2. **Role-Based Access Control (RBAC)**:
   - `role === 'admin'`: Hak istimewa untuk mengelola kurikulum edukasi (CRUD Modul & Bab, sematkan video YouTube, ubah urutan materi `[⬆️]` `[⬇️]`).
     - *Akun Testing Resmi Admin*: `dioraput@gmail.com` (Login langsung via Email & Password, tanpa kode undangan).
   - `role === 'member'`: Hak akses belajar (*read-only*), pencatatan jurnal transaksi, kalkulator risiko, dan pencapaian medali.
     - *Akun Testing Resmi Member*: `diorahmanputra@gmail.com` (Kode Undangan: `PFX-MEMBER-VIP`).
   - Tombol-tombol aksi pengelolaan konten admin tidak boleh ditampilkan (*zero-render*) untuk akun member.

---

## ☁️ Ketahanan Data Cloud (*Cloud Persistence & Auto-Sync*)

1. **Pemisahan Data Cloud & Cache Lokal Permanen**:
   - Data kritis pengguna: Progres bab selesai (`public.user_lesson_progress`), catatan jurnal (`public.user_trades`), dan nama profil disinkronkan ke Supabase Cloud via [`UserSyncService`](file:///c:/Work/palti-fx/palti-fx/mobile/src/lib/userSyncService.ts).
   - **Medali Pencapaian (Achievement)**: Disimpan permanen di penyimpanan lokal perangkat terisolasi per-akun (`@pfx_achievements_user_${userKey}`). Tidak disimpan di Supabase agar database cloud tetap ramping, hemat query, dan ringan.
2. **Pola Offline-First**:
   - Perbarui state lokal dan `AsyncStorage` secara instan (0ms latency), lalu jalankan sinkronisasi latar belakang (`upsert`) ke Supabase.
   - Saat startup dan pasca-login, fungsi `syncFromCloud()` dipanggil untuk menarik data cloud dan mengunggah data lokal yang dibuat saat offline.
3. **Pembersihan Bersih Saat Logout**:
   - Saat fungsi `logout()` dieksekusi, kosongkan memori state aktif (`trades`, `completed`, `unlocked`, `name`, `activeUser`) untuk mencegah kebocoran sesi. Cache medali akun di disk lokal tetap aman tersimpan untuk akun tersebut dan tidak tertimpa saat akun lain login.

---

## 📚 Manajemen Modul Edukasi & YouTube Multi-Video

1. **YouTube Embeds Fleksibel**:
   - Modul bab mendukung array link video (`youtube_urls text[]`).
   - Wajib mendukung 0 video (bacaan murni), 1 video utama, hingga banyak video (carousel tab selektor).
   - Gunakan parser URL serbaguna (mendukung link standar `watch?v=`, tautan pendek `youtu.be`, maupun `shorts/`).
   - Gunakan `react-native-webview` untuk Android/iOS dan `<iframe>` untuk Web.
2. **Pengaman Form Admin**:
   - Form editor modul & bab wajib mendeteksi perubahan (*dirty check*). Jika admin menekan tombol kembali/batal sebelum menyimpan, wajib tampilkan dialog konfirmasi (*Unsaved Changes Alert*).
   - Operasi hapus modul/bab wajib memicu dialog konfirmasi hapus (*Delete Safeguard*).
   - Pengaturan urutan bab/modul menggunakan tombol panah `[⬆️]` dan `[⬇️]`.

---

## 📱 Navigasi & Native Modules (Expo SDK 57)

- Navigasi utama ditangani oleh sistem navigasi terpadu (`src/nav.tsx` & `App.tsx`) dengan animasi transisi native.
- **Continuous Native Generation (CNG)**: Folder `ios/` dan `android/` dihasilkan otomatis oleh prebuild. Dilarang mengedit folder tersebut secara manual — konfigurasikan perilaku native di `app.json` dan config plugins.
- **EAS Build**: Pembuatan paket aplikasi Android (APK) dilakukan via EAS Cloud (`npx eas-cli@latest build --profile preview --platform android`). Lihat tutorial lengkap di [`PANDUAN-BUILD-APK.md`](file:///c:/Work/palti-fx/palti-fx/PANDUAN-BUILD-APK.md).

---

## 📖 Referensi Dokumentasi Arsitektur

- 📘 [`AuthFlow.md`](file:///c:/Work/palti-fx/palti-fx/AuthFlow.md): Blueprint arsitektur autentikasi, RBAC, CRUD edukasi, dan sinkronisasi cloud.
- 📙 [`LoginFlow.md`](file:///c:/Work/palti-fx/palti-fx/LoginFlow.md): Spesifikasi lengkap 6 layar auth (Splash, Onboarding, Login, OTP, Sandi Baru, Aktivasi).
- 🗄️ [`mobile/supabase/schema.sql`](file:///c:/Work/palti-fx/palti-fx/mobile/supabase/schema.sql): Skema master basis data PostgreSQL & RLS.
