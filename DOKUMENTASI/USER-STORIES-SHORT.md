**USER STORIES & ACCEPTANCE CRITERIA (VERSI SINGKAT)**

Format ringkas siap salin untuk kartu Jira / Trello proyek PALTI FX.

---

**MODUL WEB (ADMIN BACKOFFICE & LANDING PAGE)**

**1. Web - Login Admin & RBAC**

Story:
Sebagai Admin, saya ingin login menggunakan email dan password agar dapat mengakses dashboard backoffice.

Acceptance Criteria:
- Email dan password wajib diisi.
- Kredensial valid dengan role admin berhasil masuk ke dashboard utama backoffice.
- Akun dengan role member ditolak dan otomatis di-logout.
- Akun berstatus suspended diblokir dari login.
- Sesi admin tersimpan otomatis saat halaman di-refresh.
- Tombol logout tersedia untuk mengakhiri sesi.

---

**2. Web - CRUD Modul Edukasi**

Story:
Sebagai Admin, saya ingin mengelola modul edukasi agar kurikulum silabus terstruktur rapi.

Acceptance Criteria:
- Daftar seluruh modul tampil beserta informasi level dan jumlah bab.
- Tambah modul baru dengan input judul, sub-judul, level (Pemula/Menengah/Lanjutan), dan ikon.
- Urutan modul dapat digeser naik atau turun menggunakan tombol panah.
- Hapus modul dilindungi oleh pop-up konfirmasi (delete safeguard).
- Perubahan data tersimpan secara realtime ke database.

---

**3. Web - CRUD Bab Materi & Multi-Video YouTube**

Story:
Sebagai Admin, saya ingin mengelola bab materi dan menyematkan video YouTube agar materi belajar trading lengkap dan interaktif.

Acceptance Criteria:
- Judul bab dan modul induk wajib ditentukan.
- Naskah panduan silabus dan estimasi durasi baca dapat diinput oleh admin.
- Multi-video YouTube dapat ditambahkan ke dalam satu bab (validasi format URL otomatis).
- Hapus video dari daftar input sebelum disimpan.
- Urutan bab dapat dipindahkan naik atau turun dengan tombol panah.
- Hapus bab materi wajib melalui pop-up konfirmasi.

---

**4. Web - Pratinjau Materi Siswa**

Story:
Sebagai Admin, saya ingin melihat preview tampilan materi di web agar bisa mengecek video dan naskah sebelum diakses member.

Acceptance Criteria:
- Tombol pratinjau pada setiap bab membuka modal simulasi tampilan mobile.
- Video YouTube dapat diputar langsung di dalam modal preview.
- Tab pemilih video tersedia jika bab memiliki lebih dari 1 video.
- Naskah teks materi tampil lengkap dan rapi di bawah video.
- Modal preview dapat ditutup kembali ke halaman kerja admin.

---

**5. Web - Generator & Pelacak Kode Undangan VIP**

Story:
Sebagai Admin, saya ingin menerbitkan dan melacak kode undangan VIP agar pendaftaran member baru terkontrol.

Acceptance Criteria:
- Pembuatan kode undangan baru dikunci khusus untuk role member.
- Daftar kode undangan menampilkan status aktif, terpakai, atau kedaluwarsa.
- Tombol salin kode (copy to clipboard) tersedia untuk distribusi cepat.
- Riwayat penggunaan mencatat akun member yang mengklaim kode beserta tanggal pakai.

---

**6. Web - Manajemen Member & Kontrol Status Akun**

Story:
Sebagai Admin, saya ingin melihat direktori trader dan mengelola status akun agar integritas komunitas tetap terjaga.

Acceptance Criteria:
- Tabel direktori member menampilkan nama, email, ID Member, role, dan status akun.
- Pencarian member tersedia berdasarkan nama, email, atau ID Member.
- Ubah status akun menjadi active atau suspended.
- Akun suspended langsung terblokir dari aplikasi dan sesi dibatalkan seketika.

---

**7. Web - Landing Page Showcase**

Story:
Sebagai Calon Trader, saya ingin melihat informasi ekosistem PALTI FX di web agar memahami fitur aplikasi sebelum bergabung.

Acceptance Criteria:
- Halaman landing page informatif, responsif, dan bertema gelap elegan.
- Ringkasan fitur menampilkan silabus edukasi, kalkulator risiko, dan jurnal trading.
- Navigasi akses admin tersedia untuk menuju halaman login backoffice.

---

**MODUL MOBILE (TRADER & ADMIN APP)**

**1. Mobile - Onboarding Screen**

Story:
Sebagai Pengguna Baru, saya ingin melihat perkenalan fitur saat pertama kali instal aplikasi agar paham manfaat dan cara pakainya.

Acceptance Criteria:
- Carousel slide intro tampil otomatis pada instalasi pertama.
- Informasi fitur utama mencakup edukasi forex, kalkulator lot, dan jurnal transaksi.
- Tombol mulai mengarahkan pengguna ke halaman login dan status onboarding tersimpan di perangkat.

---

**2. Mobile - Dual Identifier Login**

Story:
Sebagai Trader, saya ingin login memakai email atau ID Member unik (PFX-XXXXXXXX) agar fleksibel masuk ke akun pribadi.

