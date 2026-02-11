-- Enable RLS on wspr_messages table
ALTER TABLE wspr_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their channels" ON wspr_messages;
DROP POLICY IF EXISTS "Users can insert messages in their channels" ON wspr_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON wspr_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON wspr_messages;

-- Policy: Users can view messages in channels they have access to
CREATE POLICY "Users can view messages in their channels"
ON wspr_messages
FOR SELECT
USING (
  -- User is a member of the workspace that owns the channel
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspace_members.user_id = auth.uid()
  )
);

-- Policy: Users can insert messages in channels they have access to
CREATE POLICY "Users can insert messages in their channels"
ON wspr_messages
FOR INSERT
WITH CHECK (
  -- User is a member of the workspace that owns the channel
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspace_members.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Policy: Users can update their own messages
CREATE POLICY "Users can update their own messages"
ON wspr_messages
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON wspr_messages
FOR DELETE
USING (user_id = auth.uid());
