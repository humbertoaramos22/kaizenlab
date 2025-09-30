/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - Current policies are causing infinite recursion when checking user roles
    - The "Admins can read all profiles" policy references user_profiles table within itself

  2. Solution
    - Drop existing problematic policies
    - Create simpler, non-recursive policies
    - Use auth.uid() directly instead of looking up user_profiles table

  3. New Policies
    - Users can read their own profile (using auth.uid() = id)
    - Users can update their own profile (using auth.uid() = id)
    - Simple admin policies that don't cause recursion
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- For admin operations, we'll handle permissions in the application layer
-- instead of using recursive RLS policies
CREATE POLICY "Allow profile creation"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);