# SPESIFIKASI LENGKAP: USER STORIES & ACCEPTANCE CRITERIA

---

# 1. MODUL WEB: ADMIN BACKOFFICE & LANDING PAGE

## 1.1. Autentikasi Login Admin & RBAC Backoffice

### User Story

Sebagai Administrator Backoffice, saya ingin login menggunakan email dan password langsung ke portal web tanpa kode undangan, agar saya dapat mengelola kurikulum edukasi, kode undangan VIP, dan memantau trader komunitas secara aman.

### Prasyarat (Pre-conditions)

1. Pengguna memiliki akun terdaftar di Supabase Auth (`auth.users`).
2. Record profil pengguna di tabel `public.profiles` memiliki kolom `role = 'admin'` dan `status = 'active'`.
3. Web server Vite dan koneksi Supabase client aktif.

### Aturan Bisnis & Validasi Input

- Field Email wajib diisi dengan format email standar yang valid (memiliki karakter `@` dan domain valid).
- Field Password wajib diisi dan tidak boleh hanya berisi karakter spasi kosong.
- Admin tidak memerlukan kode undangan untuk masuk (berbeda dengan pendaftaran member di mobile).
- Sesi login menggunakan JSON Web Token (JWT) dari Supabase Auth yang disimpan di `localStorage` peramban web.
- Jika profil pengguna berstatus `role = 'member'`, akses backoffice ditolak secara mutlak.
- Jika profil pengguna berstatus `status = 'suspended'`, akses backoffice diblokir.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Login Berhasil (Happy Path)

- GIVEN pengguna berada di halaman `/admin/login`.
- WHEN pengguna menginputkan email admin yang valid (contoh: `dioraput@gmail.com`) dan kata sandi yang sesuai.
- AND pengguna menekan tombol "Masuk ke Konsol".
- THEN tombol berubah menampilkan indikator loading (*"Memverifikasi Akses..."*) dan berstatus dinonaktifkan (*disabled*).
- AND sistem memvalidasi kredensial ke Supabase Auth (`signInWithPassword`).
- AND sistem memeriksa data di tabel `public.profiles` dan mengonfirmasi `role === 'admin'`.
- THEN sistem menyimpan sesi pengguna, memunculkan notifikasi sukses, dan mengarahkan admin ke halaman `/admin` (Dashboard Overview).

#### Skenario 2: Login Ditolak untuk Akun Member (RBAC Protection)

- GIVEN pengguna memasukkan email dan password akun trader biasa (`role = 'member'`).
- WHEN pengguna menekan tombol "Masuk ke Konsol".
- THEN sistem berhasil mengautentikasi ke Supabase Auth namun membaca tabel `public.profiles` dengan `role !== 'admin'`.
- THEN sistem seketika mengeksekusi `supabase.auth.signOut()` untuk membatalkan sesi.
- AND sistem menampilkan pesan error visual merah: *"Akses Ditolak: Akun Anda terdaftar sebagai Member, bukan Administrator Backoffice."*
- AND pengguna tetap berada di layar login dan tidak diberi akses ke halaman backoffice.

#### Skenario 3: Penolakan Akun Suspended / Dibekukan

- GIVEN akun administrator memiliki status `status = 'suspended'` di tabel `public.profiles`.
- WHEN pengguna mencoba login dengan kredensial yang tepat.
- THEN sistem membatalkan sesi dan menampilkan pesan peringatan: *"Akun Administrator ini saat ini berstatus Ditangguhkan (Suspended)."*

#### Skenario 4: Kredensial Salah & Validasi Input Kosong

- GIVEN field email atau password dibiarkan kosong saat form disubmit.
- THEN browser memicu validasi HTML5 input required dan form tidak dikirim.
- GIVEN pengguna memasukkan kombinasi email atau password yang salah.
- THEN sistem menampilkan banner peringatan merah: *"Email atau kata sandi tidak valid."*

#### Skenario 5: Sesi Persisten (Session Restoration)

- GIVEN administrator telah login dan berada di dalam dashboard admin.
- WHEN administrator me-refresh browser atau membuka tab baru pada domain yang sama.
- THEN fungsi `AdminAuthService.getCurrentAdmin()` membaca sesi aktif dari Supabase storage.
- AND sistem tidak melempar pengguna ke halaman login, melainkan langsung menampilkan panel admin tanpa interupsi.

#### Skenario 6: Fitur Logout

- GIVEN administrator sedang berada di dalam panel admin.
- WHEN administrator menekan tombol "Keluar" (*Sign Out*) pada header atau sidebar.
- THEN sistem memanggil `supabase.auth.signOut()`, menghapus state sesi lokal, dan mengarahkan kembali ke halaman Landing Page publik (`/`).

### Kondisi Pasca-Aksi (Post-conditions)

- Token akses JWT tersimpan di klien.
- State `currentAdmin` terisi dengan metadata: `id`, `full_name`, `email`, `role`, `status`.

---

## 1.2. Dashboard Overview & Metrik Ekosistem

### User Story

Sebagai Administrator, saya ingin melihat ringkasan metrik statistik ekosistem PALTI FX secara real-time di halaman utama backoffice, agar saya dapat memantau pertumbuhan member, kurikulum materi, dan aktivitas kode undangan secara cepat.

### Prasyarat (Pre-conditions)

