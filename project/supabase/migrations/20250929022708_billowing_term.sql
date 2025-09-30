/*
  # Add session management for single login enforcement

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `session_token` (text, unique)
      - `created_at` (timestamp)
      - `last_activity` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for users to manage their own sessions
    - Add policy for service role to manage all sessions

  3. Indexes
    - Index on user_id for fast lookups
    - Index on session_token for authentication
    - Index on is_active for active session queries
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- RLS Policies
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate sessions older than 24 hours with no activity
  UPDATE user_sessions 
  SET is_active = false 
  WHERE last_activity < now() - interval '24 hours' 
    AND is_active = true;
    
  -- Delete inactive sessions older than 7 days
  DELETE FROM user_sessions 
  WHERE is_active = false 
    AND created_at < now() - interval '7 days';
END;
$$;