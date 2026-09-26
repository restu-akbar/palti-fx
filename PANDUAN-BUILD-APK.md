# Panduan Build & Menjalankan PALTI FX (Android / iOS / Web / Semua)

Satu codebase Expo untuk 3 platform. Build native (Android/iOS) dijalankan di server Expo (EAS),
jadi laptop tidak perlu Android Studio / Xcode. Build web berupa file statis di folder `dist/`.

> Waktu build EAS pertama kali: sekitar 20–30 menit (sebagian besar menunggu antrean).

## 0. Persiapan (sekali saja, semua platform)

1. Install **Node.js LTS** dari https://nodejs.org (pilih tombol "LTS", lalu Next sampai selesai).
2. Buat akun gratis di https://expo.dev/signup.
3. Ekstrak file `palti-fx-source.zip` ke folder, misalnya `C:\PaltiFX` (Windows) atau `~/palti-fx-source` (Linux/Mac).
4. Buka terminal di folder project:
   - Windows: buka folder di File Explorer, klik address bar, ketik `cmd`, tekan Enter.
   - Linux/Mac: `cd ~/palti-fx-source`.
5. Install dependensi:
   ```
   npm install
   ```
6. Login ke Expo (wajib untuk build EAS Android/iOS, opsional untuk web lokal):
   ```
   npx eas-cli@latest login
   ```
   Masukkan email/username dan password akun Expo.

## 1. Android

### 1a. Coba cepat tanpa build (Expo Go)

1. Install aplikasi **Expo Go** dari Play Store di HP.
2. Di laptop, jalankan:
   ```
   npx expo start
   ```
3. Scan QR code yang muncul memakai Expo Go (HP dan laptop harus di WiFi yang sama).

> Jika versi Expo Go di Play Store belum mendukung SDK 57, gunakan cara build APK di bawah.

### 1b. Build APK untuk dibagikan (preview / internal)

```
npx eas-cli@latest build -p android --profile preview
```

Pertanyaan saat build pertama:

- "Create an EAS project?" → **Y**
- "Generate a new Android Keystore?" → **Y** (Expo menyimpan kunci aplikasi dengan aman)

Setelah build selesai, terminal menampilkan **link download APK** dan QR code.
Buka link itu di HP Android, download, lalu install (izinkan "Install dari sumber tidak dikenal" jika diminta).
Link APK ini bisa dibagikan ke member.

### 1c. Build untuk Play Store (production)

```
npx eas-cli@latest build -p android --profile production
```

Hasilnya file `.aab` untuk diunggah ke Google Play Console (akun developer Google USD 25, sekali bayar).

Setiap rilis update: naikkan `version` dan `android.versionCode` di `app.json`
(contoh 1.0.0 → 1.0.1, versionCode 1 → 2), lalu jalankan lagi perintah build.

## 2. iOS

> Build iOS **wajib** lewat EAS cloud (tidak bisa build lokal di Windows/Linux).
> Butuh akun Apple Developer (USD 99/tahun).

### 2a. Coba cepat tanpa build (Expo Go)

1. Install aplikasi **Expo Go** dari App Store di iPhone.
2. Di laptop, jalankan:
   ```
   npx expo start
   ```
3. Scan QR code memakai kamera iPhone / aplikasi Expo Go (HP dan laptop harus di WiFi yang sama).

### 2b. Build untuk testing (simulator / TestFlight internal)

```
npx eas-cli@latest build -p ios --profile preview
```

Ikuti prompt pembuatan Apple credentials / provisioning. Hasilnya link install
(TestFlight atau ad-hoc) tampil di terminal saat build selesai.

### 2c. Build untuk App Store (production)

```
npx eas-cli@latest build -p ios --profile production
```

Hasilnya file `.ipa`. Submit ke App Store Connect:

```
npx eas-cli@latest submit -p ios
```

## 3. Web

Web tidak memakai EAS Build native, melainkan export file statis (`dist/`).

### 3a. Coba cepat (dev server dengan hot-reload)

```
npx expo start --web
```

Buka http://localhost:8081 di browser. Cocok untuk development.

### 3b. Build statis + jalankan lokal

```
npx expo export --platform web
python3 -m http.server 8085 --directory dist
```

Buka http://localhost:8085 di browser. Folder `dist/` inilah yang di-deploy
ke hosting (isinya `index.html` + `_expo/` + `assets/`).

### 3c. Deploy ke link publik

Pilih salah satu:

- EAS Hosting: `npx eas-cli@latest deploy`
- Vercel / Netlify: upload folder `dist/` atau hubungkan repo Git, set output directory ke `dist`.

> Tampilan web dibatasi lebar 480px (mobile layout di tengah) — by design di `App.tsx`.

## 4. Semua platform sekaligus

Untuk rilis serentak Android + iOS + Web dari codebase yang sama:

```
# 1. Android + iOS sekaligus via EAS (menghasilkan .aab + .ipa)
npx eas-cli@latest build --platform all --profile production

# 2. Web (terpisah, karena artefaknya file statis)
npx expo export --platform web
```

Ringkasan artefak:

| Target  | Perintah                                            | Hasil                        |
| ------- | --------------------------------------------------- | ---------------------------- |
| Android | `eas build -p android --profile production`         | `.aab` (Play Store)          |
| iOS     | `eas build -p ios --profile production`             | `.ipa` (App Store)           |
| Web     | `expo export --platform web`                        | folder `dist/` (hosting)     |
| Semua   | `eas build --platform all` + `expo export --platform web` | `.aab` + `.ipa` + `dist/` |

## 5. Mengubah materi edukasi

Semua materi ada di file `src/data/modules.ts`. Format penulisannya dijelaskan di bagian atas file tersebut.
