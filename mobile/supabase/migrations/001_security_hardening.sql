-- =====================================================================
-- PALTI FX — Migrasi 001: Penguatan Keamanan & Penyelarasan Skema
--
-- Jalankan SETELAH schema.sql, admin_web_schema.sql, dan user_data_schema.sql.
-- Aman dijalankan berulang (idempotent). Tidak menghapus data apa pun.
--
-- Isi:
--   1. Pendaftaran admin tidak lagi bisa dipicu lewat metadata klien
--      (raw_user_meta_data ->> 'role'). Jalur email admin resmi tetap berlaku.
--   2. Member tidak dapat mengubah role, status, email, atau member_id miliknya
--      sendiri (mencegah naik jadi admin dan mengaktifkan diri setelah disuspend).
--   3. Kolom updated_at pada edu_modules & edu_lessons yang dipakai aplikasi.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. handle_new_user: hentikan kepercayaan pada metadata role dari klien
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code     text := public.normalize_invite_code(new.raw_user_meta_data ->> 'invitation_code');
  v_hash     text := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');
  v_inv      public.invitations%rowtype;
  v_manual   boolean := coalesce((select c.bool_value from public.app_config c where c.key = 'allow_manual_signup'), false);
  v_is_admin boolean := (lower(btrim(new.email)) = 'dioraput@gmail.com');
  v_role     text := case when v_is_admin then 'admin' else 'member' end;
begin
  -- Admin resmi (berdasarkan email) tidak memerlukan kode undangan; pendaftar lain wajib
  if not v_is_admin then
    if v_code <> '' then
      select * into v_inv
        from public.invitations i
       where i.code_hash = v_hash
         and i.is_used = false
       for update;

      if not found then
        raise exception 'Kode undangan tidak valid atau sudah digunakan' using errcode = 'P0001';
      end if;
      v_role := 'member';
    elsif not v_manual then
      raise exception 'Pendaftaran akun member hanya melalui kode undangan resmi' using errcode = 'P0001';
    end if;
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

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = new.id
     and email_confirmed_at is null;

  return new;
end
$$;

-- ---------------------------------------------------------------------
-- 2. Penjaga kolom sensitif profil untuk non-admin
--    Berlaku hanya bagi permintaan klien (auth.uid() terisi). Proses internal
--    (trigger SECURITY DEFINER, GoTrue, service_role) tidak terpengaruh.
-- ---------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id        is distinct from old.id
       or new.role      is distinct from old.role
       or new.status    is distinct from old.status
       or new.email     is distinct from old.email
       or new.member_id is distinct from old.member_id then
      raise exception 'Anda tidak memiliki izin mengubah kolom ini' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

revoke all on function public.guard_profile_update() from public, anon, authenticated;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------
-- 3. Kolom updated_at pada materi edukasi (dipakai mobile & web admin)
-- ---------------------------------------------------------------------
alter table public.edu_modules add column if not exists updated_at timestamptz not null default now();
alter table public.edu_lessons add column if not exists updated_at timestamptz not null default now();
