-- WSPR Direct Messages Schema
-- Run this in Supabase SQL Editor

-- Create direct messages table
CREATE TABLE IF NOT EXISTS wspr_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_sender ON wspr_direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON wspr_direct_messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON wspr_direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON wspr_direct_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE wspr_direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view messages they sent or received
CREATE POLICY "Users can view their DMs"
ON wspr_direct_messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Users can send DMs to their contacts
CREATE POLICY "Users can send DMs to contacts"
ON wspr_direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM wspr_contacts
    WHERE (user_id = auth.uid() AND contact_id = recipient_id AND status = 'accepted')
       OR (user_id = recipient_id AND contact_id = auth.uid() AND status = 'accepted')
  )
);

-- Users can update read status on messages sent to them
CREATE POLICY "Users can mark their DMs as read"
ON wspr_direct_messages FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete their sent DMs"
ON wspr_direct_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Create function to get DM conversations
CREATE OR REPLACE FUNCTION get_dm_conversations(user_id_param UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_display_name TEXT,
  contact_avatar_url TEXT,
  contact_avatar_color TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT DISTINCT
      CASE 
        WHEN dm.sender_id = user_id_param THEN dm.recipient_id
        ELSE dm.sender_id
      END AS other_user_id
    FROM wspr_direct_messages dm
    WHERE dm.sender_id = user_id_param OR dm.recipient_id = user_id_param
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN dm.sender_id = user_id_param THEN dm.recipient_id
        ELSE dm.sender_id
      END
    )
      CASE 
        WHEN dm.sender_id = user_id_param THEN dm.recipient_id
        ELSE dm.sender_id
      END AS other_user_id,
      dm.content,
      dm.created_at
    FROM wspr_direct_messages dm
    WHERE dm.sender_id = user_id_param OR dm.recipient_id = user_id_param
    ORDER BY 
      CASE 
        WHEN dm.sender_id = user_id_param THEN dm.recipient_id
        ELSE dm.sender_id
      END,
      dm.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      dm.sender_id AS other_user_id,
      COUNT(*) AS unread
    FROM wspr_direct_messages dm
    WHERE dm.recipient_id = user_id_param AND dm.read_at IS NULL
    GROUP BY dm.sender_id
  )
  SELECT 
    c.other_user_id,
    p.display_name,
    p.avatar_url,
    p.avatar_color,
    lm.content,
    lm.created_at,
    COALESCE(uc.unread, 0)
  FROM conversations c
  LEFT JOIN wspr_profiles p ON p.id = c.other_user_id
  LEFT JOIN last_messages lm ON lm.other_user_id = c.other_user_id
  LEFT JOIN unread_counts uc ON uc.other_user_id = c.other_user_id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
