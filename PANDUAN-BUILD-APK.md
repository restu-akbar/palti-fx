# Panduan Build APK PALTI FX (Windows)

Build dijalankan di server Expo (EAS), jadi laptop kamu tidak perlu Android Studio.
Waktu pertama kali: sekitar 20–30 menit (sebagian besar menunggu antrean build).

## 1. Persiapan (sekali saja)

1. Install **Node.js LTS** dari https://nodejs.org (pilih tombol "LTS", lalu Next sampai selesai).
2. Buat akun gratis di https://expo.dev/signup.
3. Ekstrak file `palti-fx-source.zip` ke folder, misalnya `C:\PaltiFX`.

## 2. Buka terminal di folder project

1. Buka folder `C:\PaltiFX` di File Explorer.
2. Klik address bar, ketik `cmd`, lalu tekan Enter.

## 3. Install dependensi

```
npm install
```

## 4. Login ke Expo

```
npx eas-cli@latest login
```

Masukkan email/username dan password akun Expo.

## 5. Build APK

```
npx eas-cli@latest build -p android --profile preview
```

Pertanyaan yang muncul saat build pertama:

- "Create an EAS project?" → **Y**
- "Generate a new Android Keystore?" → **Y** (Expo menyimpan kunci aplikasi dengan aman)

Setelah build selesai, terminal menampilkan **link download APK** dan QR code.
Buka link itu di HP Android, download, lalu install (izinkan "Install dari sumber tidak dikenal" jika diminta).
Link APK ini bisa dibagikan ke member.

## Coba cepat tanpa build (opsional)

Install aplikasi **Expo Go** dari Play Store, lalu jalankan di laptop:

```
npx expo start
```

Scan QR code yang muncul memakai Expo Go (HP dan laptop harus di WiFi yang sama).
Jika versi Expo Go di Play Store belum mendukung SDK 57, gunakan cara build APK di atas.

## Update aplikasi

Setiap ada perubahan (misal materi baru), naikkan `version` dan `android.versionCode` di `app.json`
(contoh 1.0.0 → 1.0.1, versionCode 1 → 2), lalu jalankan lagi perintah build di langkah 5.

## Play Store & iOS (nanti)

- Play Store: `npx eas-cli@latest build -p android --profile production` menghasilkan file .aab untuk diunggah ke Google Play Console (akun developer Google USD 25, sekali bayar).
- iOS: `npx eas-cli@latest build -p ios` (butuh akun Apple Developer USD 99/tahun).

## Mengubah materi edukasi

Semua materi ada di file `src/data/modules.ts`. Format penulisannya dijelaskan di bagian atas file tersebut.
