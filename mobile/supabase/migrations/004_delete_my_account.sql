-- =====================================================================
-- PALTI FX — Migrasi 004: Hapus akun oleh pengguna sendiri
--
-- Jalankan SETELAH migrasi 001-003. Idempotent. Tidak mengubah data yang ada.
--
-- Pengguna terautentikasi dapat menghapus akunnya sendiri. Menghapus baris
-- auth.users memicu ON DELETE CASCADE ke profiles, user_trades, dan
-- user_lesson_progress, sehingga semua data pribadi ikut terhapus.
--
-- Akun ADMIN sengaja ditolak: handle_new_user memberi role admin + konfirmasi
-- email otomatis kepada siapa pun yang mendaftar dengan email admin resmi.
-- Jika akun admin dihapus, email itu dapat direbut orang lain.
-- =====================================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then
    raise exception 'Tidak terautentikasi' using errcode = '28000';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role = 'admin' then
    raise exception 'Akun admin tidak dapat dihapus dari aplikasi' using errcode = '42501';
  end if;

  delete from auth.users where id = v_uid;
end
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
