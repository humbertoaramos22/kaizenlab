/*
  # Fix Admin Block/Unblock Policies

  1. Security Updates
    - Drop existing restrictive policies
    - Create comprehensive admin policies for all operations
    - Ensure admins can block/unblock users
    - Maintain user self-access policies

  2. Policy Changes
    - Allow admins full CRUD access to user_profiles
    - Allow users to read/update their own profiles (except admin-only fields)
    - Ensure is_blocked column can be updated by admins
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow profile creation for admins" ON user_profiles;
DROP POLICY IF EXISTS "Allow reading all profiles for admins" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create comprehensive admin policy for all operations
CREATE POLICY "Admins have full access to user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile (but not role or is_blocked)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND is_blocked = (SELECT is_blocked FROM user_profiles WHERE id = auth.uid())
  );

-- Allow users to create their own profile during signup
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);