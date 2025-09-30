/*
  # User and Domain Management System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `role` (text, either 'admin' or 'user')
      - `created_at` (timestamp)
      - `last_login` (timestamp, nullable)
    - `domains`
      - `id` (uuid, primary key)
      - `original_domain` (text, the actual domain URL)
      - `masked_name` (text, the friendly name shown to users)
      - `created_at` (timestamp)
      - `created_by` (uuid, references user_profiles)
    - `user_domains`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `domain_id` (uuid, references domains)
      - `assigned_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for admins to manage all data

  3. Demo Data
    - Create demo admin user (admin@example.com)
    - Create demo regular user (user@example.com)
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_domain text NOT NULL,
  masked_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Create user_domains junction table
CREATE TABLE IF NOT EXISTS user_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, domain_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policies for domains
CREATE POLICY "Admins can manage domains"
  ON domains
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read assigned domains"
  ON domains
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_domains
      WHERE domain_id = domains.id AND user_id = auth.uid()
    )
  );

-- Policies for user_domains
CREATE POLICY "Admins can manage user domain assignments"
  ON user_domains
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read own domain assignments"
  ON user_domains
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_domains_created_by ON domains(created_by);
CREATE INDEX IF NOT EXISTS idx_user_domains_user_id ON user_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_domain_id ON user_domains(domain_id);

-- Insert demo users (these will be created in auth.users by the application)
-- The application will handle user creation through Supabase Auth
-- This is just a placeholder to show the expected structure