1. Administrator telah login secara sah dengan `role = 'admin'`.
2. Stored procedure / fungsi RPC `get_admin_dashboard_stats` terpasang di database Supabase.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. Menampilkan 4 kartu ringkasan metrik utama:
   - Total Member Terdaftar (akumulasi akun dengan `role = 'member'`).
   - Member Aktif (member dengan status `active`).
   - Total Modul & Bab Kurikulum Edukasi (total record `edu_modules` dan `edu_lessons`).
   - Statistik Kode Undangan VIP (jumlah kode aktif vs kode yang sudah diklaim).
2. Menampilkan informasi admin yang sedang bertugas (Nama Lengkap, Alamat Email, Badge Role).
3. Menyediakan tombol pintas (*quick navigation*) menuju modul:
   - "Kelola Kurikulum" -> mengarahkan ke tab Materi.
   - "Penerbitan Undangan" -> mengarahkan ke tab Invitations.
   - "Direktori Pengguna" -> mengarahkan ke tab Users.
4. Jika pengambilan data metrik sedang berlangsung, tampilkan skeleton loader atau indikator pemuatan data.

---

## 1.3. Manajemen Modul Kurikulum (CRUD Modul)

### User Story

Sebagai Administrator, saya ingin membuat modul pembelajaran baru, mengatur posisinya, dan menghapus modul yang tidak relevan, agar silabus materi forex tersusun secara bertahap dan rapi bagi para trader.

### Prasyarat (Pre-conditions)

1. Pengguna login sebagai admin.
2. Tabel `public.edu_modules` siap menerima operasi tulis yang dilindungi kebijakan RLS khusus admin.

### Aturan Bisnis & Validasi Input

- Field `Judul Modul` wajib diisi, minimal 3 karakter dan maksimal 100 karakter.
- Field `Sub-judul` opsional, mendeskripsikan tujuan pembelajaran modul (maksimal 250 karakter).
- Field `Level` wajib dipilih dari 3 opsi: `'Pemula'`, `'Menengah'`, atau `'Lanjutan'`.
- Field `Ikon` berupa nama identifikasi ikon Ionicons/Lucide (default: `'school-outline'`).
- Kolom `sort_order` otomatis dihitung dari urutan tertinggi yang ada ditambah 1 saat penambahan baru.
- Immutability Rule: Pengubahan konten modul yang telah rilis dilindungi agar tidak merusak progres belajar member yang sedang berjalan (perubahan struktur dilakukan melalui reordering atau penghapusan).

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Menambah Modul Baru (Create)

- GIVEN admin berada di tab Kurikulum Materi.
- WHEN admin menekan tombol "+ Tambah Modul".
- THEN sistem menampilkan jendela modal "Tambah Modul Baru".
- WHEN admin mengisi judul (contoh: "Analisa Teknikal Candlestick"), sub-judul, memilih level "Menengah", dan menekan tombol "Simpan Modul".
- THEN sistem memvalidasi kelengkapan form, memanggil `AdminMateriService.createModule()`, dan menyimpan data ke tabel `public.edu_modules`.
- THEN modal tertutup otomatis, muncul banner notifikasi hijau *"Modul baru berhasil ditambahkan"*, dan daftar modul di sisi kiri langsung ter-refresh menampilkan modul baru di urutan paling bawah.

#### Skenario 2: Mengubah Urutan Modul (Reorder)

- GIVEN terdapat lebih dari satu modul pada daftar kurikulum.
- WHEN admin menekan tombol panah naik `[⬆️]` pada modul urutan kedua.
- THEN posisi modul kedua berpindah ke urutan pertama secara visual.
- AND sistem memperbarui nilai `sort_order` seluruh modul terkait di Supabase secara paralel.
- AND tombol panah naik pada modul teratas otomatis berstatus dinonaktifkan (*disabled*), begitu pula tombol panah turun pada modul paling bawah.

#### Skenario 3: Menghapus Modul dengan Konfirmasi (Delete Safeguard)

- GIVEN admin memilih salah satu modul yang ingin dihapus.
- WHEN admin menekan tombol "Hapus" pada header modul.
- THEN sistem TIDAK langsung menghapus data, melainkan memunculkan modal konfirmasi bahaya (*Delete Safeguard Modal*).
- AND modal menampilkan peringatan: *"Hapus Modul? Tindakan ini tidak dapat dibatalkan. Seluruh bab di dalam modul ini akan terhapus permanen."*
- WHEN admin menekan tombol "Ya, Hapus".
- THEN sistem mengeksekusi penghapusan record di Supabase (beserta seluruh bab relasinya via *cascade delete*).
- AND modal tertutup, modul hilang dari daftar, dan sistem otomatis memilih modul pertama yang tersisa sebagai modul aktif.

---

## 1.4. Manajemen Bab Materi & Multi-Video YouTube (CRUD Lesson)

### User Story

Sebagai Administrator, saya ingin menyusun bab pembelajaran di setiap modul, memasukkan naskah panduan silabus, dan menyematkan beberapa video YouTube tutorial sekaligus, agar member mendapatkan pembelajaran visual dan teori yang mendalam.

### Prasyarat (Pre-conditions)

1. Terdapat minimal 1 modul yang dipilih di layar materi.
2. Kolom `youtube_urls` di tabel `public.edu_lessons` bertipe array teks (`text[]`).

### Aturan Bisnis & Validasi Input

