# Panduan Lengkap PALTI FX: Menjalankan (Run Dev) & Build APK

Satu monorepo untuk seluruh ekosistem **PALTI FX**:
- **`mobile/`** : Aplikasi Mobile Trader (Expo / React Native untuk Android & iOS).
- **`web/`** : Web Admin Portal (React + Vite untuk manajemen member, edukasi video, dan kode undangan).

---

## 0. Prasyarat & Persiapan Awal

1. **Node.js LTS** (Disarankan Node.js v20 ke atas): Unduh di [nodejs.org](https://nodejs.org).
2. **Akun Expo Gratis**: Daftar di [expo.dev/signup](https://expo.dev/signup) (hanya untuk build APK mobile).
3. Buka terminal di folder root project (`c:\Work\palti-fx\palti-fx`).
4. Install semua dependensi di monorepo:
   ```bash
   npm install
   ```

---

## 1. Cara Menjalankan Aplikasi (Development / Run)

### 📋 Cheatsheet Perintah Cepat

| Target | Dari Folder Root | Atau dari Sub-folder | Akses / Keterangan |
|---|---|---|---|
| **Web Admin Portal** | `npm run start:web` | `cd web` lalu `npm run dev` | **`http://localhost:5173`** (Browser) |
| **Mobile App (Metro)** | `npm run start:mobile` | `cd mobile` lalu `npm start` | Scan QR code di Expo Go |
| **Mobile Android** | `npm run android` | `cd mobile` lalu `npm run android` | Emulator / USB Device |
| **Mobile iOS** | `npm run ios` | `cd mobile` lalu `npm run ios` | iOS Simulator (macOS) |

---

### 🖥️ A. Menjalankan Web Admin Portal (Vite + React)

Web Admin digunakan oleh pengelola untuk mengelola member, kode undangan VIP, dan materi modul YouTube.

#### Cara 1: Langsung dari Folder Root
```bash
npm run start:web
```

#### Cara 2: Dari dalam Folder `web/`
```bash
cd web
npm run dev
```

> ⚠️ **Penting**: Di dalam folder `web`, gunakan perintah **`npm run dev`** (bukan `npm start`), karena bundler yang digunakan adalah **Vite**.

- Web Admin otomatis aktif di: **`http://localhost:5173`**
- Buka browser Anda dan akses tautan tersebut.
- Fitur Hot Reload aktif: setiap perubahan file di `web/src/` otomatis ter-update di layar browser.

#### Build & Preview Hasil Produksi Web Admin:
```bash
cd web
npm run build
npm run preview
```

---

### 📱 B. Menjalankan Mobile App (Expo Go & Emulator)

#### Opsi 1: Menggunakan Expo Go di HP (Paling Praktis, Tanpa Android Studio)
1. Install aplikasi **Expo Go** dari Google Play Store (Android) atau App Store (iOS).
2. Jalankan Metro Bundler:
   ```bash
   npm run start:mobile
   ```
   *(atau masuk ke `cd mobile` lalu `npm start`)*
3. Pastikan HP dan laptop di **Wi-Fi yang sama**.
   - **Android**: Buka aplikasi Expo Go -> tap **"Scan QR code"** -> scan QR di terminal.
   - **iOS**: Buka aplikasi **Kamera bawaan** iPhone -> scan QR di terminal -> buka notifikasi Expo Go.
4. Jika beda jaringan / terhalang firewall, tambahkan flag tunnel:
   ```bash
   cd mobile
   npx expo start --tunnel
   ```

#### Opsi 2: Menggunakan Emulator Android di Laptop
1. Nyalakan Emulator Android (AVD di Android Studio).
2. Jalankan:
   ```bash
   npm run android
   ```
   *(atau saat Metro berjalan, tekan tombol `a` di keyboard).*

#### Tombol Pintasan Interaktif di Terminal Mobile (`npm start`):
- `a` : Buka di Android emulator/device
- `i` : Buka di iOS simulator
- `r` : Reload aplikasi
- `m` : Tampilkan developer menu di perangkat
- `c` : Tampilkan ulang QR code

---

## 2. Build APK Android Mandiri (EAS Cloud)

Untuk membuat file installer `.apk` yang bisa dibagikan langsung ke pengguna tanpa perlu install Expo Go:

### Langkah 1: Masuk ke Folder `mobile/`
```bash
cd c:\Work\palti-fx\palti-fx\mobile
```

### Langkah 2: Login ke Akun Expo
```bash
npx eas-cli@latest login
```
Masukkan username/email dan password akun Expo Anda.

### Langkah 3: Jalankan Build APK Preview
```bash
npx eas-cli@latest build -p android --profile preview
```

#### Pertanyaan Interaktif (Build Pertama Kali):
1. *"Would you like to automatically create an EAS project?"* 👉 Ketik **`Y`** lalu Enter.
2. *"Generate a new Android Keystore?"* 👉 Ketik **`Y`** lalu Enter.

### Langkah 4: Unduh & Install APK
- Tunggu proses build selesai di server cloud Expo (~10–15 menit).
- Terminal akan menampilkan link download file `.apk` dan QR code.
- Download di ponsel Android, aktifkan izin *"Install unknown apps"*, dan install aplikasi.

---

## 3. Rilis ke Google Play Store (Production)

Untuk merilis aplikasi resmi ke Google Play Store:

1. Jalankan build dengan profil `production`:
   ```bash
   cd mobile
   npx eas-cli@latest build -p android --profile production
   ```
2. Hasilnya berupa file Android App Bundle (`.aab`).
3. Upload file `.aab` tersebut ke akun Google Play Console.
4. **Setiap merilis update baru**: Naikkan `version` dan `android.versionCode` di [`mobile/app.json`](file:///c:/Work/palti-fx/palti-fx/mobile/app.json), lalu jalankan perintah build kembali.

---

## 4. Pembaruan Materi Edukasi Secara Live (Tanpa Re-build APK)

Seluruh kurikulum edukasi (Modul, Bab, Teks Markdown, dan Embed Video YouTube) tersimpan secara real-time di Database Supabase.
- Pengelola dapat mengedit, menambah, atau menghapus materi langsung melalui **Web Admin Portal (`http://localhost:5173`)** atau dari akun admin di aplikasi.
- Perubahan materi akan langsung tampil ke seluruh member tanpa perlu kompilasi ulang APK!
