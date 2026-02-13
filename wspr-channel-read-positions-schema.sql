-- WSPR Channel Read Positions Schema
-- Tracks each user's last-read position per channel for unread indicators
-- Run this in Supabase SQL Editor

-- Create read positions table
CREATE TABLE IF NOT EXISTS wspr_channel_read_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES wspr_channels(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_channel_read_user_channel 
  ON wspr_channel_read_positions(user_id, channel_id);

-- Enable RLS
ALTER TABLE wspr_channel_read_positions ENABLE ROW LEVEL SECURITY;

-- Users can view their own read positions
CREATE POLICY "Users can view own read positions"
ON wspr_channel_read_positions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own read positions
CREATE POLICY "Users can insert own read positions"
ON wspr_channel_read_positions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own read positions
CREATE POLICY "Users can update own read positions"
ON wspr_channel_read_positions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RPC function to get unread counts for all channels in a workspace
CREATE OR REPLACE FUNCTION get_channel_unread_counts(
  p_user_id UUID,
  p_workspace_id UUID
)
RETURNS TABLE (
  channel_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS channel_id,
    COUNT(m.id)::BIGINT AS unread_count
  FROM wspr_channels c
  LEFT JOIN wspr_channel_read_positions rp 
    ON rp.channel_id = c.id AND rp.user_id = p_user_id
  LEFT JOIN wspr_messages m 
    ON m.channel_id = c.id 
    AND m.created_at > COALESCE(rp.last_read_at, '1970-01-01'::timestamptz)
    AND m.user_id != p_user_id  -- Don't count own messages as unread
  WHERE c.workspace_id = p_workspace_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to mark a channel as read (upsert read position)
CREATE OR REPLACE FUNCTION mark_channel_read(
  p_user_id UUID,
  p_channel_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO wspr_channel_read_positions (user_id, channel_id, last_read_at)
  VALUES (p_user_id, p_channel_id, NOW())
  ON CONFLICT (user_id, channel_id)
  DO UPDATE SET last_read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