- Field `Judul Bab` wajib diisi (minimal 3 karakter).
- Field `Estimasi Waktu Baca` berupa angka bilangan bulat dalam menit (minimal 1 menit, default: 5 menit).
- Field `Tautan Video YouTube` opsional, namun jika diisi wajib divalidasi keabsahannya menggunakan universal regex parser.
- Mendukung format link YouTube:
  - Format standar web: `https://www.youtube.com/watch?v=VIDEO_ID`
  - Format shortlink: `https://youtu.be/VIDEO_ID`
  - Format embed: `https://www.youtube.com/embed/VIDEO_ID`
  - Format YouTube Shorts: `https://www.youtube.com/shorts/VIDEO_ID`
- Sistem mengizinkan penambahan lebih dari 1 video YouTube dalam satu bab (*multi-video support*).
- Field `Naskah Materi` berupa teks deskriptif / format markdown untuk bahan bacaan siswa.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Menambah Bab Materi dengan Multi-Video (Create)

- GIVEN admin sedang membuka salah satu modul di workspace materi.
- WHEN admin menekan tombol "+ Tambah Bab".
- THEN jendela modal form pembuatan bab terbuka.
- WHEN admin mengisi judul bab: "Memahami Support dan Resistance", durasi: 7 menit, dan mengetikkan URL YouTube `https://youtu.be/abc123xyz78` lalu menekan tombol "+ Tambah Video".
- THEN sistem mengekstrak video ID `abc123xyz78`, memasukkan video ke daftar antrean video di form, dan mengosongkan input URL untuk video berikutnya.
- WHEN admin menambahkan video kedua `https://www.youtube.com/watch?v=def456uvw90`.
- THEN daftar video form kini menampilkan 2 video dengan tombol hapus (*trash icon*) pada masing-masing item.
- WHEN admin mengisi naskah panduan silabus dan menekan "Simpan Bab".
- THEN data tersimpan ke tabel `public.edu_lessons` dengan kolom `youtube_urls = ARRAY['https://...', 'https://...']`.
- AND modal tertutup, muncul notifikasi sukses, dan bab baru muncul pada daftar silabus modul aktif.

#### Skenario 2: Validasi URL YouTube Tidak Valid (Negative Path)

- GIVEN admin menginput tautan yang bukan link YouTube (contoh: `https://google.com` atau teks acak) ke field URL video.
- WHEN admin menekan tombol "+ Tambah Video".
- THEN sistem menolak penambahan video dan menampilkan pesan error peringatan: *"Tautan YouTube tidak valid. Pastikan format link benar (contoh: https://youtu.be/... atau watch?v=...)"*.
- AND daftar antrean video tidak bertambah.

#### Skenario 3: Mengatur Urutan Bab Materi (Reorder Lesson)

- GIVEN sebuah modul memiliki lebih dari 1 bab materi.
- WHEN admin menekan tombol `[⬆️]` atau `[⬇️]` pada baris bab tertentu.
- THEN urutan bab bertukar tempat secara visual dan nomor urut diperbarui.
- AND sistem memperbarui kolom `sort_order` pada database secara instan.

#### Skenario 4: Menghapus Bab Materi (Delete Lesson)

- GIVEN admin menekan tombol hapus pada salah satu baris bab materi.
- THEN muncul modal konfirmasi penghapusan bab dengan nama bab yang bersangkutan.
- WHEN admin mengonfirmasi penghapusan, record bab dihapus dari Supabase.
- AND bab tersebut hilang dari tampilan silabus modul.

---

## 1.5. Pratinjau Interaktif Materi Siswa (In-App Cinematic Preview)

### User Story

Sebagai Administrator, saya ingin melihat simulasi tampilan bab materi lengkap dengan pemutar video responsif dan naskah bacaan, agar saya dapat memastikan kualitas audio-visual dan layout materi sebelum dirilis kepada member.

### Prasyarat (Pre-conditions)

1. Bab materi yang dipilih memiliki data tersimpan di database.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Akses Tombol Pratinjau**: Pada setiap baris bab di daftar silabus, terdapat tombol "Pratinjau" dengan ikon mata (*Eye icon*).
2. **Modal Pratinjau Sinematik**: Menekan tombol pratinjau membuka modal overlay dengan backdrop blur gelap.
3. **Pemutar Video Interaktif**:
   - Jika bab memiliki 1 video: video YouTube otomatis dimuat dalam frame embed responsif rasio 16:9 beresolusi tinggi.
   - Jika bab memiliki >1 video: sistem menampilkan deretan tombol navigasi pemilih video (*"Video #1"*, *"Video #2"*, dst.) di atas player. Mengklik salah satu tombol akan mengganti sumber pemutar video secara instan tanpa reload modal.
   - Jika bab tidak memiliki video: area player disembunyikan dan antarmuka langsung menyajikan naskah teks teori.
4. **Pembaca Naskah Terstruktur**: Area naskah teks disajikan di bawah video dengan typography yang nyaman dibaca, preserving baris baru dan paragraf (*pre-wrap*).
5. **Tombol Penutup**: Modal dapat ditutup dengan menekan tombol silang (*X*), tombol "Tutup Pratinjau", atau menekan area backdrop luar.

---

## 1.6. Manajemen Kode Undangan VIP (Invitations Engine)

### User Story

Sebagai Administrator, saya ingin membuat kode undangan VIP baru dan memantau status penggunaannya, agar pendaftaran akun member di aplikasi mobile tetap terkontrol dan eksklusif.

### Prasyarat (Pre-conditions)

