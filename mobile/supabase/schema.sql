-- =====================================================================
-- PALTI FX — Skema Master Supabase Terpadu & Teroptimasi
--
-- Cara pakai: Supabase Dashboard → SQL Editor → New query → tempel
-- seluruh isi file ini → Run. Aman dijalankan berulang (idempotent).
--
-- Fitur & Optimasi:
--   1. Zero Public Registration: Pendaftaran wajib menggunakan kode undangan valid.
--   2. SHA-256 Hashed Invitations: Kode undangan disimpan dalam bentuk hash (non-relational).
--   3. Achievement Lokal: Tabel `user_achievements` di-drop karena disimpan permanen di perangkat.
--   4. Materi Immutability: Modul & Bab dilindungi trigger penolak UPDATE (immutable).
--   5. RBAC & Admin Backoffice: Dukungan penuh mobile app & web admin portal terpadu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Pembersihan Objek Lama / Usang & Migrasi Skema Invitations
-- ---------------------------------------------------------------------
drop table if exists public.user_achievements cascade;
drop function if exists public.has_pending_invitation(text);

-- Otomatis migrasi/buat ulang tabel invitations jika masih format lama (tanpa kolom code_hash)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'invitations'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'invitations' and column_name = 'code_hash'
  ) then
    drop table public.invitations cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Helper: Normalisasi Kode Undangan
-- ---------------------------------------------------------------------
create or replace function public.normalize_invite_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'))
$$;

-- ---------------------------------------------------------------------
-- 2. Tabel Inti
-- ---------------------------------------------------------------------

