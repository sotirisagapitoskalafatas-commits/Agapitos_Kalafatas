-- Create the client_documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client_documents', 'client_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client_documents');

CREATE POLICY "Allow reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'client_documents');

CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'client_documents');
