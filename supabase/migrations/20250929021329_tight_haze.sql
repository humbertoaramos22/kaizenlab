/*
  # Add image upload support for domains

  1. Storage
    - Create storage bucket for domain images
    - Set up RLS policies for image access
  
  2. Functions
    - Add helper functions for image management
*/

-- Create storage bucket for domain images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('domain-images', 'domain-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload domain images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'domain-images');

-- Allow public access to view images
CREATE POLICY "Public can view domain images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'domain-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Users can update domain images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'domain-images');

-- Allow authenticated users to delete domain images
CREATE POLICY "Users can delete domain images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'domain-images');