1. Pengguna login sebagai admin.
2. Tabel `public.invitations` aktif dan terikat kebijakan RLS `invitations_admin_policy`.

### Aturan Bisnis & Validasi Input

- Kode undangan bersifat unik dan tidak peka huruf besar/kecil (*case-insensitive* setelah normalisasi).
- Pembuatan kode undangan di Web Admin dikunci mutlak hanya untuk `role = 'member'`.
- Status kode undangan terbagi menjadi:
  - `active`: belum pernah dipakai dan belum melewati tanggal kedaluwarsa.
  - `used`: telah diklaim oleh salah satu member (`used_by IS NOT NULL` dan `used_at IS NOT NULL`).
  - `expired`: telah melewati masa berlaku sebelum sempat digunakan.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Daftar Kode Undangan**: Menampilkan tabel kode undangan yang memuat: Kode VIP, Email Ditargetkan (jika ada), Status, Tanggal Dibuat, dan Member yang Mengklaim.
2. **Form Penerbitan Kode**:
   - Admin dapat memasukkan kode kustom (contoh: `PFX-SURABAYA-2026`) atau menekan tombol generate otomatis.
   - Admin dapat menentukan tanggal masa berlaku (opsional).
   - Menekan tombol "Terbitkan Kode" menyimpan data ke database.
3. **Penyalinan Sekali Klik (*Copy to Clipboard*)**: Tersedia tombol salin di samping setiap kode undangan yang memunculkan indikator visual *"Tersalin!"* saat diklik.
4. **Pencegahan Kode Duplikat**: Jika admin mencoba membuat kode yang sudah terdaftar, sistem menolak dan memunculkan pesan peringatan kode sudah ada.

---

## 1.7. Direktori Member, Pemantauan Akun & Ban Enforcement (User Management)

### User Story

Sebagai Administrator, saya ingin melihat seluruh profil trader yang terdaftar dan memiliki wewenang untuk membekukan akun yang melanggar aturan, agar integritas dan keamanan ekosistem komunitas PALTI FX terjaga.

### Prasyarat (Pre-conditions)

1. Pengguna login sebagai admin.
2. Tabel `public.profiles` dan stored procedure keamanan Supabase aktif.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Melihat Direktori Member & Pencarian

- GIVEN admin membuka tab "Member & Hak Akses".
- THEN sistem menampilkan tabel seluruh member komunitas dengan data: Avatar inisial, Nama Lengkap, Email, ID Member resmi (`PFX-XXXXXXXX`), Role (`member` / `admin`), dan Status Akun (`active` / `suspended`).
- WHEN admin mengetikkan nama, email, atau ID Member di kolom pencarian.
- THEN tabel secara reaktif memfilter baris yang cocok tanpa perlu reload halaman.

#### Skenario 2: Melihat Modal Detail Profil

- GIVEN admin mengklik salah satu baris trader di tabel.
- THEN jendela pop-up modal profil muncul di tengah layar menampilkan detail lengkap trader: ID Member unik, waktu bergabung, email, role badge, dan tombol aksi status.

#### Skenario 3: Membekukan Akun Member (Ban Enforcement)

- GIVEN seorang trader berstatus `active` melanggar aturan komunitas.
- WHEN admin membuka detail profil member tersebut dan menekan tombol aksi "Suspend Akun".
- THEN sistem meminta konfirmasi tindakan pembekuan akun.
- WHEN admin menyetujui, sistem memperbarui `status = 'suspended'` di tabel `public.profiles`.
- AND trigger PostgreSQL `profiles_sync_ban` secara otomatis memperbarui tabel internal `auth.users` dengan menyetel `banned_until = now() + interval '100 years'`.
- AND token sesi JWT pengguna di aplikasi mobile seketika dibatalkan oleh engine Supabase Auth (*force logout*).
- AND status di tabel admin langsung berubah menampilkan badge merah `"Suspended"`.

#### Skenario 4: Memulihkan Akun (Unsuspend)

- GIVEN seorang pengguna berstatus `suspended`.
- WHEN admin menekan tombol aksi "Aktifkan Akun (Unsuspend)".
- THEN sistem mengembalikan `status = 'active'` pada `public.profiles` dan menghapus `banned_until` pada `auth.users`.
- AND pengguna dapat login kembali ke aplikasi mobile secara normal.

---

## 1.8. Web Landing Page Publik

### User Story

Sebagai Calon Trader atau Pengunjung, saya ingin mengakses halaman utama website PALTI FX, agar saya dapat memahami visi komunitas, meninjau silabus kurikulum, dan mengetahui cara mengakses aplikasi.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Hero Section**: Memuat judul utama komunitas trading privat PALTI FX, logo resmi, dan tombol navigasi utama.
2. **Kurikulum Showcase**: Menampilkan ringkasan tingkatan materi edukasi (Dasar Forex, Manajemen Risiko, Psikologi & Jurnal Trading).
3. **Peralatan Trader**: Memperkenalkan fitur kalkulator lot, manajemen posisi pips, dan jurnal statistik.
4. **Akses Masuk Admin**: Terdapat tombol navigasi tersembunyi/khusus di pojok atas atau footer menuju konsol administrator (`/admin/login`).
5. **Responsivitas**: Tampilan tata letak halaman proporsional dan tidak rusak saat dibuka di ponsel, tablet, maupun layar desktop resolusi tinggi.

---