-- Profil Pengguna
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  member_id   text not null unique,
  full_name   text,
  email       text not null,
  role        text not null default 'member' check (role in ('member', 'admin')),
  status      text not null default 'active' check (status in ('active', 'suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Kode Undangan VIP (Non-relational, SHA-256 hash)
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  code_hash   text not null unique,
  code_hint   text,                       -- Petunjuk/label untuk tampilan admin (bukan kode mentah)
  role        text not null default 'member' check (role in ('member', 'admin')),
  is_used     boolean not null default false,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Konfigurasi Internal (Saklar pembuatan akun manual)
create table if not exists public.app_config (
  key        text primary key,
  bool_value boolean not null default false
);
insert into public.app_config (key, bool_value)
values ('allow_manual_signup', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 3. Generator ID Member Unik (PFX-XXXXXXXX)
-- ---------------------------------------------------------------------
create or replace function public.generate_member_id()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_id text;
begin
  loop
    v_id := 'PFX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.profiles where member_id = v_id);
  end loop;
  return v_id;
end
$$;

-- ---------------------------------------------------------------------
-- 4. Trigger Auth: Validasi Undangan & Pembuatan Profil
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code   text := public.normalize_invite_code(new.raw_user_meta_data ->> 'invitation_code');
  v_hash   text := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');
  v_inv    public.invitations%rowtype;
  v_manual boolean := coalesce((select c.bool_value from public.app_config c where c.key = 'allow_manual_signup'), false);
  v_role   text := 'member';
begin
  if v_code <> '' then
    select * into v_inv
      from public.invitations i
     where i.code_hash = v_hash
       and i.is_used = false
     for update;

    if not found then
      raise exception 'Kode undangan tidak valid atau sudah digunakan' using errcode = 'P0001';
    end if;
    v_role := v_inv.role;
  elsif not v_manual then
    raise exception 'Pendaftaran hanya melalui undangan' using errcode = 'P0001';
  end if;

  if lower(btrim(new.email)) = 'dioraput@gmail.com' then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, member_id, full_name, email, role, status)
  values (
    new.id,
    public.generate_member_id(),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(btrim(new.email)),
    v_role,
    'active'
  );

  if v_inv.id is not null then
    update public.invitations
       set is_used = true,
           used_at = now()
     where id = v_inv.id;
  end if;

  -- Akun dari undangan langsung terkonfirmasi otomatis (tanpa verifikasi email manual)
  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = new.id
     and email_confirmed_at is null;

  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sinkronkan email profil jika email akun berubah
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(btrim(new.email)) where id = new.id;
  return new;
end
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Trigger update otomatis timestamp updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Sinkronkan ban ke Auth level saat status profil disuspend
create or replace function public.sync_profile_ban()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
     set banned_until = case when new.status = 'suspended' then now() + interval '100 years' else null end
   where id = new.id;
  return new;
end
$$;

drop trigger if exists profiles_sync_ban on public.profiles;
create trigger profiles_sync_ban
  after update of status on public.profiles
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_profile_ban();

-- ---------------------------------------------------------------------
-- 5. RPC Login (Dual Identifier: ID Member -> Email)
-- ---------------------------------------------------------------------
create or replace function public.resolve_member_email(p_member_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
    from public.profiles p
   where p.member_id = upper(btrim(p_member_id))
   limit 1
$$;

-- ---------------------------------------------------------------------
-- 6. Modul & Bab Edukasi (Immutability Constraint)
-- ---------------------------------------------------------------------
create table if not exists public.edu_modules (
  id          text primary key default ('mod-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title       text not null,
  subtitle    text not null default '',
  level       text not null default 'Pemula' check (level in ('Pemula', 'Menengah', 'Lanjutan')),
  icon        text not null default 'school-outline',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.edu_lessons (
  id            text primary key default ('les-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  module_id     text not null references public.edu_modules (id) on delete cascade,
  title         text not null,
  minutes       int not null default 5,
  youtube_urls  text[] not null default '{}',
  content       text not null default '',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
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

-- ---------------------------------------------------------------------
-- 7. Data Cloud Pengguna: Progres Bab & Jurnal Transaksi
--    (Medali/Achievement disimpan permanen di penyimpanan lokal)
-- ---------------------------------------------------------------------
create table if not exists public.user_lesson_progress (
  user_id       uuid not null references auth.users (id) on delete cascade,
  lesson_id     text not null,
  completed     boolean not null default true,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.user_trades (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        text not null,
  symbol      text not null,
  direction   text not null check (direction in ('BUY', 'SELL')),
  lot         numeric not null default 0.01,
  entry       numeric,
  exit        numeric,
  sl          numeric,
  tp          numeric,
  pl          numeric not null default 0,
  pips        numeric,
  setup       text,
  emotion     text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Row Level Security (RLS) & Hak Akses
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.invitations          enable row level security;
alter table public.app_config           enable row level security;
alter table public.edu_modules          enable row level security;
alter table public.edu_lessons          enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_trades          enable row level security;

-- PROFILES: Member baca profil sendiri, Admin bisa baca semua & update status
drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_admin_update_status on public.profiles;
create policy profiles_admin_update_status on public.profiles
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- INVITATIONS: Hanya role Admin yang bisa membaca & mengelola
drop policy if exists invitations_admin_policy on public.invitations;
create policy invitations_admin_policy on public.invitations
  for all to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- EDU: Publik / Member dapat membaca materi, Admin dapat insert & delete
drop policy if exists edu_modules_read_policy on public.edu_modules;
create policy edu_modules_read_policy on public.edu_modules for select using (true);

drop policy if exists edu_lessons_read_policy on public.edu_lessons;
create policy edu_lessons_read_policy on public.edu_lessons for select using (true);

drop policy if exists edu_modules_admin_policy on public.edu_modules;
create policy edu_modules_admin_policy on public.edu_modules for all to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists edu_lessons_admin_policy on public.edu_lessons;
create policy edu_lessons_admin_policy on public.edu_lessons for all to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- USER DATA: Hanya pemilik data yang dapat membaca & menulis
drop policy if exists user_lesson_progress_own on public.user_lesson_progress;
create policy user_lesson_progress_own on public.user_lesson_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_trades_own on public.user_trades;
create policy user_trades_own on public.user_trades
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Grants
grant select on public.profiles to authenticated;
grant update (full_name, status) on public.profiles to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
revoke all on public.app_config from anon, authenticated;

grant select on public.edu_modules to anon, authenticated;
grant all on public.edu_modules to authenticated;
grant select on public.edu_lessons to anon, authenticated;
grant all on public.edu_lessons to authenticated;

grant all on public.user_lesson_progress to authenticated;
grant all on public.user_trades to authenticated;

-- Function Execution Grants
revoke all on function public.generate_member_id() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.sync_profile_ban() from public, anon, authenticated;

revoke all on function public.resolve_member_email(text) from public, anon, authenticated;
grant execute on function public.resolve_member_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Helper Statistik Dashboard Admin
-- ---------------------------------------------------------------------
create or replace function public.get_admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_total_users int;
  v_active_users int;
  v_total_modules int;
  v_total_lessons int;
  v_active_invites int;
  v_used_invites int;
begin
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) into v_is_admin;

  if not coalesce(v_is_admin, false) then
    raise exception 'Hanya administrator yang dapat melihat statistik dashboard' using errcode = '42501';
  end if;

  select count(*) into v_total_users from public.profiles;
  select count(*) into v_active_users from public.profiles where status = 'active';
  select count(*) into v_total_modules from public.edu_modules;
  select count(*) into v_total_lessons from public.edu_lessons;
  select count(*) into v_active_invites from public.invitations where is_used = false;
  select count(*) into v_used_invites from public.invitations where is_used = true;

  return json_build_object(
    'total_users', v_total_users,
    'active_users', v_active_users,
    'total_modules', v_total_modules,
    'total_lessons', v_total_lessons,
    'active_invites', v_active_invites,
    'used_invites', v_used_invites
  );
end;
$$;

revoke all on function public.get_admin_dashboard_stats() from public, anon;
grant execute on function public.get_admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------
-- 10. Seeding Akun Testing & Undangan VIP (Hashed SHA-256)
-- ---------------------------------------------------------------------
insert into public.invitations (code_hash, code_hint, role)
values
  (encode(sha256(convert_to(public.normalize_invite_code('PFX-ADMIN-VIP'), 'UTF8')), 'hex'), 'PFX-ADMIN-VIP', 'admin'),
  (encode(sha256(convert_to(public.normalize_invite_code('PFX-MEMBER-VIP'), 'UTF8')), 'hex'), 'PFX-MEMBER-VIP', 'member')
on conflict (code_hash) do update set
  role = excluded.role,
  code_hint = excluded.code_hint;

update public.profiles set role = 'admin' where lower(email) = 'dioraput@gmail.com';
update public.profiles set role = 'member' where lower(email) = 'diorahmanputra@gmail.com';
