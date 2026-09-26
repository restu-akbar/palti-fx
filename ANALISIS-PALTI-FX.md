## 1. Current App Flow

Saat aplikasi dibuka, user langsung masuk ke **Beranda** (tanpa login, tanpa splash login). Ada 4 tab bawah: **Beranda – Edukasi – Kalkulator – Jurnal**.

**Beranda (yang dilihat user):**
- Logo PALTI FX + tanggal, sapaan otomatis ("Selamat pagi/siang/sore/malam") + tanggal lengkap.
- Kartu emas **progres belajar** (lingkaran %, "x/7 materi · 3 modul", materi berikutnya). Ditekan → langsung lompat ke materi yang belum selesai.
- **Kalkulator** horizontal (6 shortcut: Lot Size, Risk Reward, Nilai Pip, Margin, Profit Loss, Compound). Ditekan → langsung ke kalkulator tersebut.
- **Pasar Hari Ini**: jam WIB live (update tiap 30 detik), status (mis. "Buka: London & New York", "Overlap paling ramai", atau "Pasar tutup · akhir pekan"), dan diagram 4 sesi (Sydney, Tokyo, London, New York) dengan jam WIB + garis penanda "sekarang".
- **Performa Kamu**: ringkasan jurnal (net profit/loss, win rate, mini grafik equity, total/menang/kalah). Kalau belum ada data → ajakan "Mulai catat trade".
- **Modul Belajar** horizontal (3 kartu modul + progres per modul). Ditekan → ke modul.
- **Prinsip Hari Ini** (tips rotasi dari 7 tips, ganti tiap tanggal) + disclaimer "untuk edukasi, bukan saran investasi".

**Flow Beranda → Edukasi:**
Beranda (hero / kartu modul) → Daftar Edukasi (progres total + 3 modul) → Detail Modul (daftar bab gaya timeline, ada penanda "Lanjutkan di sini") → Halaman Materi (teks + tombol bawah).

**Membaca materi & progres:**
Materi = teks biasa (judul, bullet, kotak tips emas). Tidak ada gambar/video/kuis. Di bawah materi ada tombol **"Selesai & lanjut"** (otomatis menandai bab itu selesai lalu buka bab berikutnya) atau **"Tandai modul selesai"** di bab terakhir. Bisa juga **"Tandai belum selesai"** untuk membatalkan. Progres = jumlah bab yang ditandai selesai / total bab. Bisa lompat bebas, tidak harus urut.

**Flow kalkulator:**
Daftar Kalkulator (ada strip pengingat "100 point = 10 pips = $1 lot 0,01") → pilih 1 dari 6 alat → pilih instrumen (XAUUSD, EURUSD, dst.) → isi angka manual → hasil besar muncul otomatis di kartu emas. Tidak ada harga real-time; untuk pair tertentu user harus ketik harga konversi manual (mis. harga USDJPY saat ini).

**Flow jurnal:**
Tab Jurnal → ringkasan (net P/L + grafik equity + 8 kotak statistik) + filter (Semua / Bulan ini / 7 hari) + daftar riwayat → tombol **+ / "Tambah trade"** → form → simpan → kembali ke daftar. Tekan satu riwayat → form edit + tombol hapus.

Isi form: Tanggal, Pair, BUY/SELL, Lot, Entry, Exit, SL, TP, Hasil P/L (USD), Setup/strategi (teks bebas), Emosi (6 pilihan chip), Catatan. Yang **wajib hanya: tanggal, lot, dan hasil P/L**. P/L bisa dikosongkan jika entry+exit+lot diisi (aplikasi membuat perkiraan otomatis), atau diisi sesuai angka broker.

**Statistik dari jurnal:**
Semua dihitung dari kolom P/L yang dicatat: win rate, profit factor, rata-rata win/loss, best/worst trade, net profit, dan kurva equity (penjumlahan P/L berurutan dari tanggal paling lama). Trade impas (P/L = 0) dihitung di total tapi bukan menang/kalah. Filter periode hanya mengubah tampilan, tidak menghapus data.

**Keterhubungan:**
- Beranda membaca data edukasi (progres) dan jurnal (statistik) lalu menjadi jalan pintas ke keduanya.
- Pengaturan (simbol terakhir, modal, risiko %, leverage) diingat dan dipakai ulang antar kalkulator + default jurnal.
- Rumus P/L yang sama dipakai di kalkulator Profit/Loss dan untuk perkiraan otomatis di form jurnal.
- Teks materi saling merujuk ("gunakan kalkulator Lot Size", "lihat statistik di menu Jurnal").

## 2. Deskripsi Klien vs Implementasi