# 2. MODUL MOBILE: TRADER & ADMIN APP

---

## 2.1. Onboarding Carousel & Welcome Sequence

### User Story

Sebagai Pengguna yang baru pertama kali menginstal aplikasi, saya ingin melihat slide penjelasan fitur utama, agar saya memahami esensi dan alur kerja aplikasi PALTI FX sebelum masuk ke akun.

### Prasyarat (Pre-conditions)

1. Nilai cache lokal penyimpanan perangkat `welcomed` bernilai `false` atau belum terdefinisi.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. Aplikasi menampilkan carousel horizontal berisi 4 slide ilustratif:
   - Slide 1: Komunitas Trading Privat & Eksklusif.
   - Slide 2: Kurikulum Edukasi Terstruktur & Video Masterclass.
   - Slide 3: Kalkulator Risiko Presisi & Manajemen Lot.
   - Slide 4: Jurnal Trading Disiplin & Pelacak Medali Prestasi.
2. Pengguna dapat menggeser layar (*swipe gesture*) atau menekan tombol navigasi "Lanjut".
3. Pada slide terakhir, tombol berubah menjadi "Mulai Sekarang".
4. Menekan tombol "Mulai Sekarang" menyimpan flag `welcomed: true` di penyimpanan persisten perangkat (`AsyncStorage`) dan mengarahkan pengguna ke layar Login.
5. Saat aplikasi dibuka pada sesi-sesi berikutnya, layar onboarding TIDAK AKAN ditampilkan lagi dan aplikasi langsung menuju alur login/dashboard.

---

## 2.2. Dual-Identifier Login (Email atau ID Member PFX)

### User Story

Sebagai Trader atau Admin, saya ingin login menggunakan alamat email ATAU ID Member unik saya beserta kata sandi, agar saya memiliki fleksibilitas akses ke akun trading saya.

### Prasyarat (Pre-conditions)

1. Pengguna telah menyelesaikan onboarding.
2. Akun pengguna aktif di database Supabase.

### Aturan Bisnis & Validasi Input

- Field identifier dapat menerima dua format:
  1. Alamat email standar (contoh: `trader@gmail.com`).
  2. ID Member unik format PALTI FX (contoh: `PFX-7A8B9C1D`).
- Jika pengguna memasukkan ID Member:
  - Sistem mendeteksi awalan `PFX-` (case-insensitive).
  - Sistem memanggil RPC PostgreSQL `public.resolve_member_email(p_member_id)`.
  - Jika ID ditemukan, RPC mengembalikan email yang terikat secara aman.
  - Jika ID tidak ditemukan, sistem langsung menghentikan proses dengan pesan kredensial tidak cocok.
- Setelah email teresolusi, otentikasi kata sandi diproses via `supabase.auth.signInWithPassword`.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Login Berhasil dengan ID Member (Happy Path)

- GIVEN pengguna berada di layar Login aplikasi mobile.
- WHEN pengguna menginputkan ID Member `PFX-A1B2C3D4` dan kata sandi yang valid.
- AND menekan tombol "Masuk ke Akun".
- THEN sistem memanggil RPC `resolve_member_email`, mendapatkan email pengguna, dan mengautentikasi kata sandi.
- AND sistem memuat data profil (`full_name`, `role`, `status`, `member_id`).
- AND sistem menyimpan token sesi di `SecureStore` perangkat dan memicu sinkronisasi data cloud.
- THEN pengguna berhasil masuk ke Dashboard Utama (*Home Screen*).

#### Skenario 2: Login Berhasil dengan Email

- GIVEN pengguna menginputkan email `trader@gmail.com` dan kata sandi yang valid.
- WHEN pengguna menekan tombol "Masuk ke Akun".
- THEN sistem langsung memproses otentikasi tanpa memanggil RPC resolver.
- THEN pengguna berhasil masuk ke Dashboard Utama.

#### Skenario 3: Penolakan Akun Suspended

- GIVEN akun pengguna telah ditangguhkan (`status = 'suspended'`).
- WHEN pengguna mencoba login dengan kredensial yang tepat.
- THEN otentikasi ditolak dan sistem menampilkan modal peringatan: *"Akun ini ditangguhkan. Silakan hubungi admin PALTI FX."*
- AND pengguna tidak diizinkan masuk ke dalam aplikasi.

#### Skenario 4: Fitur Tampilkan/Sembunyikan Sandi

- GIVEN pengguna mengetikkan kata sandi pada field input.
- WHEN pengguna menekan ikon mata (*eye toggle*).
- THEN karakter kata sandi beralih dari teks tersembunyi (titik-titik) menjadi teks terbaca, dan sebaliknya saat ditekan kembali.

---

## 2.3. Aktivasi Akun Baru via Kode Undangan VIP (Zero Public Registration)

### User Story

Sebagai Calon Member Komunitas, saya ingin mengaktifkan akun baru menggunakan kode undangan VIP yang saya dapatkan dari admin, agar saya dapat bergabung dan belajar di ekosistem trading PALTI FX.

### Prasyarat (Pre-conditions)

1. Calon member memiliki kode undangan resmi yang terdaftar dan belum kedaluwarsa di tabel `public.invitations`.

### Aturan Bisnis & Validasi Input

