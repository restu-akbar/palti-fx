-- =====================================================================
-- PALTI FX — Skema Modul & Bab Edukasi (CRUD & YouTube Multi-Video)
-- =====================================================================

-- 1. Tabel Modul Edukasi
create table if not exists public.edu_modules (
  id          text primary key default ('mod-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title       text not null,
  subtitle    text not null default '',
  level       text not null default 'Pemula' check (level in ('Pemula', 'Menengah', 'Lanjutan')),
  icon        text not null default 'school-outline',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Tabel Bab / Lesson Edukasi
create table if not exists public.edu_lessons (
  id            text primary key default ('les-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  module_id     text not null references public.edu_modules (id) on delete cascade,
  title         text not null,
  minutes       int not null default 5,
  youtube_urls  text[] not null default '{}',
  content       text not null default '',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Constraint: materi edukasi bersifat permanen & tidak dapat diedit (immutable)
create or replace function public.prevent_edu_modification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Materi edukasi bersifat permanen dan tidak dapat diubah (immutable).' using errcode = 'P0001';
end;
$$;

drop trigger if exists trg_prevent_update_modules on public.edu_modules;
create trigger trg_prevent_update_modules
  before update on public.edu_modules
  for each row execute function public.prevent_edu_modification();

drop trigger if exists trg_prevent_update_lessons on public.edu_lessons;
create trigger trg_prevent_update_lessons
  before update on public.edu_lessons
  for each row execute function public.prevent_edu_modification();

-- 3. Row Level Security (RLS)
alter table public.edu_modules enable row level security;
alter table public.edu_lessons enable row level security;

-- Kebijakan Baca: Pengguna terautentikasi (member & admin) dan publik/anon boleh membaca
drop policy if exists "edu_modules_read_policy" on public.edu_modules;
create policy "edu_modules_read_policy"
  on public.edu_modules for select
  using (true);

drop policy if exists "edu_lessons_read_policy" on public.edu_lessons;
create policy "edu_lessons_read_policy"
  on public.edu_lessons for select
  using (true);

-- Kebijakan Tulis: Hanya role = 'admin' yang bisa insert/update/delete
drop policy if exists "edu_modules_admin_policy" on public.edu_modules;
create policy "edu_modules_admin_policy"
  on public.edu_modules for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "edu_lessons_admin_policy" on public.edu_lessons;
create policy "edu_lessons_admin_policy"
  on public.edu_lessons for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

grant select on public.edu_modules to anon, authenticated;
grant all on public.edu_modules to authenticated;
grant select on public.edu_lessons to anon, authenticated;
grant all on public.edu_lessons to authenticated;

-- 4. Seeding Data Bawaan dari modules.ts
insert into public.edu_modules (id, title, subtitle, level, icon, sort_order)
values
  ('dasar', 'Dasar-Dasar Forex', 'Mengenal pasar, pair, pip, dan lot', 'Pemula', 'school-outline', 1),
  ('risiko', 'Manajemen Risiko', 'Melindungi modal adalah prioritas utama', 'Pemula', 'shield-checkmark-outline', 2),
  ('psikologi', 'Psikologi & Jurnal Trading', 'Membangun disiplin dan evaluasi diri', 'Menengah', 'bulb-outline', 3)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  level = excluded.level,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

insert into public.edu_lessons (id, module_id, title, minutes, youtube_urls, content, sort_order)
values
  (
    'dasar-1',
    'dasar',
    'Apa Itu Forex?',
    4,
    '{}',
    'Forex (foreign exchange) adalah pasar tempat mata uang dunia diperjualbelikan. Setiap transaksi selalu melibatkan dua mata uang sekaligus, yang disebut pair.

## Membaca sebuah pair
Contoh: EUR/USD = 1,0850
- EUR adalah mata uang dasar (base)
- USD adalah mata uang kutipan (quote)
- Artinya 1 Euro setara 1,0850 Dolar AS

## Buy dan Sell
- BUY: kita memperkirakan base akan menguat terhadap quote
- SELL: kita memperkirakan base akan melemah terhadap quote

> Di forex kita bisa mencari peluang saat harga naik maupun turun. Karena itu, disiplin dan manajemen risiko jauh lebih penting daripada menebak arah.',
    1
  ),
  (
    'dasar-2',
    'dasar',
    'Pip, Lot, dan Leverage',
    6,
    '{}',
    'Tiga istilah ini wajib dikuasai sebelum membuka posisi pertama.

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

> Leverage memperbesar potensi untung sekaligus rugi. Gunakan kalkulator Lot Size di aplikasi ini supaya ukuran posisi selalu sesuai risiko.',
    2
  ),
  (
    'dasar-3',
    'dasar',
    'Sesi Pasar',
    3,
    '{}',
    'Pasar forex buka 24 jam dari Senin sampai Jumat, terbagi menjadi beberapa sesi (perkiraan waktu WIB):

- Sesi Sydney: sekitar 04.00 – 13.00
- Sesi Tokyo: sekitar 07.00 – 16.00
- Sesi London: sekitar 14.00 – 23.00
- Sesi New York: sekitar 19.00 – 04.00

Jam di atas bergeser sekitar 1 jam mengikuti pergantian musim (daylight saving time) di Eropa, Amerika, dan Australia.

> Pergerakan biasanya paling aktif saat sesi London dan New York bertumpukan, yaitu malam hari WIB.',
    3
  ),
  (
    'risiko-1',
    'risiko',
    'Aturan Risiko 1–2%',
    5,
    '{}',
    'Trader profesional membatasi kerugian per transaksi hanya pada sebagian kecil modal.

## Contoh
Modal $1.000 dengan risiko 1% berarti kerugian maksimal per trade adalah $10. Walaupun terjadi 5 kali loss berturut-turut, modal masih tersisa sekitar $951.

## Langkah praktis
- Tentukan stop loss berdasarkan analisa, bukan berdasarkan uang
- Hitung lot dengan kalkulator Lot Size
- Jangan memindahkan stop loss menjauh saat harga bergerak melawan posisi

> Tujuan pertama bukan cepat kaya, tapi bertahan cukup lama di pasar untuk menjadi konsisten.',
    1
  ),
  (
    'risiko-2',
    'risiko',
    'Risk : Reward',
    4,
    '{}',
    'Risk:Reward (R:R) membandingkan potensi rugi dengan potensi untung.

## Contoh
Stop loss 20 pip dan take profit 40 pip, maka R:R = 1:2.

## Kenapa penting?
Dengan R:R 1:2, kamu tetap impas walau hanya menang sekitar 33% dari seluruh trade. Semakin besar R:R, semakin rendah win rate minimal yang dibutuhkan.

> Gunakan kalkulator Risk/Reward untuk melihat win rate minimal agar strategi tetap menguntungkan.',
    2
  ),
  (
    'psikologi-1',
    'psikologi',
    'Mengendalikan Emosi',
    4,
    '{}',
    'Dua emosi yang paling sering merusak hasil trading adalah takut (fear) dan serakah (greed).

## Tanda-tanda trading emosional
- Membuka posisi untuk membalas kerugian (revenge trading)
- Menambah lot di luar rencana setelah menang beruntun
- Menutup posisi profit terlalu cepat karena takut

> Buat trading plan tertulis dan patuhi. Jika aturan dilanggar, berhenti trading hari itu.',
    1
  ),
  (
    'psikologi-2',
    'psikologi',
    'Kenapa Harus Menulis Jurnal',
    3,
    '{}',
    'Jurnal trading adalah cermin performa kita. Tanpa catatan, kita hanya mengandalkan ingatan yang sering bias.

## Yang perlu dicatat
- Pair, arah, lot, harga entry dan exit
- Alasan masuk (setup)
- Kondisi emosi saat entry
- Hasil dan pelajaran

Lihat statistik di menu Jurnal secara berkala: win rate, profit factor, dan kurva equity akan menunjukkan apakah strategi berjalan sesuai harapan.

> Evaluasi mingguan dari jurnal lebih berharga daripada menambah indikator baru.',
    2
  )
on conflict (id) do update set
  title = excluded.title,
  minutes = excluded.minutes,
  content = excluded.content,
  sort_order = excluded.sort_order;

-- 5. Penugasan Role Akun Testing & Undangan VIP
-- Catatan: Admin tidak memerlukan kode undangan. Kode undangan hanya untuk Member.
insert into public.invitations (code, email, full_name, role)
values
  ('PFX-MEMBER-VIP', 'diorahmanputra@gmail.com', 'Diora Rahman (Member)', 'member')
on conflict (code_norm) do update set
  role = excluded.role,
  email = excluded.email;

update public.profiles
   set role = 'admin'
 where lower(email) = 'dioraput@gmail.com';

update public.profiles
   set role = 'member'
 where lower(email) = 'diorahmanputra@gmail.com';
