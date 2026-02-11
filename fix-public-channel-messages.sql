-- Fix message posting in Public workspace channels
-- Allow all authenticated users to post in Public channels

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in their channels" ON wspr_messages;
DROP POLICY IF EXISTS "Users can insert messages in their channels" ON wspr_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON wspr_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON wspr_messages;

-- Ensure RLS is enabled but NOT forced (FORCE RLS blocks even valid inserts)
ALTER TABLE wspr_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_messages NO FORCE ROW LEVEL SECURITY;

-- SELECT: Users can view messages in channels they have access to OR in Public workspace
CREATE POLICY "Users can view messages in their channels"
ON wspr_messages
FOR SELECT
TO authenticated
USING (
  -- User is a member of the workspace that owns the channel
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspace_members.user_id = auth.uid()
  )
  OR
  -- OR the channel belongs to the Public workspace
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspaces.name = 'Public'
  )
);

-- INSERT: Users can post in channels they have access to OR in Public workspace
CREATE POLICY "Users can insert messages in their channels"
ON wspr_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- User is a member of the workspace that owns the channel
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
      WHERE wspr_channels.id = wspr_messages.channel_id
      AND wspr_workspace_members.user_id = auth.uid()
    )
    OR
    -- OR the channel belongs to the Public workspace (anyone can post)
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
      WHERE wspr_channels.id = wspr_messages.channel_id
      AND wspr_workspaces.name = 'Public'
    )
  )
  AND user_id = auth.uid()
);

-- UPDATE: Users can update their own messages
CREATE POLICY "Users can update their own messages"
ON wspr_messages
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON wspr_messages
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Verify policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'wspr_messages'
ORDER BY cmd, policyname;
