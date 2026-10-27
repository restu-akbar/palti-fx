-- =====================================================================
-- PALTI FX — Migrasi 003: Bucket Storage untuk Video Materi
--
-- Jalankan SETELAH 002_lesson_images_bucket.sql.
-- Aman dijalankan berulang (idempotent). Tidak menghapus data apa pun.
--
-- Isi:
--   1. Bucket publik `lesson-videos` (maks 50 MB, hanya MP4 dan WebM).
--      Batas 50 MB mengikuti batas unggah global paket gratis Supabase;
--      naikkan file_size_limit bila paket proyek mengizinkan.
--      MOV (iPhone/HEVC) sengaja tidak diizinkan karena tidak diputar di semua perangkat.
--   2. Policy storage.objects: baca publik; tulis/ubah/hapus hanya admin.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-videos',
  'lesson-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lesson_videos_read_policy on storage.objects;
create policy lesson_videos_read_policy on storage.objects for select
  using (bucket_id = 'lesson-videos');

drop policy if exists lesson_videos_admin_insert_policy on storage.objects;
create policy lesson_videos_admin_insert_policy on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-videos'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists lesson_videos_admin_update_policy on storage.objects;
create policy lesson_videos_admin_update_policy on storage.objects for update to authenticated
  using (
    bucket_id = 'lesson-videos'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  )
  with check (
    bucket_id = 'lesson-videos'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

drop policy if exists lesson_videos_admin_delete_policy on storage.objects;
create policy lesson_videos_admin_delete_policy on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-videos'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
