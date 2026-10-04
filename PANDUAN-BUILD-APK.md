# Panduan Lengkap Build APK PALTI FX (Android Standalone)

Panduan ini menjelaskan cara membuat file installer **APK Android (`.apk`)** untuk aplikasi PALTI FX menggunakan layanan **EAS Build (Expo Application Services)** di cloud.

> 💡 **Kelebihan EAS Build:**
> Kompilasi kode dilakukan di server cloud Expo, sehingga laptop/PC Anda **tidak memerlukan Android Studio, Java SDK, ataupun spesifikasi komputer yang berat**.

---

## 📋 Prasyarat (*Prerequisites*)

1. **Node.js LTS** (Versi 20 ke atas disarankan): Unduh di [nodejs.org](https://nodejs.org).
2. **Akun Expo Gratis**: Daftar di [expo.dev/signup](https://expo.dev/signup) jika belum memiliki akun.
3. **Koneksi Internet Aktif**: Untuk mengunggah kode dan memantau status kompilasi di cloud.

---

## 🚀 Langkah-Langkah Build APK

### 1. Buka Terminal di Folder Frontend

Aplikasi mobile berada di dalam folder `frontend/` pada monorepo PALTI FX.

1. Buka terminal (PowerShell / Command Prompt / Git Bash).
2. Masuk ke direktori `frontend`:
   ```bash
   cd c:\Work\palti-fx\palti-fx\frontend
   ```

---

### 2. Pastikan Kredensial Supabase Terpasang

Pastikan file `frontend/.env` sudah ada dan memuat kredensial Supabase proyek Anda:

```env
EXPO_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
```

> ⚠️ **Catatan Penting:** Variabel yang diawali dengan `EXPO_PUBLIC_` akan otomatis disematkan oleh EAS ke dalam bundle APK saat build berjalan, sehingga aplikasi APK dapat terhubung ke database Supabase secara langsung.

---

### 3. Validasi Kode Bebas Error (*Pre-flight Check*)

Sebelum memulai antrean build di cloud, pastikan kode TypeScript dan linter bersih tanpa error:

```bash
# 1. Typecheck TypeScript
npx tsc --noEmit

# 2. Linter ESLint
npm run lint
```
*Pastikan kedua perintah di atas selesai dengan 0 error.*

---

### 4. Login ke Akun Expo

Jalankan perintah login EAS CLI:

```bash
npx eas-cli@latest login
```
- Masukkan **Email / Username** dan **Password** akun Expo Anda.

---

### 5. Jalankan Perintah Build APK

Eksekusi perintah pembuatan APK dengan profil `preview`:

```bash
npx eas-cli@latest build -p android --profile preview
```

#### Pertanyaan Interaktif (Hanya Muncul Saat Build Pertama Kali):
1. **"Would you like to automatically create an EAS project for @username/palti-fx?"**  
   👉 Ketik **`Y`** lalu Enter.
2. **"Generate a new Android Keystore?"**  
   👉 Ketik **`Y`** lalu Enter *(Expo akan membuat dan menyimpan kunci sertifikat penandatanganan aplikasi Anda secara aman di cloud)*.

---

### 6. Proses Kompilasi di Cloud (~10–15 Menit)

Setelah kode diunggah, server Expo akan memproses build:
- Terminal akan menampilkan tautan live progress dashboard, misalnya:  
  `https://expo.dev/accounts/username/projects/palti-fx/builds/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Anda dapat menutup terminal jika diinginkan, karena proses berjalan independen di server Expo.

---

### 7. Unduh & Instal File APK

Ketika proses build selesai, terminal (dan dashboard web Expo) akan menampilkan:
1. **Tautan Unduh File APK langsung (`.apk`)**.
2. **Kode QR**: Pindai langsung menggunakan kamera HP Android Anda untuk mengunduh installer.

#### Cara Instal di HP Android:
1. Buka file `.apk` yang telah diunduh di ponsel Android.
2. Jika muncul peringatan keamanan sistem:
   - Pilih **Setelan / Settings** -> Aktifkan **"Izinkan dari sumber ini"** (*Install unknown apps*).
3. Klik **Instal**.
4. Aplikasi **PALTI FX** siap digunakan dan dapat dibagikan kepada seluruh member!

---

## 🔄 Pembaruan Materi Tanpa Perlu Build Ulang APK!

> 🎉 **Keunggulan Sistem Baru PALTI FX:**
> Seluruh kurikulum edukasi (Modul, Bab, Teks Markdown, dan Embed Video YouTube) sekarang **tersimpan live di Database Cloud Supabase**.

- **Admin mengedit/menambah materi?**  
  Admin cukup membuka aplikasi di HP dengan akun `dioraput@gmail.com`, lalu menambah/mengedit modul dan bab secara langsung. Materi seketika diperbarui untuk seluruh member **tanpa perlu build APK baru**.
- **Kapan perlu build APK ulang?**  
  Build APK baru **HANYA** diperlukan jika ada:
  1. Perubahan logika kodingan frontend lokal / penambahan library native baru.
  2. Perubahan desain visual UI inti atau logo ikon aplikasi.
  3. Pembaruan nomor versi rilis aplikasi.

---

## 📦 Penomoran Versi Aplikasi Saat Rilis Baru

Jika Anda melakukan perubahan kode aplikasi dan ingin membuat update APK baru:

1. Buka file [`frontend/app.json`](file:///c:/Work/palti-fx/palti-fx/frontend/app.json).
2. Naikkan versi aplikasi pada bagian:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2
   }
   ```
3. Jalankan kembali perintah:
   ```bash
   npx eas-cli@latest build -p android --profile preview
   ```

---

## 🌐 Rilis ke Google Play Store (*Production*)

Jika nantinya aplikasi PALTI FX ingin dipublikasikan resmi ke Google Play Store:

1. Butuh akun Google Play Developer ($25 sekali bayar).
2. Jalankan perintah kompilasi bundel `.aab`:
   ```bash
   npx eas-cli@latest build -p android --profile production
   ```
3. Unduh file `.aab` yang dihasilkan dan unggah ke **Google Play Console**.