- Pendaftaran tanpa kode undangan dilarang mutlak (*Zero Public Registration*).
- Input yang dibutuhkan: Alamat Email, Kode Undangan VIP, Kata Sandi Baru (minimal 6 karakter), dan Konfirmasi Kata Sandi.
- Kode undangan dinormalisasi secara otomatis (menghapus spasi di awal/akhir, menghapus karakter strip, dan diubah ke huruf kapital).
- Trigger database PostgreSQL `handle_new_user`:
  - Memverifikasi keberadaan dan keabsahan kode di `public.invitations`.
  - Jika valid: membuat record di `public.profiles`, men-generate ID Member acak `PFX-XXXXXXXX`, menandai kode sebagai terpakai (`used_at = now()`), dan mengonfirmasi email secara otomatis.
  - Jika tidak valid: membatalkan transaksi pendaftaran secara atomik (*rollback*).

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Aktivasi Akun Berhasil (Happy Path)

- GIVEN pengguna membuka modal "Aktivasi Akun Baru" dari layar login.
- WHEN pengguna menginputkan email `memberbaru@gmail.com`, kode undangan `PFX-MEMBER-VIP`, kata sandi `rahasia123`, dan konfirmasi sandi yang cocok.
- AND pengguna menekan tombol "Aktivasi Akun Sekarang".
- THEN sistem mengirimkan data pendaftaran ke Supabase Auth dengan metadata kode undangan.
- AND trigger database memvalidasi kode, menerbitkan ID Member baru, dan mengaktifkan akun.
- AND aplikasi langsung melakukan auto-login dan mengarahkan pengguna baru ke Dashboard dengan pesan selamat datang.

#### Skenario 2: Kode Undangan Tidak Valid atau Sudah Terpakai (Negative Path)

- GIVEN pengguna memasukkan kode undangan yang salah, fiktif, atau sudah pernah digunakan orang lain sebelumnya.
- WHEN pengguna menekan tombol aktivasi.
- THEN database menolak transaksi pendaftaran.
- AND aplikasi menampilkan pesan kesalahan: *"Kode aktivasi undangan tidak valid atau sudah kedaluwarsa. Hubungi admin PALTI FX."*
- AND akun baru tidak dibuat.

#### Skenario 3: Kata Sandi dan Konfirmasi Tidak Cocok

- GIVEN kata sandi dan konfirmasi kata sandi yang diinputkan pengguna berbeda.
- WHEN pengguna menekan tombol aktivasi.
- THEN sistem menampilkan validasi error lokal: *"Konfirmasi kata sandi tidak cocok."* tanpa mengirim request ke server.

---

## 2.4. Pemulihan Kata Sandi & Verifikasi OTP 6-Digit

### User Story

Sebagai Pengguna yang lupa kata sandi akun, saya ingin meminta kode OTP verifikasi ke email saya dan menyetel kata sandi baru, agar saya dapat memulihkan akses ke akun saya secara mandiri.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Permintaan Kode OTP Reset Password

- GIVEN pengguna berada di form login dan memilih menu "Lupa Kata Sandi".
- WHEN pengguna menginputkan alamat email terdaftar dan menekan "Kirim Kode OTP".
- THEN sistem memanggil `supabase.auth.resetPasswordForEmail()` dan mengirimkan kode OTP 6-digit ke email pengguna.
- AND layar beralih ke form input verifikasi OTP 6-digit.

#### Skenario 2: Verifikasi OTP dan Pembuatan Sandi Baru

- GIVEN pengguna menerima 6 digit kode OTP di kotak masuk emailnya.
- WHEN pengguna memasukkan 6 digit kode OTP dan menginputkan kata sandi baru (minimal 6 karakter).
- AND pengguna menekan "Perbarui Kata Sandi".
- THEN sistem memverifikasi OTP melalui `supabase.auth.verifyOtp()` dengan tipe `recovery`.
- AND jika OTP valid, sistem memanggil `supabase.auth.updateUser({ password: newPassword })`.
- THEN muncul modal notifikasi sukses *"Kata sandi berhasil diperbarui"* dan pengguna dapat login menggunakan sandi baru tersebut.

---

## 2.5. Pemisahan Hak Akses (RBAC) Admin vs Member di Mobile

### User Story

Sebagai Pengguna Mobile, saya ingin tampilan aplikasi otomatis menyesuaikan fitur berdasarkan peran akun saya (Member atau Admin), agar antarmuka fokus pada kebutuhan peran saya.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Deteksi Role Otomatis**: Saat login atau rekonsiliasi sesi berhasil, sistem menyimpan nilai role ke state global aplikasi (`settings.role`).
2. **Pengalaman Pengguna Member (`role = 'member'`)**:
   - Layar Edukasi berstatus *Read-Only*: Member hanya dapat menelusuri silabus, membuka bab, memutar video YouTube, dan menekan tombol selesai.
   - Tidak ada tombol tambah modul, edit, hapus, maupun tombol geser urutan panah.
3. **Pengalaman Pengguna Admin (`role = 'admin'`)**:
   - Layar Edukasi otomatis memunculkan tombol manajerial:
     - Tombol floating "+ Tambah Modul" di pojok atas layar edukasi.
     - Tombol "+ Tambah Bab" di setiap modul.
     - Tombol panah `[⬆️]` dan `[⬇️]` pada daftar bab untuk mengatur urutan langsung dari HP.
     - Tombol hapus (*trash icon*) pada modul dan bab dengan konfirmasi modal.
4. **Proteksi Backend RLS**: Kebijakan Row Level Security di database menjamin bahwa request mutasi data kurikulum dari token dengan role member akan ditolak dengan error `403 Forbidden` di level database PostgreSQL.

