-- 2026-11-05 — enforce private client-upload size and MIME restrictions.
-- Applied to the active Supabase project as migration storage_upload_limits_20261105.
-- Safe to re-run; does not touch stored objects or existing CRM records.

UPDATE storage.buckets
SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
WHERE id IN ('client_documents', 'client_uploads');
