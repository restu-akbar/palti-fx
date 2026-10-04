# AGENTS.md — Petunjuk & Aturan Pengembang AI (Antigravity / Agentic Coding)

Dokumen ini berisi arsitektur inti, aturan proyek, alur kerja, dan konvensi baku monorepo **PALTI FX** yang **WAJIB** dipatuhi oleh seluruh AI Agent.

---

## 📁 Ikhtisar Monorepo

Monorepo ini terdiri dari:
- `frontend/`: Aplikasi mobile berbasis **Expo / React Native** (React 19, TypeScript). Mengedepankan pola *mobile-first*, estetika *glassmorphism* bertema *gold/dark*, performa responsif, dan kompabilitas lintas platform (Android, iOS, Web).
- `backend/`: Server RESTful API (**Node.js + Express + TypeScript**) serta skema migrasi database **Supabase PostgreSQL** (`backend/supabase/`).

---

## 🛠️ Perintah Workspace Baku (Commands)

Jalankan perintah dari direktori root atau workspace terkait:

```bash
# Frontend
npm run start:frontend          # Jalankan mobile dev server dari root
npm run lint:frontend           # Linter ESLint mobile app
npm run test:frontend           # Unit test mobile (kalkulator, streak, auth, storage)
cd frontend && npx tsc --noEmit # Typecheck TypeScript mobile app
cd frontend && npm run dev      # Jalankan Expo dev server langsung dari frontend/

# Backend
npm run start:backend           # Jalankan backend dalam dev mode (hot reload tsx)
npm run build:backend           # Kompilasi backend TypeScript ke folder dist/
cd backend && npx tsc --noEmit  # Typecheck TypeScript backend
```

> **Wajib:** Jalankan `lint:frontend` dan `cd frontend && npx tsc --noEmit` sebelum menyatakan tugas selesai (*Definition of Done*).

---

## 🔐 Arsitektur Autentikasi, Keamanan & RBAC

1. **Sistem Tertutup Berbasis Undangan (*Zero Public Registration*)**:
   - Pendaftaran mandiri ditiadakan. Pendaftaran akun baru wajib divalidasi via kode undangan di tabel `public.invitations`.
   - Mendukung **Dual Identifier**: Pengguna dapat masuk menggunakan **Email** atau **ID Member Unik** (`PFX-XXXXXXXX`).
2. **Role-Based Access Control (RBAC)**:
   - `role === 'admin'`: Hak istimewa untuk mengelola kurikulum edukasi (CRUD Modul & Bab, sematkan video YouTube, ubah urutan materi `[⬆️]` `[⬇️]`).
     - *Akun Testing Resmi Admin*: `dioraput@gmail.com` (Kode Undangan: `PFX-ADMIN-VIP`).
   - `role === 'member'`: Hak akses belajar (*read-only*), pencatatan jurnal transaksi, kalkulator risiko, dan pencapaian medali.
     - *Akun Testing Resmi Member*: `diorahmanputra@gmail.com` (Kode Undangan: `PFX-MEMBER-VIP`).
   - Tombol-tombol aksi pengelolaan konten admin tidak boleh ditampilkan (*zero-render*) untuk akun member.

---

## ☁️ Ketahanan Data Cloud (*Cloud Persistence & Auto-Sync*)

1. **Anti-Hilang Data (*The "Wasalaam" Rule*)**:
   - Dilarang hanya mengandalkan `AsyncStorage` lokal untuk data kritis pengguna.
   - Progres bab selesai (`public.user_lesson_progress`), medali pencapaian (`public.user_achievements`), catatan jurnal (`public.user_trades`), dan nama panggilan (`public.profiles.full_name`) **wajib** disinkronkan ke Supabase Cloud via [`UserSyncService`](file:///c:/Work/palti-fx/palti-fx/frontend/src/lib/userSyncService.ts).
2. **Pola Offline-First**:
   - Perbarui state lokal dan `AsyncStorage` secara instan (0ms latency), lalu jalankan sinkronisasi latar belakang (`upsert`) ke Supabase.
   - Saat startup dan pasca-login, fungsi `syncFromCloud()` wajib dipanggil untuk menarik data cloud dan mengunggah data lokal yang dibuat saat offline.
3. **Pembersihan Bersih Saat Logout**:
   - Saat fungsi `logout()` dieksekusi, kosongkan memori state dan storage lokal (`trades`, `completed`, `unlocked`, `name`, `activeUser`) untuk mencegah kebocoran data antar-pengguna di perangkat yang sama.

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
- 🗄️ [`backend/supabase/schema.sql`](file:///c:/Work/palti-fx/palti-fx/backend/supabase/schema.sql): Skema master basis data PostgreSQL & RLS.