---

## 2.6. Silabus Edukasi & Pemutar Video YouTube Terintegrasi

### User Story

Sebagai Member, saya ingin mempelajari silabus forex bab demi bab dan memutar video materi langsung di dalam aplikasi, agar proses belajar trading saya terstruktur dan mudah dipahami.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Daftar Modul Berjenjang**:
   - Menampilkan modul yang dikelompokkan berdasarkan tingkatan: Pemula (hijau), Menengah (emas), Lanjutan (merah).
   - Menampilkan status progres kelulusan tiap modul (contoh: *3 dari 5 bab selesai*).
2. **Layar Detail Bab Materi**:
   - Menampilkan judul bab, estimasi durasi baca, dan nomor urut.
   - Jika bab memiliki video YouTube: memuat video menggunakan komponen `WebView` / YouTube player responsif tanpa iklan luar.
   - Jika bab memiliki >1 video YouTube: menyediakan tombol tab horizontal (*"Video 1"*, *"Video 2"*, dst.) di atas pemutar video.
   - Menampilkan naskah teori penjelasan silabus di bawah video dengan format bacaan yang rapi.
3. **Penyelesaian Bab**:
   - Terdapat tombol "Tandai Selesai" di akhir materi bab.
   - Menekan tombol menandai bab sebagai selesai (`completed[lessonId] = true`), memicu animasi haptic feedback, memperbarui persentase progres di beranda, dan meng-upsert data ke tabel `public.user_lesson_progress` di Supabase.

---

## 2.7. Jurnal Trading Forex & Analisis Performa

### User Story

Sebagai Trader, saya ingin mencatat setiap transaksi trading forex saya lengkap dengan detail teknikal dan kondisi psikologis, serta melihat metrik performa trading saya secara otomatis.

### Aturan Bisnis & Validasi Input

- Field input transaksi:
  - `Pair`: pasangan mata uang (contoh: XAU/USD, EUR/USD, GBP/JPY).
  - `Tipe`: posisi transaksi (`BUY` atau `SELL`).
  - `Ukuran Lot`: volume transaksi (contoh: 0.01, 0.10, 1.00).
  - `Harga Entry` & `Harga Exit`: angka desimal nilai harga pembukaan dan penutupan.
  - `Profit / Loss ($)`: hasil keuntungan/kerugian bersih dalam Dolar AS.
  - `Kondisi Emosi`: evaluasi psikologis (contoh: Disiplin, Tenang, Takut/FOMO, Serakah).
  - `Catatan Setup`: uraian analisa alasan masuk posisi.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Form Pencatatan Transaksi**:
   - Trader dapat membuka modal form trade baru, mengisi seluruh parameter transaksi, dan menyimpannya.
   - Data otomatis tersimpan di storage lokal instan (0ms latensi) dan disinkronkan ke tabel `public.user_trades` di cloud.
2. **Daftar Riwayat Transaksi**:
   - Menampilkan daftar trade dengan kartu visual: badge warna hijau untuk transaksi profit dan merah untuk transaksi loss.
   - Menampilkan tanggal, pair, lot, tipe posisi, dan nominal perolehan ($).
3. **Analisis Statistik Otomatis**:
   - Sistem secara reaktif menghitung dan menampilkan metrik performa:
     - Total Transaksi (jumlah trade yang tercatat).
     - Win Rate (%) = (Jumlah Transaksi Profit / Total Transaksi) * 100%.
     - Total Net PnL ($) = akumulasi keuntungan dikurangi kerugian.
4. **Hapus Transaksi**: Trader dapat menghapus baris riwayat trade yang salah melalui konfirmasi dialog.

---

## 2.8. Kalkulator Risiko Trading (Lot Size & Risk/Reward)

### User Story

Sebagai Trader, saya ingin menghitung ukuran lot yang aman dan rasio perbandingan Risk-to-Reward sebelum membuka posisi, agar saya terhindar dari risiko kehilangan modal yang berlebihan (*over-risk*).

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

#### Skenario 1: Kalkulator Ukuran Lot (Lot Size Calculator)

- GIVEN trader membuka tab Kalkulator pada menu "Lot Size".
- WHEN trader menginputkan:
  - Saldo Modal Akun (contoh: `$1000`).
  - Toleransi Risiko per Transaksi (contoh: `1%` atau `2%`).
  - Jarak Stop Loss dalam Pips/Points (contoh: `25 pips`).
- THEN kalkulator secara realtime menghitung:
  - Maksimal Uang Berisiko = `Saldo * (Risiko / 100)` -> contoh: `$10.00`.
  - Rekomendasi Ukuran Lot = Dihitung proporsional terhadap nilai per pip pair (contoh: `0.04 Lot`).
- AND hasil perhitungan berubah instan setiap kali slider atau angka input digeser.

#### Skenario 2: Kalkulator Risk to Reward (R:R Calculator)

- GIVEN trader membuka menu kalkulator "Risk : Reward".
- WHEN trader menginputkan Harga Entry (misal: 2000.00), Harga Stop Loss (misal: 1995.00), dan Harga Take Profit (misal: 2010.00).
- THEN sistem menghitung:
  - Jarak Risiko = 5.00 poin; Jarak Potensi Profit = 10.00 poin.
  - Rasio R:R = `1 : 2.0`.
  - Minimum Win Rate yang dibutuhkan agar impas = `1 / (1 + Reward) * 100%` -> `33.3%`.

