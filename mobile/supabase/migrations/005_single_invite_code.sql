-- =====================================================================
-- PALTI FX — Migrasi 005: Satu Kode Undangan Global
--
-- Kode undangan kini hanya SATU untuk semua calon member:
--   - Bisa dipakai berkali-kali (tidak lagi ditandai "sudah dipakai").
--   - Admin menggantinya lewat RPC set_invite_code(); kode lama langsung ditimpa.
--   - Tetap disimpan sebagai hash SHA-256 (kode mentah tidak pernah disimpan).
--
-- Jalankan SETELAH 001_security_hardening.sql. Aman dijalankan berulang.
-- =====================================================================

-- 1. Sisakan hanya kode terbaru yang masih aktif, lalu kunci tabel jadi satu baris
do $$
begin
  -- Kolom is_used dibuang di migrasi 006; langkah ini hanya relevan untuk skema lama.
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'invitations' and column_name = 'is_used') then
    delete from public.invitations
     where id is distinct from (
       select id from public.invitations where is_used = false order by created_at desc limit 1
     );
    update public.invitations set is_used = false, used_at = null;
  else
    delete from public.invitations
     where id is distinct from (select id from public.invitations order by created_at desc limit 1);
  end if;
end
$$;

create unique index if not exists invitations_singleton on public.invitations ((true));

-- 2. Admin mengganti kode (menimpa kode sebelumnya secara atomik)
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

revoke all on function public.set_invite_code(text) from public, anon;
grant execute on function public.set_invite_code(text) to authenticated;

-- 3. Pendaftaran: cocokkan dengan kode global, tanpa menandai kode sebagai terpakai
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code     text := public.normalize_invite_code(new.raw_user_meta_data ->> 'invitation_code');
  v_hash     text := encode(sha256(convert_to(v_code, 'UTF8')), 'hex');
  v_manual   boolean := coalesce((select c.bool_value from public.app_config c where c.key = 'allow_manual_signup'), false);
  v_is_admin boolean := (lower(btrim(new.email)) = 'paltigt1@gmail.com');
  v_role     text := case when v_is_admin then 'admin' else 'member' end;
begin
  -- Admin resmi (berdasarkan email) tidak memerlukan kode undangan; pendaftar lain wajib
  if not v_is_admin then
    if v_code <> '' then
      if not exists (select 1 from public.invitations i where i.code_hash = v_hash) then
        raise exception 'Kode undangan tidak valid' using errcode = 'P0001';
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

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = new.id
     and email_confirmed_at is null;

  return new;
end
$$;
