-- =====================================================================
-- PALTI FX — Skema Izin Admin Web Backoffice (RLS Invitations & User Mgmt)
-- =====================================================================
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run.
-- Memberikan hak akses penuh kepada role 'admin' untuk mengelola
-- tabel `invitations` dan memantau tabel `profiles` dari Web Admin.
-- =====================================================================

-- 1. Helper function bebas rekursi (SECURITY DEFINER membypass RLS internal pada profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 2. Berikan hak akses tabel invitations kepada user terautentikasi (dibatasi oleh RLS di bawah)
grant select, insert, update, delete on public.invitations to authenticated;

-- Kebijakan RLS: Hanya akun dengan role = 'admin' yang bisa membaca & mengelola invitations
drop policy if exists "invitations_admin_policy" on public.invitations;
create policy "invitations_admin_policy" on public.invitations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Hak akses Admin untuk melihat seluruh profil pengguna
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_select_policy" on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or public.is_admin()
  );

-- 4. Hak akses Admin untuk mengubah status pengguna (misal: suspended / active)
grant update (status) on public.profiles to authenticated;

drop policy if exists "profiles_admin_update_status" on public.profiles;
create policy "profiles_admin_update_status" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Fungsi Helper Admin: Menghitung statistik ringkas
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
