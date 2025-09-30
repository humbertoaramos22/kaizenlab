/*
  # Fix admin user creation permissions

  1. Security Updates
    - Add policy for admins to create user profiles
    - Allow admins to insert profiles for new users
    - Maintain existing security for regular users

  2. Changes
    - Add "Admins can create user profiles" policy
    - This allows admins to insert user_profiles records during user creation
*/

-- Add policy for admins to create user profiles for new users
CREATE POLICY "Admins can create user profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Also add policy for admins to read all user profiles (needed for user management)
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );