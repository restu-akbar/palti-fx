# Panduan Build iOS & Distribusi Private (Palti FX)

Dokumen ini menjelaskan proses build aplikasi mobile iOS untuk project **Palti FX** (Expo / React Native) dari lingkungan Windows, serta opsi deployment private (tidak untuk publik umum).

---

## 1. Apakah Bisa Build di Windows atau Wajib MacBook?

### Jawaban Singkat:
* **Secara Lokal (Offline di PC ini):** **TIDAK BISA**. Apple mewajibkan Xcode dan toolchain macOS untuk meng-compile kode native iOS (Objective-C/Swift & C++).
* **Solusi dari Windows (Cloud Build):** **BISA SEKALI!** Karena project Palti FX menggunakan **Expo**, Anda bisa menggunakan **EAS Build (Expo Application Services)**.
  * Anda mengetik perintah build dari terminal Windows.
  * Kode dikirim ke cloud server macOS milik Expo.
  * Server Expo meng-compile file `.ipa` atau langsung mengunggahnya ke App Store Connect / TestFlight.
* **Opsi Lain:**
  * GitHub Actions runner `macos-latest` (otomatis build via CI/CD).
  * Sewa Mac Cloud (MacinCloud, AWS EC2 Mac, dsb).
  * Menggunakan MacBook milik rekan tim jika ingin build lokal secara offline.

---

## 2. Prasyarat Akun & Kredensial Apple

Untuk mem-build iOS (baik via EAS Cloud maupun MacBook), Anda memerlukan:
1. **Apple Developer Account** (wajib berbayar, $99/tahun di [developer.apple.com](https://developer.apple.com)).
2. **Bundle Identifier**: Sudah diset di `app.json` yaitu:
   ```json
   "ios": {
     "bundleIdentifier": "com.paltifx.app"
   }
   ```
3. Akun **Expo** (gratis di [expo.dev](https://expo.dev)).

---

## 3. Langkah Build iOS dari Windows (Metode Termudah: EAS Cloud)

### Langkah 1: Install EAS CLI
Jalankan di terminal:
```bash
npm install -g eas-cli
```
Lalu login ke akun Expo:
```bash
eas login
```

### Langkah 2: Inisialisasi Project di EAS
Jalankan di root project:
```bash
eas project:init
```

### Langkah 3: Konfigurasi `eas.json`
Buat atau pastikan file `eas.json` di root project memiliki konfigurasi iOS:
```json
{
  "cli": {
    "version": ">= 15.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Langkah 4: Jalankan Build ke iOS
* **Untuk Internal Testing / Ad-hoc (.ipa siap install):**
  ```bash
  eas build --platform ios --profile preview
  ```
* **Untuk Production (App Store Connect / TestFlight):**
  ```bash
  eas build --platform ios --profile production
  ```

> **Catatan Kredensial Apple:**  
> Saat pertama kali menjalankan `eas build`, EAS CLI akan meminta login akun Apple Developer Anda. EAS akan secara **otomatis** membuatkan:
> - Distribution Certificate
> - Provisioning Profile
> - App ID di portal Apple Developer
> Anda tidak perlu pusing mengurus sertifikat secara manual.

---

## 4. Proses Deployment ke App Store Secara Private

Jika aplikasi **Palti FX** hanya ditujukan untuk kalangan terbatas (karyawan, mitra bisnis, atau pengujian tertutup) dan tidak ingin muncul di pencarian publik App Store, Apple menyediakan beberapa opsi resmi:

### Opsi A: Apple TestFlight (Paling Populer & Praktis)
Cocok untuk fase validasi, pengujian internal perusahaan, atau user terbatas hingga 10.000 orang.
* **Internal Testers:**
  * Maksimal 100 orang (harus didaftarkan email Apple ID-nya di App Store Connect).
  * **Tanpa review Apple** (langsung bisa diinstall begitu build selesai di-upload).
* **External Testers:**
  * Maksimal 10.000 orang (bisa pakai link publik TestFlight atau invite email).
  * Memerlukan Apple Review ringan (biasanya disetujui dalam hitungan jam s.d. 1 hari).
* **Cara Submit dari Windows:**
  Setelah build production selesai di EAS:
  ```bash
  eas submit --platform ios
  ```
  File otomatis masuk ke TestFlight di App Store Connect. User cukup menginstall aplikasi **TestFlight** dari App Store, lalu klik undangan.

---

### Opsi B: Custom Apps via Apple Business Manager (ABM)
Opsi resmi Apple untuk aplikasi korporat/B2B yang **sepenuhnya privat**.
* **Keunggulan:**
  * Aplikasi **tidak akan pernah muncul** di App Store publik saat dicari orang lain.
  * Hanya organisasi yang didaftarkan (via Organization ID Apple Business Manager) yang dapat mengunduh dan mendistribusikan aplikasi tersebut ke device karyawan.
* **Langkah-langkah:**
  1. Siapkan akun **Apple Business Manager** ([business.apple.com](https://business.apple.com)) menggunakan D-U-N-S Number perusahaan.
  2. Masuk ke **App Store Connect** > Pilih aplikasi **Palti FX**.
  3. Buka menu **App Information** > bagian **Pricing and Availability**.
  4. Pada **App Distribution Methods**, pilih **Private**:
     - Pilih **Available as a custom app on Apple Business Manager**.
     - Masukkan **Organization ID** dan **Organization Name** perusahaan Anda.
  5. Submit aplikasi untuk review Apple seperti biasa.
  6. Setelah approved, IT Administrator perusahaan mendistribusikannya via MDM (Mobile Device Management) atau Redemption Codes khusus.

---

### Opsi C: Unlisted App Distribution (Distribusi Melalui Tautan Langsung)
* Cocok jika user Anda bukan organisasi ABM, tetapi Anda tidak ingin aplikasi ditemukan di pencarian/kategori App Store.
* Aplikasi hanya bisa diakses oleh orang yang memiliki **link langsung** ke App Store.
* Mengajukan request form "Unlisted App Distribution" di portal Apple Developer.

---

### Opsi D: Ad-Hoc Distribution (Tanpa App Store)
* Build `.ipa` ditandatangani khusus untuk daftar UDID iPhone tertentu (maksimal 100 iPhone per tahun).
* Penginstalan dilakukan via link OTA (Over-The-Air) download web pribadi atau kabel USB (Apple Configurator / iTunes).
* EAS CLI mendukung pendaftaran UDID otomatis saat Anda menjalankan `eas build --profile preview`.

---

## 5. Ringkasan Rekomendasi Alur untuk Palti FX

1. **Gunakan PC Windows Anda + EAS Build** (tidak perlu beli MacBook di awal).
2. Daftarkan akun **Apple Developer ($99/tahun)**.
3. Jalankan `eas build --platform ios --profile production`.
4. Jalankan `eas submit --platform ios` untuk mengirim build ke **App Store Connect**.
5. Untuk distribusi private:
   - **Tahap awal / uji coba**: Gunakan **TestFlight (Internal/External)**.
   - **Tahap rilis korporat privat**: Gunakan **Custom Apps via Apple Business Manager** atau **Unlisted Apps**.