| Area | Dari Deskripsi Klien | Yang Ditemukan di App | Status |
|---|---|---|---|
| Beranda | Sapaan, progress belajar, shortcut kalkulator, widget 4 sesi dalam WIB, ringkasan jurnal, tips harian | Semua ada. Plus: kartu modul belajar, tanggal, disclaimer risiko, status overlap & akhir pekan, jam live | Sesuai (ada tambahan kecil) |
| Edukasi | Modul + bab, progress tersimpan, materi masih contoh, diganti resmi | 3 modul, 7 bab contoh. Progres = bab ditandai manual via tombol. Format teks sederhana saja (judul, bullet, kotak tips). Level baru ada Pemula & Menengah | Sesuai, **Perlu Klarifikasi** (cara hitung progres & format materi final) |
| Kalkulator | 6 alat + patokan 100 point = 10 pips = $1 lot 0,01 XAUUSD & xxx/USD, ada test | 6 alat ada + test (`tests/calc.test.ts`). Lot dibulatkan ke bawah 0,01. Untuk pair cross user input harga konversi manual. Hasil P/L di luar spread/komisi/swap | Sesuai, **Perlu Klarifikasi** (input manual & batas patokan) |
| Jurnal | Catat/edit/hapus, win rate, profit factor, rata-rata win/loss, grafik equity | Semua ada. Plus: filter Semua/Bulan ini/7 hari, best/worst trade, emosi, setup, SL/TP, catatan, perkiraan P/L otomatis. Wajib hanya tanggal+lot+P/L | Sesuai (lebih lengkap dari brief) |
| Data Offline | Semua di HP, tanpa login/backend/realtime, gratis, tema hitam-emas | Benar: hanya AsyncStorage (3 kunci: trades, completed, settings). Tanpa login, tanpa internet, tanpa harga realtime. Tema hitam-emas | Sesuai, **Perlu Klarifikasi** (risiko data hilang ganti HP) |

## 3. Gap / Hal yang Belum Jelas

1. **Progres belajar** dihitung dari tombol "Selesai" yang ditekan manual, bukan dari benar-benar dibaca sampai habis. User bisa lompat bab dan bisa menandai selesai/belum selesai kapan saja.
2. **Materi resmi**: format saat ini hanya teks (tanpa gambar, video, tabel, kuis, link). Belum jelas jumlah modul/bab final, level (baru Pemula+Menengah), dan siapa/cara mengisinya.
3. **Jurnal**: hanya tanggal, lot, P/L yang wajib. Entry/exit/SL/TP/setup/emosi/catatan opsional. Win rate = menang / total trade (trade impas menurunkan win rate). Profit factor tampil "∞" jika belum pernah rugi. Equity = jumlah P/L kumulatif, bukan dari modal awal.
4. **Sesi pasar**: jam statis perkiraan (Sydney ±04.00–13.00, Tokyo ±07.00–16.00, London ±14.00–23.00, New York ±19.00–04.00 WIB), bisa geser ±1 jam saat daylight saving. Akhir pekan dianggap tutup (Jumat 21.00 UTC – Minggu 21.00 UTC). Tanpa harga real-time.
5. **Kalkulator**: strip "100 point = 10 pips = $1" tampil umum, padahal hanya berlaku XAUUSD & pair xxx/USD. Pair seperti USDJPY / EURGBP / EURJPY mewajibkan user ketik harga tambahan manual. Lot selalu dibulatkan ke bawah ke 0,01 (ada peringatan akun cent jika terlalu kecil). P/L kalkulator belum termasuk spread/komisi/swap.
6. **Data offline**: tidak ada backup, export, atau pindah HP. Hapus aplikasi / ganti HP = data hilang. Tidak ada fitur hapus semua / reset progres sekaligus.
7. **Fitur di app yang tidak disebut di brief**: tips harian rotasi, sapaan waktu, filter jurnal, kolom emosi/setup/catatan/SL/TP di jurnal, perkiraan P/L otomatis, win rate minimal impas (breakeven) di Risk/Reward, pilihan leverage custom, simulasi compounding harian/mingguan/bulanan + tambahan modal, status overlap London–New York, disclaimer edukasi.

## 4. Pertanyaan untuk Klien

1. Progres belajar cukup dihitung dari tombol "Selesai" yang ditekan user, atau harus dari syarat lain (mis. harus urut, harus baca sampai bawah, ada kuis)?
2. Materi resmi nanti totalnya berapa modul dan berapa bab? Apakah cukup teks + bullet + kotak tips seperti sekarang, atau butuh gambar, video, atau kuis?
3. Untuk jurnal, kolom apa saja yang wajib diisi menurut klien? Apakah tanggal + lot + hasil saja sudah cukup, atau entry/exit/setup/emosi harus wajib?
4. Perhitungan win rate saat ini: menang dibagi total trade (jadi trade impas menurunkan win rate). Apakah ini sudah sesuai harapan?
5. Grafik equity saat ini dimulai dari 0 dan naik/turun dari jumlah hasil trade. Apakah perlu dimulai dari modal awal user?
6. Jam sesi pasar yang sekarang (Sydney, Tokyo, London, New York dalam WIB + keterangan bisa geser 1 jam + tutup akhir pekan) apakah sudah benar? Apa yang harus tampil saat pasar tutup?
7. Patokan "100 point = 10 pips = $1 pada lot 0,01" apakah benar hanya untuk XAUUSD dan pair xxx/USD? Bagaimana menjelaskannya agar user pair lain tidak bingung?
8. Untuk pair seperti USDJPY atau EURGBP, user harus ketik harga tambahan manual karena tidak ada harga otomatis. Apakah ini bisa diterima, atau perlu panduan khusus?
9. Hasil kalkulator Profit/Loss belum termasuk spread, komisi, dan swap broker. Apakah perlu ditambah kolom biaya, atau cukup catatan seperti sekarang?
10. Jika user ganti HP atau hapus aplikasi, semua jurnal dan progres hilang karena tersimpan di HP saja. Apakah perlu fitur salin/backup data (mis. export file), atau tetap tanpa itu?
11. Tips harian, kolom emosi, filter "Bulan ini / 7 hari", dan simulasi compounding — apakah semuanya ingin dipertahankan, atau ada yang ingin dibuang?
