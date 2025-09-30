/*
  # Add user blocking functionality

  1. Changes
    - Add `is_blocked` column to `user_profiles` table
    - Set default value to false for existing users
    - Add index for efficient blocked status queries

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add is_blocked column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_blocked boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for efficient blocked status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_blocked ON user_profiles(is_blocked);