-- =====================================================================
-- PALTI FX — Migrasi 006: Buang kolom dan tabel yang tidak dipakai lagi
--
-- Jalankan SETELAH 005_single_invite_code.sql. Aman dijalankan berulang.
--
--   - invitations: sejak 005 hanya ada satu kode global yang dipakai ulang, jadi
--     is_used, used_at, code_hint, dan role (selalu 'member') tidak bermakna lagi.
--   - app_config: hanya berisi saklar allow_manual_signup yang tidak pernah diisi
--     (selalu false). Pendaftaran member kini selalu wajib kode undangan.
-- =====================================================================

-- 1. Fungsi yang masih menyentuh kolom lama ditulis ulang lebih dulu
create or replace function public.set_invite_code(p_code text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := public.normalize_invite_code(p_code);
  v_at   timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'Hanya administrator yang dapat mengganti kode undangan' using errcode = '42501';
  end if;
  if length(v_code) < 4 then
    raise exception 'Kode undangan minimal 4 karakter (tanpa spasi/tanda hubung)' using errcode = '22023';
  end if;

  delete from public.invitations where true;
  insert into public.invitations (code_hash, created_at)
  values (encode(sha256(convert_to(v_code, 'UTF8')), 'hex'), v_at);

  return v_at;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code     text := public.normalize_invite_code(new.raw_user_meta_data ->> 'invitation_code');
  v_hash     text := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');
  v_is_admin boolean := (lower(btrim(new.email)) = 'paltigt1@gmail.com');
begin
  -- Admin resmi (berdasarkan email) tidak memerlukan kode undangan; pendaftar lain wajib
  if not v_is_admin then
    if v_code = '' then
      raise exception 'Pendaftaran akun member hanya melalui kode undangan resmi' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.invitations i where i.code_hash = v_hash) then
      raise exception 'Kode undangan tidak valid' using errcode = 'P0001';
    end if;
  end if;

  insert into public.profiles (id, member_id, full_name, email, role, status)
  values (
    new.id,
    public.generate_member_id(),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(btrim(new.email)),
    case when v_is_admin then 'admin' else 'member' end,
    'active'
  );

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = new.id
     and email_confirmed_at is null;

  return new;
end
$$;

create or replace function public.get_admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya administrator yang dapat melihat statistik dashboard' using errcode = '42501';
  end if;

  return json_build_object(
    'total_users',   (select count(*) from public.profiles),
    'active_users',  (select count(*) from public.profiles where status = 'active'),
    'total_modules', (select count(*) from public.edu_modules),
    'total_lessons', (select count(*) from public.edu_lessons),
    'active_invites', (select count(*) from public.invitations)
  );
end
$$;

-- 2. Buang kolom dan tabel yang sudah tidak dirujuk
alter table public.invitations
  drop column if exists is_used,
  drop column if exists used_at,
  drop column if exists code_hint,
  drop column if exists role;

drop table if exists public.app_config;
