-- =====================================================================
-- PALTI FX — Skema Supabase: autentikasi berbasis undangan
--
-- Cara pakai: Supabase Dashboard → SQL Editor → New query → tempel
-- seluruh isi file ini → Run. Aman dijalankan berulang (idempotent).
--
-- Model akses:
--   * Tidak ada pendaftaran mandiri. Akun hanya bisa dibuat dengan
--     kode undangan valid (tabel `invitations`) saat signUp.
--   * `profiles` hanya bisa dibaca pemiliknya; role/status TIDAK bisa
--     diubah dari aplikasi (hanya lewat SQL Editor / service role).
--   * Status 'suspended' ditegakkan di level Auth (banned_until), bukan
--     hanya di UI.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Helper: normalisasi kode undangan (huruf besar, tanpa spasi/tanda hubung)
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
-- 2. Tabel
-- ---------------------------------------------------------------------
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

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  code_norm   text generated always as (upper(regexp_replace(code, '[\s-]', '', 'g'))) stored,
  email       text,                       -- opsional: kunci undangan ke satu email
  full_name   text,
  role        text not null default 'member' check (role in ('member', 'admin')),
  expires_at  timestamptz,
  used_at     timestamptz,
  used_by     uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint invitations_code_min_length
    check (length(regexp_replace(code, '[\s-]', '', 'g')) >= 6)
);
create unique index if not exists invitations_code_norm_key on public.invitations (code_norm);

-- Saklar untuk membuat user manual dari Dashboard (Authentication → Add user).
-- Default MATI. Lihat bagian "Operasional" di bawah.
create table if not exists public.app_config (
  key        text primary key,
  bool_value boolean not null default false
);
insert into public.app_config (key, bool_value)
values ('allow_manual_signup', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 3. Generator ID Member (acak, tidak berurutan agar sulit ditebak)
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
-- 4. Trigger: user baru di auth.users → wajib undangan valid, buat profil
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code   text := public.normalize_invite_code(new.raw_user_meta_data ->> 'invitation_code');
  v_inv    public.invitations%rowtype;
  v_manual boolean := coalesce((select c.bool_value from public.app_config c where c.key = 'allow_manual_signup'), false);
  v_role   text := 'member';
begin
  if v_code <> '' then
    select * into v_inv
      from public.invitations i
     where i.code_norm = v_code
       and i.used_at is null
       and (i.expires_at is null or i.expires_at > now())
     for update;

    if not found then
      raise exception 'Kode undangan tidak valid, sudah digunakan, atau kedaluwarsa' using errcode = 'P0001';
    end if;
    if v_inv.email is not null and lower(btrim(v_inv.email)) <> lower(btrim(new.email)) then
      raise exception 'Email tidak sesuai dengan undangan' using errcode = 'P0001';
    end if;
    v_role := v_inv.role;
  elsif not v_manual then
    raise exception 'Pendaftaran hanya melalui undangan' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, member_id, full_name, email, role, status)
  values (
    new.id,
    public.generate_member_id(),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), v_inv.full_name, split_part(new.email, '@', 1)),
    lower(btrim(new.email)),
    v_role,
    'active'
  );

  if v_inv.id is not null then
    update public.invitations set used_at = now(), used_by = new.id where id = v_inv.id;
  end if;

  -- Akun dari undangan langsung terkonfirmasi otomatis (tanpa perlu klik link email)
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

-- Sinkronkan email profil jika email akun berubah (dipakai untuk login via ID Member)
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

-- ---------------------------------------------------------------------
-- 5. Trigger profil: updated_at + tegakkan suspend di level Auth
-- ---------------------------------------------------------------------
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
-- 6. RPC untuk layar login (dipanggil sebelum user terautentikasi)
--    Sengaja sempit: hanya mengembalikan satu nilai.
-- ---------------------------------------------------------------------
-- ID Member → email, agar login "email atau ID Member" bisa bekerja.
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

-- Apakah email ini punya undangan yang belum dipakai (→ tampilkan "Akun Belum Diaktifkan")
create or replace function public.has_pending_invitation(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.invitations i
            where lower(btrim(i.email)) = lower(btrim(p_email))
              and i.used_at is null
              and (i.expires_at is null or i.expires_at > now())
         )
     and not exists (
           select 1 from public.profiles p
            where lower(p.email) = lower(btrim(p_email))
         )
$$;

-- ---------------------------------------------------------------------
-- 7. Hak akses & Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.invitations enable row level security;
alter table public.app_config  enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- invitations & app_config: tanpa policy = tidak bisa diakses dari aplikasi.
revoke all on public.invitations from anon, authenticated;
revoke all on public.app_config  from anon, authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;   -- role/status/email TIDAK bisa diubah

-- Fungsi internal tidak boleh dipanggil dari aplikasi
revoke all on function public.generate_member_id()   from public, anon, authenticated;
revoke all on function public.handle_new_user()      from public, anon, authenticated;
revoke all on function public.sync_profile_email()   from public, anon, authenticated;
revoke all on function public.sync_profile_ban()     from public, anon, authenticated;

-- RPC login: boleh dipanggil sebelum login
revoke all on function public.resolve_member_email(text)   from public, anon, authenticated;
revoke all on function public.has_pending_invitation(text) from public, anon, authenticated;
grant execute on function public.resolve_member_email(text)   to anon, authenticated;
grant execute on function public.has_pending_invitation(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Backfill: buat profil untuk user yang sudah ada sebelum skema ini
-- ---------------------------------------------------------------------
insert into public.profiles (id, member_id, full_name, email, role, status)
select u.id,
       public.generate_member_id(),
       coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
       lower(btrim(u.email)),
       'member',
       'active'
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id);

-- =====================================================================
-- OPERASIONAL (jalankan manual di SQL Editor bila diperlukan)
-- =====================================================================
-- Buat undangan untuk member baru (kode min. 6 karakter; email opsional):
--   insert into public.invitations (code, email, full_name)
--   values ('PFX-8F3K29', 'member@email.com', 'Nama Member');
--
-- Undangan dengan masa berlaku 7 hari:
--   insert into public.invitations (code, email, expires_at)
--   values ('PFX-Q7M2X9', 'member@email.com', now() + interval '7 days');
--
-- Jadikan seseorang admin:
--   update public.profiles set role = 'admin' where email = 'anda@email.com';
--
-- Suspend / aktifkan kembali (otomatis memblokir / membuka login):
--   update public.profiles set status = 'suspended' where email = 'member@email.com';
--   update public.profiles set status = 'active'    where email = 'member@email.com';
--
-- Membuat user manual lewat Dashboard (Authentication → Add user):
-- nyalakan saklar, buat user, lalu MATIKAN lagi. Selama menyala, siapa pun
-- bisa mendaftar tanpa undangan.
--   update public.app_config set bool_value = true  where key = 'allow_manual_signup';
--   update public.app_config set bool_value = false where key = 'allow_manual_signup';
