# PANDUAN MASTER: BUILD, DEPLOYMENT, DAN OPERASIONAL PALTI FX

### (Panduan End-to-End iOS via MacBook, Android APK, Web Admin, dan Distribusi Private)

Dokumen ini adalah **buku panduan induk terlengkap dan berurutan** untuk seluruh siklus deployment dan operasional proyek **PALTI FX**. Disusun khusus dengan skenario bahwa Anda mengerjakan source code di PC Windows, lalu **meminjam MacBook orang lain** untuk proses kompilasi native iOS dan rilis ke Apple App Store secara privat.

---

# DAFTAR ISI

1. [BAB 1: Registrasi &amp; Pembayaran Apple Developer Program ($99/Tahun)](#bab-1-registrasi--pembayaran-apple-developer-program-99tahun)
2. [BAB 2: Persiapan di PC Windows Sebelum Meminjam MacBook](#bab-2-persiapan-di-pc-windows-sebelum-meminjam-macbook)
3. [BAB 3: Persiapan Dependensi Awal di MacBook Orang Lain](#bab-3-persiapan-dependensi-awal-di-macbook-orang-lain)
4. [BAB 4: Setup Project &amp; Menjalankan Aplikasi di MacBook](#bab-4-setup-project--menjalankan-aplikasi-di-macbook)
5. [BAB 5: Menjalankan Web Admin &amp; Setup Backend Supabase](#bab-5-menjalankan-web-admin--setup-backend-supabase)
6. [BAB 6: Panduan Verifikasi Pengujian Sistem (Role Admin &amp; Member)](#bab-6-panduan-verifikasi-pengujian-sistem-role-admin--member)
7. [BAB 7: Proses Prebuild Native iOS &amp; Konfigurasi CocoaPods](#bab-7-proses-prebuild-native-ios--konfigurasi-cocoapods)
8. [BAB 8: Setup Signing, Kredensial, &amp; Akun di Xcode](#bab-8-setup-signing-kredensial--akun-di-xcode)
9. [BAB 9: Proses Archive &amp; Export Build di Xcode](#bab-9-proses-archive--export-build-di-xcode)
10. [BAB 10: Proses Deployment &amp; Distribusi Private ke App Store](#bab-10-proses-deployment--distribusi-private-ke-app-store)
11. [BAB 11: Panduan Referensi Build Android (APK &amp; Play Store AAB)](#bab-11-panduan-referensi-build-android-apk--play-store-aab)
12. [BAB 12: Pembersihan Jejak Keamanan di MacBook Orang Lain](#bab-12-pembersihan-jejak-keamanan-di-macbook-orang-lain)
13. [BAB 13: Kamus Troubleshooting Masalah Umum](#bab-13-kamus-troubleshooting-masalah-umum)

---

# BAB 1: Registrasi & Pembayaran Apple Developer Program ($99/Tahun)

Sebelum Anda dapat mem-build binary iOS yang sah atau mengunggah ke App Store / TestFlight, Anda wajib memiliki akun **Apple Developer Program aktif**. Biaya resminya adalah **USD 99 / tahun** (sekitar Rp 1.600.000 – Rp 1.700.000 tergantung kurs dan pajak).

---

### 1.1 Persyaratan Sebelum Mendaftar

1. **Apple ID Pribadi/Perusahaan:** Pastikan Apple ID sudah aktif dan memiliki fitur **Two-Factor Authentication (2FA)** aktif di iPhone, iPad, atau Mac Anda.
2. **Identitas Resmi:** KTP atau Paspor asli (nama di Apple ID wajib **sama persis** dengan nama di KTP/Paspor).
3. **Metode Pembayaran:**
   - Kartu Kredit (Visa, MasterCard, Amex) yang mendukung transaksi internasional/online.
   - Kartu Debit Bank Digital Indonesia dengan fitur Debit Online aktif (misalnya Bank Jago Visa, Jenius BTPN, BCA Mastercard Debit Online, Mandiri Debit Online). Pastikan saldo mencukupi minimal Rp 1.800.000 untuk mengantisipasi pajak dan otorisasi nominal.

---

### 1.2 Tipe Akun: Individual vs Organization

* **Pilih Individual:** Jika Anda mendaftar atas nama pribadi. Nama pengembang yang tampil di App Store adalah nama lengkap Anda. Proses persetujuan **sangat cepat** (beberapa menit hingga maksimal 24 jam).
* **Pilih Organization:** Jika Anda ingin nama pengembang di App Store adalah nama PT / CV / Perusahaan Anda.
  * **Wajib memiliki D-U-N-S Number (Dun & Bradstreet):** Nomor registrasi bisnis internasional 9 digit. Jika belum punya, proses pembuatan D-U-N-S memakan waktu 1–2 minggu.
  * Memerlukan dokumen legalitas badan usaha dan wewenang penandatanganan kontrak.

> **Rekomendasi untuk Palti FX:** Jika ingin segera rilis dan uji coba private, gunakan tipe **Individual** terlebih dahulu. Di kemudian hari, akun individual dapat dimigrasikan ke organization dengan mengajukan tiket ke Apple Support.

---

### 1.3 Cara Mendaftar Paling Cepat & Minim Ditolak (Via Aplikasi iPhone)

Apple sangat memprioritaskan pendaftaran melalui aplikasi resmi mereka:

1. Buka App Store di iPhone atau iPad Anda.
2. Cari dan unduh aplikasi **Apple Developer** (oleh Apple Inc.).
3. Buka aplikasinya, lalu masuk ke tab **Account**.
4. Login menggunakan Apple ID Anda.
5. Klik tombol **"Enroll Now"**.
6. Baca instruksi persyaratan, klik **Continue**.
7. Isi data diri: Nama Depan, Nama Belakang, Nomor HP, dan Alamat lengkap sesuai KTP.
8. Lakukan verifikasi identitas (aplikasi akan meminta memindai KTP/Paspor dan memverifikasi wajah lewat kamera).
9. Pilih keanggotaan **Individual**.
10. Konfirmasi persetujuan perjanjian lisensi (Apple Developer Program License Agreement).
11. Lakukan pembayaran $99 via mekanisme **In-App Purchase Apple ID** (bisa menggunakan kartu yang terhubung ke Apple ID atau Apple Pay).
12. Pembayaran melalui aplikasi iPhone biasanya langsung terverifikasi instan tanpa verifikasi manual yang berbelit-belit.

---

### 1.4 Cara Mendaftar via Web (Alternatif)

1. Buka browser dan kunjungi: [https://developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/)
2. Klik tombol **"Start Your Enrollment"** di bagian bawah.
3. Login menggunakan Apple ID dengan 2FA.
4. Masukkan data personal, alamat, dan nomor telepon.
5. Pilih tipe entitas (Individual).
6. Masukkan detail kartu kredit/debit online.
7. Tunggu email konfirmasi: *"Your order is being processed"*.

---

### 1.5 Masa Verifikasi Pembayaran & Aktivasi

* Setelah pembayaran berhasil, Anda akan menerima email: *"Welcome to the Apple Developer Program"*.
* Buka [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com). Jika dashboard sudah bisa diakses dan menu **My Apps** serta **Users and Access** aktif, berarti akun Anda sudah 100% siap digunakan untuk build dan deploy!

---

# BAB 2: Persiapan di PC Windows Sebelum Meminjam MacBook

Sebelum Anda meminjam MacBook rekan Anda, seluruh kode dan konfigurasi di PC Windows harus dipastikan siap 100% agar ketika di MacBook, Anda tidak perlu mengedit kode lagi.

---

### 2.1 Identitas Aplikasi iOS di `app.json` & `mobile/app.json`

Pastikan file konfigurasi project telah memuat parameter wajib Apple berikut:

```json
{
  "expo": {
    "name": "Palti FX",
    "slug": "palti-fx",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#08080A",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.paltifx.app",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    }
  }
}
```

> **Penjelasan Parameter Kritis:**
>
> - `bundleIdentifier`: ID unik aplikasi di seluruh ekosistem Apple. Nilai `com.paltifx.app` harus sama persis dengan yang didaftarkan di App Store Connect.
> - `buildNumber`: Integer atau string penanda versi kompilasi. Setiap kali upload build baru ke App Store / TestFlight, nilai ini **wajib dinaikkan** (contoh: 1 -> 2 -> 3).
> - `ITSAppUsesNonExemptEncryption: false`: Parameter wajib agar Apple tidak menahan aplikasi Anda dengan pertanyaan verifikasi enkripsi ekspor kriptografi AS setiap kali upload.

---

### 2.2 Penyesuaian `eas.json`

Pastikan file `mobile/eas.json` sudah memiliki konfigurasi profil iOS:

```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "local" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": {}
    }
  },
  "submit": { "production": {} }
}
```

---

### 2.3 Konfigurasi Environment Variable (`.env` dan `mobile/.env`)

Pastikan file `.env` dan `mobile/.env` ada dan berisi kredensial Supabase project:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://xdeyntmcrdvhspkucclu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*(Variabel dengan awalan `EXPO_PUBLIC_` akan dibundel ke dalam binary aplikasi saat proses kompilasi native).*

---

### 2.4 Aturan Folder yang Wajib & Dilarang Masuk ZIP

Saat membuat zip untuk dipindahkan ke MacBook:

| Folder / File                           |        Status        | Alasan                                                                                     |
| :-------------------------------------- | :-------------------: | :----------------------------------------------------------------------------------------- |
| `node_modules/`                       | ❌ **DILARANG** | Ukuran raksasa (500MB+) & binary kompilasi Windows akan rusak jika dipaksa jalan di macOS. |
| `.expo/`                              | ❌ **DILARANG** | Cache lokal Windows.                                                                       |
| `mobile/android/`                     | ❌ **DILARANG** | Folder build Android tidak dibutuhkan untuk build iOS, menghemat ~150MB.                   |
| `releases/`                           | ❌ **DILARANG** | File APK lama.                                                                             |
| `.git/`                               | ❌ **DILARANG** | Tidak diperlukan untuk build rilis.                                                        |
| `mobile/src/` & `mobile/assets/`    |    **WAJIB**    | Inti seluruh kode, halaman, ikon, dan splash screen.                                       |
| `mobile/App.tsx`, `index.ts`        |    **WAJIB**    | Entry point mobile app.                                                                    |
| `package.json`, `package-lock.json` |    **WAJIB**    | Daftar dependensi resmi.                                                                   |
| `.env` & `mobile/.env`              |    **WAJIB**    | Konfigurasi koneksi backend Supabase.                                                      |
| `app.json` & `eas.json`             |    **WAJIB**    | Konfigurasi metadata aplikasi.                                                             |

---

### 2.5 Eksekusi Pembuatan ZIP Bersih (1-Klik via Windows)

Di root repository PC Windows Anda, klik dua kali file:

```text
create-zip-for-mac.bat
```

Script tersebut otomatis memfilter dan mengompres folder project menjadi file:
`..\palti-fx-ios-ready.zip`
Ukurannya sangat ringkas (hanya ~5–10 MB) dan siap dipindahkan ke Flashdisk, Google Drive, atau Telegram untuk dibuka di MacBook.

---

# BAB 3: Persiapan Dependensi Awal di MacBook Orang Lain

Ketika Anda sudah berada di depan MacBook orang lain, lakukan verifikasi dan instalasi peralatan wajib di bawah ini. Tahap ini hanya perlu dilakukan satu kali.

---

### 3.1 Install Xcode dari Mac App Store

1. Buka aplikasi **App Store** di MacBook.
2. Cari **Xcode** (oleh Apple).
3. Klik **Get** atau **Install** (ukurannya sekitar 12–15 GB).
4. Setelah selesai mengunduh, buka Xcode sekali agar lisensi Apple disetujui.

---

### 3.2 Install Xcode Command Line Tools

Buka aplikasi **Terminal** di MacBook (tekan `Cmd + Spasi`, ketik `Terminal`, tekan Enter), lalu ketik:

```bash
xcode-select --install
```

*Jika muncul pop-up jendela instalasi, klik **Install** dan tunggu hingga selesai.*
Untuk memastikan lokasinya benar, jalankan:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

---

### 3.3 Verifikasi / Install Node.js LTS

Di Terminal Mac, periksa versi Node.js:

```bash
node -v
npm -v
```

* **Kebutuhan Minimum:** Node.js **20 LTS** atau **22 LTS**.
* *Jika belum ada:* Unduh installer macOS pkg resmi dari [https://nodejs.org](https://nodejs.org) (pilih tombol **LTS**), lalu jalankan instalasi hingga selesai.

---

### 3.4 Install CocoaPods (Manajer Dependensi iOS)

CocoaPods dibutuhkan untuk meng-compile library native iOS (seperti SVG, WebView, Safe Area, SecureStore).
Jalankan salah satu perintah berikut di Terminal:

**Opsi A (Rekomendasi via Homebrew jika ada):**

```bash
brew install cocoapods
```

**Opsi B (Via Ruby Gem default macOS):**

```bash
sudo gem install cocoapods
```

Verifikasi dengan menjalankan:

```bash
pod --version
```

*(Harus menampilkan versi 1.14.x atau lebih baru).*

---

### 3.5 Install EAS CLI Global (Opsional jika ingin build via Cloud)

```bash
npm install -g eas-cli
```

---

# BAB 4: Setup Project & Menjalankan Aplikasi di MacBook

---

### 4.1 Ekstrak ZIP & Masuk ke Folder Project

1. Salin file `palti-fx-ios-ready.zip` ke MacBook (misalnya di folder `Downloads` atau `Desktop`).
2. Klik dua kali file zip untuk mengekstraknya menjadi folder `palti-fx`.
3. Buka Terminal Mac, lalu arahkan ke folder tersebut:
   ```bash
   cd ~/Downloads/palti-fx
   ```

---

### 4.2 Instalasi Dependensi Bersih

Jalankan di root folder:

```bash
npm install
```

*NPM akan membaca `package.json` workspace dan mengunduh seluruh `node_modules` yang kompatibel dengan arsitektur macOS (Intel atau Apple Silicon M1/M2/M3/M4) secara otomatis.*

---

### 4.3 Menjalankan Aplikasi Mobile Lokal untuk Pengujian

Sebelum melakukan build release, Anda dapat menguji aplikasi secara langsung:

```bash
npm run start:mobile
```

* Di terminal akan muncul QR code Expo.
* **Jalankan di Simulator iOS:** Tekan tombol **`i`** di keyboard. Terminal akan otomatis membuka Simulator iPhone di MacBook dan memuat aplikasi Palti FX.
* **Jalankan di iPhone Fisik:** Unduh aplikasi **Expo Go** dari App Store di iPhone Anda, hubungkan iPhone dan MacBook ke jaringan Wi-Fi yang sama, lalu scan QR code menggunakan kamera iPhone.

---

# BAB 5: Menjalankan Web Admin & Setup Backend Supabase

Web admin PALTI FX adalah dashboard manajemen berbasis React + Vite yang berada di folder `web/` dan terintegrasi dengan database Supabase yang sama dengan mobile.

---

### 5.1 Menjalankan Web Admin di MacBook

Dari root folder `palti-fx`, jalankan:

```bash
npm run start:web
```

Vite akan berjalan di:

```text
http://localhost:5173/admin/login
```

*(Buka URL di atas melalui browser Safari atau Google Chrome di MacBook).*

---

### 5.2 Konfigurasi Database & Storage Bucket Supabase

Web admin mengunggah media edukasi ke Supabase Storage. Pastikan bucket storage telah diaktifkan di dashboard Supabase:

1. Masuk ke [https://supabase.com/dashboard](https://supabase.com/dashboard) > Pilih project Palti FX.
2. Buka menu **Storage**.
3. Pastikan dua bucket berikut sudah dibuat:
   - `lesson-images`: Public bucket, batas 5 MB per gambar (PNG, JPG, WEBP, GIF, AVIF).
   - `lesson-videos`: Public bucket, batas 50 MB per video (MP4 H.264, WebM).
4. Jika belum dibuat via SQL, buka menu **SQL Editor** di Supabase, lalu jalankan file migrasi:
   - `mobile/supabase/migrations/002_lesson_images_bucket.sql`
   - `mobile/supabase/migrations/003_lesson_videos_bucket.sql`
5. Kebijakan RLS memastikan: **Hanya akun bertipe admin yang boleh upload/delete**, sedangkan **semua member/publik boleh membaca (view/stream)**.

---

# BAB 6: Panduan Verifikasi Pengujian Sistem (Role Admin & Member)

Sebelum aplikasi dibundel ke App Store, lakukan verifikasi fitur sesuai skenario uji berikut:

---

### 6.1 Uji Coba Akun Admin (`dioraput@gmail.com`)

1. Login ke aplikasi mobile atau Web Admin menggunakan akun admin.
2. Buka menu/tab **Edukasi**:
   - Pastikan tombol **`[+ Tambah Modul]`** dan ikon pensil edit muncul.
   - Buat satu modul baru dan satu bab baru.
   - Sisipkan link video YouTube (misalnya video edukasi trading).
   - Uji tombol pembatalan: tutup form tanpa menyimpan, pastikan muncul dialog konfirmasi.
   - Simpan materi: pastikan tersimpan ke database cloud Supabase dan video dapat diputar.
   - Uji tombol pergeseran urutan modul `[⬆️]` dan `[⬇️]`, pastikan urutan berubah secara real-time.

---

### 6.2 Uji Coba Akun Member (`diorahmanputra@gmail.com`)

1. Login ke aplikasi mobile menggunakan akun member biasa.
2. Buka tab **Edukasi**:
   - Pastikan antarmuka bersih tanpa ada tombol edit, hapus, maupun tambah modul.
   - Buka materi bab baru yang dibuat admin, lalu centang status selesai.
3. Buka tab **Jurnal**:
   - Tambahkan 1 catatan trade baru (pair mata uang, lot, take profit, stop loss).
4. Uji Persistensi Data:
   - Tekan tombol **Logout**.
   - Login kembali ke akun member tersebut.
   - **Verifikasi:** Pastikan bab yang dicentang selesai, riwayat catatan jurnal trade, dan profil pengguna tetap utuh termuat dari cloud database!

---

# BAB 7: Proses Prebuild Native iOS & Konfigurasi CocoaPods

Untuk menghasilkan project Xcode native dari source code Expo, jalankan proses **Expo Prebuild**.

---

### 7.1 Menjalankan Script Prebuild

Di Terminal MacBook pada folder project:

```bash
npm run prebuild:ios
```

**Apa yang terjadi saat perintah ini dieksekusi:**

1. Expo membaca seluruh konfigurasi di `mobile/app.json`.
2. Expo membuat folder native baru bernama: `mobile/ios/`.
3. Expo menghasilkan file workspace Xcode: `mobile/ios/PaltiFX.xcworkspace`.
4. Expo secara otomatis menjalankan `pod install` untuk menautkan seluruh dependensi native iOS.

> [!IMPORTANT]
> Jika MacBook yang dipinjam menggunakan chip **Apple Silicon (M1/M2/M3/M4)** dan muncul peringatan arsitektur pada CocoaPods, jalankan perintah perbaikan ini:
>
> ```bash
> cd mobile/ios
> arch -x86_64 pod install
> cd ../..
> ```

---

# BAB 8: Setup Signing, Kredensial, & Akun di Xcode

Ini adalah tahap menghubungkan project dengan akun Apple Developer Program berbayar Anda.

---

### 8.1 Login Akun Apple Developer di Xcode

1. Buka aplikasi **Xcode**.
2. Pada menu bar atas Mac, klik: **Xcode > Settings...** (atau **Preferences...** pada macOS lama).
3. Klik tab **Accounts** di bagian atas.
4. Klik tombol **`[ + ]`** di pojok kiri bawah, lalu pilih **Apple ID**.
5. Masukkan email dan password Apple ID developer Anda yang sudah berlangganan $99/tahun.
6. Masukkan kode 2FA yang muncul di iPhone Anda.
7. Setelah berhasil login, nama dan Team Anda (misal: *Dio Rahman Putra (Personal Team)* atau nama Organisasi) akan muncul di daftar akun.
8. Tutup jendela Settings.

---

### 8.2 Membuka Workspace Project

Di Terminal MacBook, jalankan:

```bash
open mobile/ios/PaltiFX.xcworkspace
```

> [!CAUTION]
> **SELALU BUKA `.xcworkspace` (ikon putih)!**
> JANGAN PERNAH membuka file `.xcodeproj`. Jika membuka `.xcodeproj`, seluruh library CocoaPods tidak akan terbaca dan build akan gagal total dengan error *Lexical or Preprocessor Issue / Module Not Found*.

---

### 8.3 Konfigurasi Automatic Code Signing

1. Pada panel navigator sebelah kiri Xcode, klik baris paling atas: **Palti FX** (ikon proyek biru).
2. Di panel tengah, pada bagian **TARGETS**, pilih **Palti FX**.
3. Klik tab **Signing & Capabilities**.
4. Beri centang pada kotak: **"Automatically manage signing"**.
5. Di dropdown **Team**, pilih Akun Apple Developer Anda yang sudah di-login-kan di langkah 8.1.
6. Periksa field **Bundle Identifier**: pastikan tertulis `com.paltifx.app`.
7. Xcode akan secara otomatis menghubungi server Apple, mendaftarkan App ID, mengunduh Distribution Certificate, dan membuat Provisioning Profile secara instan.
8. Pastikan status di bawahnya menunjukkan tulisan: **"Provisioning Profile: Xcode Managed Profile"** dan tidak ada tanda seru merah.

---

# BAB 9: Proses Archive & Export Build di Xcode

---

### 9.1 Memilih Target Perangkat

Pada bagian atas jendela Xcode (di samping tombol Play/Stop):

1. Klik nama target perangkat (biasanya default-nya simulator iPhone seperti *iPhone 16 Pro*).
2. Ubah pilihannya menjadi: **"Any iOS Device (arm64)"**.
   *(Archive hanya bisa dijalankan pada target generic device arm64, tidak bisa pada simulator).*

---

### 9.2 Menjalankan Archive

1. Pada menu bar atas Mac, klik: **Product > Archive**.
2. Xcode akan mulai mengompilasi seluruh kode TypeScript, React Native, library C++/Objective-C, dan aset gambar.
3. Proses ini memakan waktu sekitar 3–10 menit tergantung spesifikasi MacBook.
4. Jangan menutup Xcode sampai proses selesai.

---

### 9.3 Jendela Organizer & Validasi Build

Setelah kompilasi selesai tanpa error, jendela **Organizer** akan terbuka secara otomatis, menampilkan baris baru:

* **App Name:** Palti FX
* **Version:** 1.0.0 (1)
* **Creation Date:** Hari ini

Klik tombol **"Validate App"** terlebih dahulu untuk memastikan binary memenuhi standar Apple. Jika validasi sukses, Anda siap melakukan upload/distribusi!

---

# BAB 10: Proses Deployment & Distribusi Private ke App Store

Ada beberapa metode distribusi privat yang dapat Anda pilih sesuai kebutuhan PALTI FX:

---

### METODE 1: Apple TestFlight (Paling Direkomendasikan & Praktis)

Cocok untuk pengujian tertutup, rilis internal perusahaan, dan member private hingga 10.000 orang.

#### Langkah Upload ke TestFlight dari Xcode:

1. Di jendela **Organizer** Xcode, pilih build terbaru, lalu klik tombol **"Distribute App"**.
2. Pilih opsi: **App Store Connect** > Klik **Distribute**.
3. Pilih tujuan: **Upload** (mengirim langsung ke cloud Apple) > Klik **Next**.
4. Pada opsi distribusi, biarkan default centang:
   - *Strip Swift symbols*
   - *Upload your app's symbols (dSYM)*
5. Pilih **Automatically manage signing** > Klik **Next**.
6. Klik **Upload**. Xcode akan mentransfer paket binary `.ipa` ke server Apple.
7. Setelah muncul tanda centang hijau *"App Store Connect distribution succeeded"*, klik **Done**.

#### Langkah Mengaktifkan TestFlight di App Store Connect:

1. Buka browser di [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Masuk ke menu **My Apps** > Pilih **Palti FX**.
3. Klik tab **TestFlight** di bagian atas.
4. Build yang baru Anda upload akan berstatus *"Processing"* (memerlukan waktu 10–30 menit sampai Apple selesai memproses aset).
5. **Internal Testing (Tanpa Review Apple):**
   - Klik **Internal Group** > klik tanda **`[ + ]`** > Tambahkan email pengguna (maksimal 100 orang tim internal).
   - Begitu build selesai diproses, mereka langsung menerima email undangan detik itu juga!
6. **External Testing (Member Tertutup, Maks 10.000 Orang):**
   - Klik **External Groups** > Buat nama grup (contoh: *VIP Member Palti FX*).
   - Tambahkan build tersebut ke grup.
   - Isi deskripsi singkat *What to Test* (contoh: *Uji coba modul edukasi dan jurnal trading*).
   - Klik **Submit for Review**. Review Apple untuk TestFlight eksternal sangat cepat (biasanya 2–24 jam).
   - Setelah approved, aktifkan fitur **Public Link**. Bagikan link URL TestFlight tersebut kepada member Anda. Member cukup mengunduh aplikasi **TestFlight** di App Store, lalu klik link tersebut untuk menginstall PALTI FX!

---

### METODE 2: Custom Apps via Apple Business Manager (Full Private Korporat)

Jika aplikasi PALTI FX sama sekali **tidak boleh dilihat oleh publik umum** di App Store, gunakan jalur Custom Apps resmi Apple:

1. Di **App Store Connect**, pilih aplikasi **Palti FX**.
2. Di menu kiri, pilih **App Information** > buka bagian **Pricing and Availability**.
3. Gulir ke bawah ke bagian **App Distribution Methods**.
4. Ubah dari *Public* menjadi **Private**:
   - Pilih: **"Available as a custom app on Apple Business Manager"**.
   - Masukkan **Organization ID** dan **Organization Name** dari akun Apple Business Manager perusahaan Anda ([https://business.apple.com](https://business.apple.com)).
5. Ajukan aplikasi untuk Apple Review seperti rilis biasa.
6. **Hasilnya:** Aplikasi tidak akan pernah muncul di pencarian App Store publik. Hanya karyawan atau akun yang terdaftar di Apple Business Manager organisasi Anda yang dapat mengunduhnya ke perangkat iPhone mereka melalui Mobile Device Management (MDM) atau kode voucher tebusan (Redemption Codes).

---

### METODE 3: Unlisted App Distribution (Akses via Link Langsung)

1. Jika ingin aplikasi resmi ada di App Store tetapi **tidak terindeks di pencarian publik, kategori, atau chart**:
2. Buka [https://developer.apple.com/contact/request/unlisted-app-distribution/](https://developer.apple.com/contact/request/unlisted-app-distribution/)
3. Ajukan permohonan agar aplikasi Palti FX dijadikan *Unlisted*.
4. Setelah disetujui Apple, aplikasi hanya dapat diunduh oleh orang yang memiliki **link langsung App Store** Anda.

---

### METODE 4: Ad-Hoc Distribution (File `.ipa` Manual Tanpa App Store)

1. Daftarkan nomor UDID iPhone target (maksimal 100 iPhone) di portal [https://developer.apple.com/account/resources/devices/list](https://developer.apple.com/account/resources/devices/list).
2. Di jendela **Organizer** Xcode, klik **Distribute App** > pilih **Release Testing (Ad-Hoc)**.
3. Xcode akan menghasilkan file `.ipa` langsung ke folder MacBook.
4. File `.ipa` ini dapat diinstall ke iPhone terdaftar menggunakan aplikasi **Apple Configurator** atau via kabel USB.

---

# BAB 11: Panduan Referensi Build Android (APK & Play Store AAB)

Sebagai referensi terpadu, proses build untuk ekosistem Android dapat dilakukan langsung via EAS Build (baik dari Windows maupun MacBook):

---

### 11.1 Build APK Siap Install (Internal Testing)

Gunakan perintah ini untuk membuat file `.apk` yang bisa langsung dibagikan dan diinstall ke HP Android tanpa Google Play Store:

```bash
npx eas-cli@latest build -p android --profile preview
```

* **Pertanyaan saat build pertama:**
  * *"Create an EAS project?"* → Pilih **Y**
  * *"Generate a new Android Keystore?"* → Pilih **Y**
* Setelah selesai, terminal memberikan link unduh APK dan QR code.

---

### 11.2 Build Android App Bundle (.aab) untuk Google Play Store

Untuk merilis secara publik atau private testing di Google Play Console:

```bash
npx eas-cli@latest build -p android --profile production
```

* Menghasilkan file `.aab` yang siap diunggah ke Google Play Console (biaya registrasi Google Play Developer adalah $25, sekali bayar seumur hidup).

---

### 11.3 Aturan Kenaikan Versi Android

Setiap kali melakukan build ulang, perbarui versi di `mobile/app.json`:

- `version`: contoh `"1.0.0"` → `"1.0.1"`
- `android.versionCode`: contoh `1` → `2`

---

# BAB 12: Pembersihan Jejak Keamanan di MacBook Orang Lain

> [!CAUTION]
> Karena Anda menggunakan MacBook orang lain, sertifikat developer Apple, kredensial login, dan file source code sensitif Anda berpotensi tertinggal di komputer tersebut. Lakukan checklist pembersihan wajib berikut sebelum mengembalikan MacBook!

---

### Checklist Pembersihan:

1. **Logout Akun Apple Developer dari Xcode:**
   - Buka **Xcode > Settings > Accounts**.
   - Pilih Apple ID Anda di panel kiri.
   - Klik tombol **`[ — ]`** di bagian bawah untuk menghapus akun Anda dari Xcode.
2. **Hapus Sertifikat & Private Key dari Keychain Access:**
   - Buka aplikasi **Keychain Access** di Mac (tekan `Cmd + Spasi`, ketik `Keychain Access`).
   - Pilih kategori **login** dan tab **Certificates** / **My Certificates**.
   - Cari sertifikat bernama: `Apple Development: ...` atau `Apple Distribution: ...` milik akun Anda.
   - Klik kanan > pilih **Delete**.
3. **Logout EAS CLI:**
   - Di Terminal Mac, jalankan:
     ```bash
     eas logout
     ```
4. **Hapus Folder DerivedData (Cache Kompilasi Xcode):**
   - Jalankan di Terminal:
     ```bash
     rm -rf ~/Library/Developer/Xcode/DerivedData
     ```
5. **Hapus Folder Source Code & ZIP:**
   - Hapus folder project `palti-fx` dan file zip `palti-fx-ios-ready.zip` dari Mac.
   - Buka **Trash** (Tempat Sampah Mac) dan klik **Empty Trash**.

---

# BAB 13: Kamus Troubleshooting Masalah Umum

### 1. Error: `Pod install failed` atau `Ruby architecture mismatch`

* **Penyebab:** Konflik arsitektur x86_64 vs arm64 pada Mac Apple Silicon M1/M2/M3/M4.
* **Solusi:**
  ```bash
  cd mobile/ios
  sudo arch -x86_64 gem install ffi
  arch -x86_64 pod install --repo-update
  cd ../..
  ```

---

### 2. Error: `No Accounts with App Store Connect Access`

* **Penyebab:** Apple ID belum dimasukkan ke Xcode atau status pembayaran membership $99 belum aktif di Apple.
* **Solusi:** Buka `Xcode > Settings > Accounts`, pastikan Apple ID terdaftar dan role menunjukkan *Agent/Admin*. Cek status keanggotaan di [developer.apple.com](https://developer.apple.com).

---

### 3. Error: `Bundle identifier 'com.paltifx.app' is already registered`

* **Penyebab:** Bundle identifier sudah pernah diklaim oleh akun Apple ID lain di dunia.
* **Solusi:** Ubah bundle ID menjadi nama yang lebih spesifik (contoh: `com.paltifx.mobile` atau `id.paltifx.app`) di `app.json`, `mobile/app.json`, dan di tab Signing & Capabilities Xcode.

---

### 4. Error: `npm start` malah membuka aplikasi Mobile, padahal ingin Web Admin

* **Penyebab:** Script default `npm start` diarahkan ke workspace mobile.
* **Solusi:** Jalankan perintah spesifik:
  ```bash
  npm run start:web
  ```

---

### 5. Error: `Missing Compliance / Encryption Warning` di App Store Connect

* **Penyebab:** Konfigurasi ekspor enkripsi belum terdefinisi.
* **Solusi:** Pastikan `ITSAppUsesNonExemptEncryption: false` sudah ada di dalam `app.json` pada objek `ios.infoPlist` (sudah kita set di Bab 2.1).

---

### 6. Port `5173` sudah terpakai saat menjalankan Web Admin

* **Solusi:** Vite akan otomatis menawarkan port berikutnya seperti `http://localhost:5174`. Buka URL alternatif tersebut di browser.

---

# RINGKASAN URUTAN KERJA (QUICK CHEAT-SHEET)

```text
[1. DI IPHONE/WEB]
Daftar Apple Developer $99/tahun -> Tunggu email konfirmasi aktif.

[2. DI PC WINDOWS]
Jalankan create-zip-for-mac.bat -> Dapatkan palti-fx-ios-ready.zip.

[3. DI MACBOOK ORANG LAIN]
1. Ekstrak zip -> Buka Terminal di folder project.
2. npm install
3. npm run prebuild:ios
4. Buka Xcode -> Login Apple ID di Xcode Settings.
5. Buka mobile/ios/PaltiFX.xcworkspace
6. Pilih Target 'Palti FX' -> Centang 'Automatically manage signing' -> Pilih Team Anda.
7. Pilih target device: 'Any iOS Device (arm64)'.
8. Klik menu Product -> Archive.
9. Di Organizer -> Klik 'Distribute App' -> Upload ke App Store Connect.

[4. DI APP STORE CONNECT BROWSER]
Masuk ke menu TestFlight -> Tambahkan Internal Testers -> Member langsung bisa install!

[5. SEBELUM PULANG]
Hapus Apple ID dari Xcode Settings -> Hapus sertifikat dari Keychain Access -> Hapus folder project & Empty Trash.
```
