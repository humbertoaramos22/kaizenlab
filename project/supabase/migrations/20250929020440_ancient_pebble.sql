/*
  # Fix infinite recursion in RLS policies

  1. Security Changes
    - Drop all existing policies that cause recursion
    - Create simple, non-recursive policies
    - Use auth.uid() directly instead of querying user_profiles table
    - Separate admin access from regular user access

  2. Policy Structure
    - Users can manage their own profiles
    - Service role has full access (for admin operations)
    - No recursive queries within policies
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins have full access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (this is used by admin functions)
CREATE POLICY "Service role has full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);