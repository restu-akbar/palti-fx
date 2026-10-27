-- =====================================================================
-- PALTI FX — Migrasi 002: Bucket Storage untuk Gambar Materi
--
-- Jalankan SETELAH 001_security_hardening.sql.
-- Aman dijalankan berulang (idempotent). Tidak menghapus data apa pun.
--
-- Isi:
--   1. Bucket publik `lesson-images` (maks 5 MB, hanya PNG/JPEG/WebP/GIF/AVIF).
--      SVG sengaja tidak diizinkan karena tidak dapat disanitasi.
--   2. Policy storage.objects: baca publik; tulis/ubah/hapus hanya admin.
--
-- Gambar lama yang berupa base64 di edu_lessons.content tetap valid;
-- hanya unggahan baru yang disimpan di bucket ini.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-images',
  'lesson-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lesson_images_read_policy on storage.objects;
create policy lesson_images_read_policy on storage.objects for select
  using (bucket_id = 'lesson-images');

drop policy if exists lesson_images_admin_insert_policy on storage.objects;
create policy lesson_images_admin_insert_policy on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists lesson_images_admin_update_policy on storage.objects;
create policy lesson_images_admin_update_policy on storage.objects for update to authenticated
  using (
    bucket_id = 'lesson-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    bucket_id = 'lesson-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists lesson_images_admin_delete_policy on storage.objects;
create policy lesson_images_admin_delete_policy on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
