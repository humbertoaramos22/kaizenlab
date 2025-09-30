/*
  # Fix permission denied errors with simpler RLS policies

  1. Security
    - Drop all existing policies that cause permission issues
    - Create simple policies that don't reference auth.users table
    - Use hardcoded admin email check that works with available session data
    - Allow users to manage their own profiles
    - Allow admin user to manage all profiles

  2. Changes
    - Remove policies that reference auth.users table
    - Use auth.email() function instead of querying auth.users
    - Maintain security while fixing permission errors
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create simple, working policies
CREATE POLICY "Allow admin full access"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

CREATE POLICY "Allow users to read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full access for admin operations
CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);