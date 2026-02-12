-- Test direct INSERT to wspr_messages to isolate the RLS issue

-- First, get your user ID
SELECT 'Your user ID:' as info, auth.uid() as user_id;

-- Get Public workspace channels
SELECT 
  'Public channels:' as info,
  c.id as channel_id,
  c.name as channel_name,
  w.name as workspace_name
FROM wspr_channels c
INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
WHERE w.name = 'Public';

-- Check if you're a member of Public workspace
SELECT 
  'Your Public membership:' as info,
  EXISTS (
    SELECT 1 FROM wspr_workspace_members wm
    INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
    WHERE w.name = 'Public'
    AND wm.user_id = auth.uid()
  ) as is_member;

-- Test the INSERT policy condition for a Public channel
-- Replace CHANNEL_ID with an actual channel ID from the query above
SELECT 
  'Policy check for Public channel:' as info,
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
    WHERE wspr_channels.id = (
      SELECT id FROM wspr_channels c
      INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
      WHERE w.name = 'Public'
      LIMIT 1
    )
    AND wspr_workspaces.name = 'Public'
  ) as public_channel_check;

-- Try a direct INSERT (this will test if RLS allows it)
-- IMPORTANT: Only run this if you want to actually insert a test message
-- Uncomment the lines below to test:

-- INSERT INTO wspr_messages (channel_id, user_id, content)
-- SELECT 
--   c.id as channel_id,
--   auth.uid() as user_id,
--   'RLS test message' as content
-- FROM wspr_channels c
-- INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
-- WHERE w.name = 'Public'
-- LIMIT 1
-- RETURNING *;