Acceptance Criteria:
- Field input identifier menerima format alamat email atau format ID Member PFX-.
- Validasi kata sandi dilengkapi tombol sembunyikan/tampilkan password.
- Kredensial valid mengarahkan pengguna ke dashboard beranda utama.
- Akun suspended diblokir dari login dengan pop-up peringatan penangguhan.
- Sesi login otomatis tersimpan dan dipulihkan saat aplikasi dibuka kembali.

---

**3. Mobile - Aktivasi Akun via Kode Undangan VIP**

Story:
Sebagai Calon Member, saya ingin mengaktifkan akun menggunakan kode undangan VIP agar dapat mendaftar akun baru di komunitas privat.

Acceptance Criteria:
- Form aktivasi akun meminta input email, kode undangan VIP, dan kata sandi baru.
- Pendaftaran tanpa kode undangan aktif otomatis ditolak oleh sistem.
- Kode undangan valid menghasilkan ID Member unik dan status kode ditandai terpakai.
- Auto-login langsung mengarahkan member baru ke dashboard setelah aktivasi berhasil.

---

**4. Mobile - Reset Password & Verifikasi OTP**

Story:
Sebagai Pengguna, saya ingin mereset kata sandi melalui kode OTP email agar dapat memulihkan akun saat lupa sandi.

Acceptance Criteria:
- Permintaan reset meminta input alamat email terdaftar.
- Kode OTP 6-digit dikirimkan langsung ke email pengguna.
- Verifikasi OTP memvalidasi keabsahan 6 digit angka.
- Input sandi baru aktif seketika setelah verifikasi berhasil untuk login berikutnya.

---

**5. Mobile - Role-Based Access Control (RBAC)**

Story:
Sebagai Pengguna, saya ingin antarmuka aplikasi menyesuaikan dengan peran saya agar fitur yang muncul sesuai kewenangan.

Acceptance Criteria:
- Sistem membaca role akun secara otomatis setelah login (Member vs Admin).
- Akun Member hanya bisa membaca materi edukasi (read-only).
- Akun Admin otomatis memunculkan tombol kontrol materi (tambah, urutkan, hapus) di HP.
- Database RLS menjamin akun member tidak dapat memanipulasi data edukasi.

---

**6. Mobile - Belajar Silabus Edukasi & Video YouTube**

Story:
Sebagai Member, saya ingin membaca materi silabus dan menonton video YouTube agar dapat belajar trading forex dengan terarah.

Acceptance Criteria:
- Daftar modul terbagi berdasarkan kategori tingkat kesulitan (Pemula, Menengah, Lanjutan).
- Layar detail bab memuat naskah materi teks dan pemutar video YouTube terintegrasi.
- Navigasi multi-video tersedia jika bab memiliki lebih dari 1 video.
- Tombol tandai selesai memperbarui persentase kelulusan kurikulum di beranda.

---

**7. Mobile - Jurnal Trading Forex & Statistik**

Story:
Sebagai Trader, saya ingin mencatat transaksi trading dan melihat statistik performa agar evaluasi trading saya terukur.

Acceptance Criteria:
- Form input transaksi mencakup Pair, Buy/Sell, Lot, Entry, Exit, PnL, emosi, dan catatan.
- Daftar riwayat trade menampilkan badge warna indikator profit (hijau) atau loss (merah).
- Statistik trading menghitung total transaksi, Win Rate, dan Total PnL secara otomatis.
- Catatan transaksi tersinkronisasi aman ke cloud Supabase.

---

**8. Mobile - Kalkulator Risiko & Lot Size**

Story:
Sebagai Trader, saya ingin menghitung ukuran lot dan rasio risk-to-reward agar risiko modal trading terkendali.

Acceptance Criteria:
- Kalkulator Lot Size menghitung lot ideal berdasarkan saldo modal, toleransi risiko, dan jarak stop loss.
- Kalkulator Risk/Reward menghitung rasio untung vs rugi dan win rate minimal yang dibutuhkan.
- Kalkulasi instan berjalan otomatis setiap kali angka input diubah.

---

**9. Mobile - Profil Member & Medali Pencapaian**

Story:
Sebagai Trader, saya ingin melihat ID Member dan medali pencapaian agar termotivasi untuk konsisten dan disiplin belajar.

Acceptance Criteria:
- Identitas profil menampilkan nama, email, role, dan ID Member resmi PFX-XXXXXXXX.
- Daftar medali pencapaian membedakan medali yang sudah terbuka vs masih terkunci.
- Streak belajar menampilkan jumlah hari belajar aktif berturut-turut.
- Tombol logout membersihkan sesi lokal di perangkat secara aman.

---

**10. Mobile - Sinkronisasi Data Cloud (Anti-Hilang Data)**

Story:
Sebagai Pengguna, saya ingin seluruh data transaksi dan progres belajar tersimpan di cloud agar data tidak hilang saat ganti perangkat.

Acceptance Criteria:
- Pencatatan data lokal bekerja instan secara offline-first tanpa delay.
- Sinkronisasi otomatis mengirimkan data ke Supabase Cloud saat perangkat terhubung internet.
- Login di HP baru langsung memulihkan seluruh riwayat jurnal, medali, dan progres belajar.
- Logout akun membersihkan data cache lokal pengguna dari perangkat.
