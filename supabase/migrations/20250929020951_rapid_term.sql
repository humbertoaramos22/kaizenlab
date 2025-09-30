/*
  # Add image support to domains

  1. Changes
    - Add `image_url` column to domains table to store image URLs
    - Add `image_alt` column for accessibility
    - Update existing domains to have null image values initially

  2. Security
    - No additional RLS changes needed as existing policies cover new columns
*/

-- Add image columns to domains table
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS image_alt text DEFAULT '';

-- Add index for better performance when filtering by image presence
CREATE INDEX IF NOT EXISTS idx_domains_image_url ON domains(image_url) WHERE image_url IS NOT NULL;