# Panduan Menyiapkan ZIP & Build di MacBook Orang Lain

Dokumen ini memandu Anda mempersiapkan kode **Palti FX** dari PC Windows ini agar siap di-zip, dikirim, dan di-build secara mulus di MacBook orang lain tanpa kendala dependensi atau error konfigurasi.

---

## 1. Apa Saja yang Sudah Disiapkan di Kode Ini?

Kode project sudah disesuaikan agar siap untuk iOS:
1. **Bundle Identifier iOS**: `com.paltifx.app` (di `app.json` & `mobile/app.json`).
2. **Build Number iOS**: `"1"` (wajib ada untuk identifikasi versi di Apple).
3. **Info Plist**: `ITSAppUsesNonExemptEncryption: false` (agar tidak tertahan form enkripsi ekspor Apple saat upload).
4. **Environment Variables**: `.env` berisi `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. **Konfigurasi EAS & NPM Scripts**:
   - `npm run prebuild:ios` (generate project native Xcode + CocoaPods di Mac).
   - `npm run build:ios` (compile release di Mac).

---

## 2. Aturan Penting Saat Membuat File ZIP

> [!WARNING]
> **JANGAN PERNAH menyertakan folder `node_modules` ke dalam ZIP!**
> Selain ukurannya membengkak menjadi ratusan megabyte, file binary compiled dari Windows **tidak kompatibel** dan akan menyebabkan error fatal di macOS. Di MacBook nanti cukup menjalankan `npm install`.

### ❌ File/Folder yang HARUS DIKECUALIKAN dari ZIP:
* `node_modules/` (baik di root maupun di dalam `mobile/`)
* `.expo/`
* `mobile/android/` (tidak dibutuhkan untuk build iOS, menghemat ~100MB+)
* `mobile/releases/` (file APK lama)
* `.git/` (tidak perlu disertakan agar zip ringan)
* `landing-page.zip` (file arsip lama)

###  File/Folder yang WAJIB MASUK ke dalam ZIP:
* `package.json` dan `package-lock.json`
* `.env` (sangat penting untuk koneksi Supabase)
* `app.json` dan `eas.json`
* Folder `mobile/` berisi:
  * `mobile/src/` (seluruh komponen, screen, logic)
  * `mobile/assets/` (icon.png, splash-icon.png)
  * `mobile/App.tsx`, `mobile/index.ts`, `mobile/tsconfig.json`
  * `mobile/package.json`, `mobile/app.json`, `mobile/eas.json`, `mobile/.env`

---

## 3. Cara Cepat Membuat File ZIP Bersih di Windows

Anda bisa menjalankan perintah PowerShell berikut di root folder project (`c:\Work\palti-fx\palti-fx`):

```powershell
$exclude = @('node_modules', '.expo', '.git', 'android', 'releases', 'landing-page.zip', 'dist', '.next')
Get-ChildItem -Path . -Exclude $exclude | Where-Object { $_.Name -notin $exclude } | Compress-Archive -DestinationPath ..\palti-fx-ios-ready.zip -Force
```
*File `palti-fx-ios-ready.zip` akan otomatis dibuat di folder luar (`c:\Work\palti-fx\`), ukurannya sangat kecil (biasanya hanya beberapa megabyte) dan bersih.*

---

## 4. Panduan untuk Diberikan ke Pemilik MacBook

Kirimkan langkah-langkah berikut kepada rekan Anda yang memegang MacBook:

### A. Persiapan Awal di MacBook (Hanya Sekali)
Pastikan MacBook sudah memiliki toolchain standar Apple:
1. **Install Xcode** dari Mac App Store.
2. Buka Terminal Mac, jalankan:
   ```bash
   xcode-select --install
   ```
3. Install **Node.js** (rekomendasi Node 20 LTS atau 22 LTS).
4. Install **CocoaPods** (pengelola library iOS):
   ```bash
   sudo gem install cocoapods
   # ATAU jika menggunakan Homebrew:
   brew install cocoapods
   ```

---

### B. Langkah Eksekusi Build di MacBook

1. **Ekstrak file zip** lalu buka folder project via Terminal Mac.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Generate Folder Native iOS (`Podfile` & Xcode Project):**
   ```bash
   npm run prebuild:ios
   ```
   *(Perintah ini akan membaca konfigurasi Expo, membuat folder `mobile/ios`, dan otomatis menjalankan `pod install`).*

4. **Buka Project di Xcode:**
   ```bash
   open mobile/ios/PaltiFX.xcworkspace
   ```
   *(PENTING: Selalu buka file `.xcworkspace`, bukan `.xcodeproj`).*

---

### C. Signing & Export / Upload di Xcode

1. Di panel kiri Xcode, klik baris paling atas **Palti FX** (ikon proyek biru).
2. Di panel tengah, pilih Target **Palti FX**, lalu buka tab **Signing & Capabilities**.
3. Centang **"Automatically manage signing"**.
4. Di bagian **Team**, pilih Akun Apple Developer Anda (rekan Anda login akun Apple Developer Anda di menu `Xcode > Settings > Accounts`).
5. Pada bagian atas Xcode (Device Selector), ganti simulator menjadi **"Any iOS Device (arm64)"**.
6. Klik menu bar atas: **Product > Archive**.
7. Tunggu Xcode mengompilasi project hingga jendela **Organizer** muncul.
8. Di jendela Organizer:
   - Pilih archive terbaru > klik tombol **"Distribute App"**.
   - **Untuk TestFlight / App Store**: Pilih **"App Store Connect"** > klik **Upload**.
   - **Untuk Install Langsung (Ad-Hoc / File .ipa)**: Pilih **"Release Testing" / "Enterprise" / "Development"** > simpan file `.ipa`.
