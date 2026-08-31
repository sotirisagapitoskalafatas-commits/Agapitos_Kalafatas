-- Create the client_documents storage bucket
-- Bucket is PRIVATE: client documents may contain sensitive files and must not
-- be readable, uploadable, or deletable by the anon key. All access flows
-- through the authenticated /api/documents endpoint using the service role.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client_documents', 'client_documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Service role only: uploads, reads, and deletes are blocked for anon.
CREATE POLICY "Service role upload documents" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'client_documents');

CREATE POLICY "Service role read documents" ON storage.objects
  FOR SELECT TO service_role
  USING (bucket_id = 'client_documents');

CREATE POLICY "Service role delete documents" ON storage.objects
  FOR DELETE TO service_role
  USING (bucket_id = 'client_documents');