---

## 2.9. Profil Trader, Medali Pencapaian & Streak Belajar

### User Story

Sebagai Trader, saya ingin melihat profil akun, ID Member unik, medali pencapaian (*achievements*), dan streak hari belajar saya, agar saya termotivasi untuk terus konsisten mengembangkan kemampuan trading saya.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Header Profil**: Menampilkan nama trader, email, status akun aktif, dan badge ID Member resmi `PFX-XXXXXXXX` yang dapat disalin dengan mudah.
2. **Medali Pencapaian (Badges)**:
   - Menampilkan koleksi medali trading (contoh: *Pencatat Pertama, Disiplin Jurnal 3 Hari, Pembelajar Dasar, Master Edukasi*).
   - Medali yang sudah terpenuhi persyaratannya akan menyala dengan aksen warna emas PALTI FX dan menampilkan tanggal tercapainya.
   - Medali yang belum tercapai ditampilkan dalam kondisi redup/terkunci beserta petunjuk cara membukanya.
3. **Streak Belajar Harian**:
   - Menghitung keaktifan belajar harian pengguna.
   - Menampilkan ikon api dan jumlah hari streak aktif berturut-turut.
4. **Proses Logout Bersih**:
   - Menekan tombol "Keluar Akun" menampilkan dialog konfirmasi.
   - Saat disetujui, sistem menghapus token otentikasi di `SecureStore`, membersihkan cache data pengguna lokal di `AsyncStorage`, dan mereset state aplikasi ke kondisi awal layar login untuk mencegah kebocoran data pada perangkat bersama.

---

## 2.10. Arsitektur Sinkronisasi Cloud Otomatis (Offline-First / Wasalaam Rule)

### User Story

Sebagai Pengguna Mobile, saya ingin seluruh progres materi belajar, transaksi jurnal, dan medali saya otomatis tersimpan aman di cloud Supabase, agar data berharga saya tidak hilang ketika berganti perangkat atau menginstal ulang aplikasi.

### Prasyarat (Pre-conditions)

1. Tabel data pengguna di Supabase aktif: `public.user_lesson_progress`, `public.user_trades`, dan `public.user_achievements`.
2. Seluruh tabel menggunakan isolasi keamanan Row Level Security berbasis `auth.uid() = user_id`.

### Kriteria Penerimaan Terperinci (Acceptance Criteria)

1. **Prinsip Offline-First (Zero Latency UI)**:
   - Setiap aksi penambahan jurnal trade atau penandaan materi selesai selalu ditulis terlebih dahulu ke state lokal dan `AsyncStorage` perangkat secara instan (0ms penundaan antarmuka).
2. **Sinkronisasi Latar Belakang (Background Upsert)**:
   - Setelah penulisan lokal berhasil, layanan `UserSyncService` secara asinkron mengirimkan mutasi data (`upsert`) ke tabel cloud Supabase yang terikat dengan ID pengguna.
   - Jika koneksi internet terputus, data tetap aman di perangkat lokal dan akan disinkronkan otomatis saat koneksi internet kembali aktif.
3. **Pemulihan Data Saat Login di Perangkat Baru (Restore on Login)**:
   - Saat pengguna berhasil login pada perangkat HP baru, sistem otomatis mengeksekusi `syncFromCloud()`.
   - Seluruh daftar transaksi jurnal lama, daftar bab yang sudah diselesaikan, dan medali yang pernah diraih diunduh dari Supabase dan diisi kembali ke memori aplikasi.
4. **Isolasi Data Antar Pengguna**:
   - Data akun pengguna A tidak akan pernah bisa diakses atau tertukar dengan akun pengguna B pada perangkat yang sama karena dibersihkannya storage saat logout dan proteksi RLS ketat di sisi server database.

---

# RINGKASAN MATRIKS HAK AKSES SISTEM (RBAC MATRIX)

| Fungsionalitas / Modul                   |  Member Biasa (Mobile)  | Administrator (Web & Mobile) |  Pengunjung Publik  |
| :--------------------------------------- | :---------------------: | :--------------------------: | :-----------------: |
| Akses Landing Page Publik                |           Ya           |              Ya              |         Ya         |
| Akses Konsol Web Backoffice (`/admin`) |  Ditolak (Auto-Logout)  |       Ya (Akses Penuh)       |       Ditolak       |
| Membaca Materi Kurikulum & Video         |     Ya (Read-Only)     |       Ya (Full Access)       | Terbatas (Showcase) |
| Menambah / Menghapus Modul & Bab         |          Tidak          |              Ya              |        Tidak        |
| Mengatur Urutan Silabus Materi           |          Tidak          |              Ya              |        Tidak        |
| Menerbitkan Kode Undangan VIP            |          Tidak          |              Ya              |        Tidak        |
| Memantau & Membekukan Akun Member        |          Tidak          |              Ya              |        Tidak        |
| Menggunakan Kalkulator Risiko            |           Ya           |              Ya              |        Tidak        |
| Mencatat Jurnal Trading Pribadi          |    Ya (Data Pribadi)    |      Ya (Data Pribadi)      |        Tidak        |
| Membuka Medali Prestasi & Streak         |           Ya           |              Ya              |        Tidak        |
| Aktivasi Akun Baru                       | Wajib Kode Undangan VIP |    Direct Email/Password    |        Tidak        |
