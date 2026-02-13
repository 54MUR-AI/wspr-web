-- Migration 038: DM replies, reactions, and edit support
-- Brings DMs to feature parity with channel messages
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════════
-- 1. Add reply_to_id and edited_at to wspr_direct_messages
-- ═══════════════════════════════════════════════

ALTER TABLE wspr_direct_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES wspr_direct_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_dm_reply_to ON wspr_direct_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Update RLS: allow sender to update their own messages (for editing)
-- Drop existing update policy first (it only allowed recipient to mark read)
DROP POLICY IF EXISTS "Users can mark their DMs as read" ON wspr_direct_messages;

-- Recreate: recipients can mark read, senders can edit content
CREATE POLICY "Users can update their DMs"
ON wspr_direct_messages FOR UPDATE
USING (auth.uid() = recipient_id OR auth.uid() = sender_id)
WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- ═══════════════════════════════════════════════
-- 2. Create wspr_dm_reactions table (mirrors wspr_reactions)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wspr_dm_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_message_id UUID NOT NULL REFERENCES wspr_direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dm_message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON wspr_dm_reactions(dm_message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_user ON wspr_dm_reactions(user_id);

-- Enable RLS
ALTER TABLE wspr_dm_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on DMs they're part of
CREATE POLICY "Users can view DM reactions"
ON wspr_dm_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wspr_direct_messages dm
    WHERE dm.id = dm_message_id
    AND (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
  )
);

-- Users can add reactions to DMs they're part of
CREATE POLICY "Users can add DM reactions"
ON wspr_dm_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM wspr_direct_messages dm
    WHERE dm.id = dm_message_id
    AND (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their DM reactions"
ON wspr_dm_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for dm_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE wspr_dm_reactions;
