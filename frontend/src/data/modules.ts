/**
 * MODUL EDUKASI PALTI FX
 * ----------------------
 * Cara menambah/mengubah materi:
 * - Setiap modul punya daftar `lessons` (bab).
 * - Isi bab (`content`) ditulis sebagai teks biasa dengan format sederhana:
 *     ## Judul kecil
 *     - poin daftar
 *     > catatan penting / tips (tampil dalam kotak emas)
 *     baris biasa = paragraf
 * - Baris kosong memisahkan paragraf.
 *
 * Materi di bawah ini adalah CONTOH awal dan akan diganti dengan materi resmi PALTI FX.
 */

export type Lesson = {
  id: string;
  moduleId?: string;
  title: string;
  minutes: number;
  youtubeUrls?: string[];
  content: string;
  sortOrder?: number;
};

export type Module = {
  id: string;
  title: string;
  subtitle: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan';
  icon: 'school-outline' | 'shield-checkmark-outline' | 'analytics-outline' | 'bulb-outline' | 'trending-up-outline';
  lessons: Lesson[];
  sortOrder?: number;
};

export const MODULES: Module[] = [
  {
    id: 'dasar',
    title: 'Dasar-Dasar Forex',
    subtitle: 'Mengenal pasar, pair, pip, dan lot',
    level: 'Pemula',
    icon: 'school-outline',
    lessons: [
      {
        id: 'dasar-1',
        title: 'Apa Itu Forex?',
        minutes: 4,
        content: `Forex (foreign exchange) adalah pasar tempat mata uang dunia diperjualbelikan. Setiap transaksi selalu melibatkan dua mata uang sekaligus, yang disebut pair.

## Membaca sebuah pair
Contoh: EUR/USD = 1,0850
- EUR adalah mata uang dasar (base)
- USD adalah mata uang kutipan (quote)
- Artinya 1 Euro setara 1,0850 Dolar AS

## Buy dan Sell
- BUY: kita memperkirakan base akan menguat terhadap quote
- SELL: kita memperkirakan base akan melemah terhadap quote

> Di forex kita bisa mencari peluang saat harga naik maupun turun. Karena itu, disiplin dan manajemen risiko jauh lebih penting daripada menebak arah.`,
      },
      {
        id: 'dasar-2',
        title: 'Pip, Lot, dan Leverage',
        minutes: 6,
        content: `Tiga istilah ini wajib dikuasai sebelum membuka posisi pertama.

## Point dan Pip
Point adalah pergerakan harga terkecil (digit terakhir di MetaTrader). Pip adalah 10 point.
- 10 point = 1 pip, jadi 100 point = 10 pips
- Pair umum (EUR/USD, GBP/USD): 1 pip = 0,0001
- Pair JPY (USD/JPY, GBP/JPY): 1 pip = 0,01
- Emas XAU/USD: 1 pip = 0,10, harga bergerak 1,00 = 100 point = 10 pips

> Patokan PALTI FX: 100 point = 10 pips = $1 pada lot 0,01 (berlaku untuk XAUUSD dan pair xxx/USD).

## Lot
Lot adalah ukuran posisi.
- 1 lot standar = 100.000 unit mata uang
- 0,1 lot (mini) = 10.000 unit
- 0,01 lot (mikro) = 1.000 unit
Pada XAUUSD dan pair xxx/USD, 1 lot standar bernilai $10 per pip, dan 0,01 lot bernilai $0,10 per pip.

## Leverage
Leverage memungkinkan membuka posisi lebih besar dari modal. Leverage 1:500 artinya modal $100 bisa mengendalikan posisi senilai $50.000.

> Leverage memperbesar potensi untung sekaligus rugi. Gunakan kalkulator Lot Size di aplikasi ini supaya ukuran posisi selalu sesuai risiko.`,
      },
      {
        id: 'dasar-3',
        title: 'Sesi Pasar',
        minutes: 3,
        content: `Pasar forex buka 24 jam dari Senin sampai Jumat, terbagi menjadi beberapa sesi (perkiraan waktu WIB):

- Sesi Sydney: sekitar 04.00 – 13.00
- Sesi Tokyo: sekitar 07.00 – 16.00
- Sesi London: sekitar 14.00 – 23.00
- Sesi New York: sekitar 19.00 – 04.00

Jam di atas bergeser sekitar 1 jam mengikuti pergantian musim (daylight saving time) di Eropa, Amerika, dan Australia.

> Pergerakan biasanya paling aktif saat sesi London dan New York bertumpukan, yaitu malam hari WIB.`,
      },
    ],
  },
  {
    id: 'risiko',
    title: 'Manajemen Risiko',
    subtitle: 'Melindungi modal adalah prioritas utama',
    level: 'Pemula',
    icon: 'shield-checkmark-outline',
    lessons: [
      {
        id: 'risiko-1',
        title: 'Aturan Risiko 1–2%',
        minutes: 5,
        content: `Trader profesional membatasi kerugian per transaksi hanya pada sebagian kecil modal.

## Contoh
Modal $1.000 dengan risiko 1% berarti kerugian maksimal per trade adalah $10. Walaupun terjadi 5 kali loss berturut-turut, modal masih tersisa sekitar $951.

## Langkah praktis
- Tentukan stop loss berdasarkan analisa, bukan berdasarkan uang
- Hitung lot dengan kalkulator Lot Size
- Jangan memindahkan stop loss menjauh saat harga bergerak melawan posisi

> Tujuan pertama bukan cepat kaya, tapi bertahan cukup lama di pasar untuk menjadi konsisten.`,
      },
      {
        id: 'risiko-2',
        title: 'Risk : Reward',
        minutes: 4,
        content: `Risk:Reward (R:R) membandingkan potensi rugi dengan potensi untung.

## Contoh
Stop loss 20 pip dan take profit 40 pip, maka R:R = 1:2.

## Kenapa penting?
Dengan R:R 1:2, kamu tetap impas walau hanya menang sekitar 33% dari seluruh trade. Semakin besar R:R, semakin rendah win rate minimal yang dibutuhkan.

> Gunakan kalkulator Risk/Reward untuk melihat win rate minimal agar strategi tetap menguntungkan.`,
      },
    ],
  },
  {
    id: 'psikologi',
    title: 'Psikologi & Jurnal Trading',
    subtitle: 'Membangun disiplin dan evaluasi diri',
    level: 'Menengah',
    icon: 'bulb-outline',
    lessons: [
      {
        id: 'psikologi-1',
        title: 'Mengendalikan Emosi',
        minutes: 4,
        content: `Dua emosi yang paling sering merusak hasil trading adalah takut (fear) dan serakah (greed).

## Tanda-tanda trading emosional
- Membuka posisi untuk membalas kerugian (revenge trading)
- Menambah lot di luar rencana setelah menang beruntun
- Menutup posisi profit terlalu cepat karena takut

> Buat trading plan tertulis dan patuhi. Jika aturan dilanggar, berhenti trading hari itu.`,
      },
      {
        id: 'psikologi-2',
        title: 'Kenapa Harus Menulis Jurnal',
        minutes: 3,
        content: `Jurnal trading adalah cermin performa kita. Tanpa catatan, kita hanya mengandalkan ingatan yang sering bias.

## Yang perlu dicatat
- Pair, arah, lot, harga entry dan exit
- Alasan masuk (setup)
- Kondisi emosi saat entry
- Hasil dan pelajaran

Lihat statistik di menu Jurnal secara berkala: win rate, profit factor, dan kurva equity akan menunjukkan apakah strategi berjalan sesuai harapan.

> Evaluasi mingguan dari jurnal lebih berharga daripada menambah indikator baru.`,
      },
    ],
  },
];

export const findModule = (id: string) => MODULES.find((m) => m.id === id);

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
