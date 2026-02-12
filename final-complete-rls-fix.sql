-- FINAL COMPLETE RLS FIX
-- This script completely resets and fixes all RLS policies in one go

-- ============================================
-- STEP 1: Drop ALL existing message policies
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'wspr_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON wspr_messages';
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Configure RLS on wspr_messages
-- ============================================
ALTER TABLE wspr_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_messages NO FORCE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create ONLY the 4 correct policies
-- ============================================

-- SELECT: View messages in channels you have access to OR in Public workspace
CREATE POLICY "Users can view messages in their channels"
ON wspr_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspace_members.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspaces.name = 'Public'
  )
);

-- INSERT: Post messages in channels you have access to OR in Public workspace
CREATE POLICY "Users can insert messages in their channels"
ON wspr_messages FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND
  (
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
      WHERE wspr_channels.id = wspr_messages.channel_id
      AND wspr_workspace_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
      WHERE wspr_channels.id = wspr_messages.channel_id
      AND wspr_workspaces.name = 'Public'
    )
  )
);

-- UPDATE: Only update your own messages
CREATE POLICY "Users can update their own messages"
ON wspr_messages FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Only delete your own messages
CREATE POLICY "Users can delete their own messages"
ON wspr_messages FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 4: Verify exactly 4 policies exist
-- ============================================
SELECT 
  'Message policies (should be exactly 4):' as info,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'wspr_messages';

SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'wspr_messages'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 5: Add all users to Public workspace
-- ============================================
INSERT INTO wspr_workspace_members (workspace_id, user_id, role)
SELECT 
  (SELECT id FROM wspr_workspaces WHERE name = 'Public' LIMIT 1) as workspace_id,
  id as user_id,
  'member' as role
FROM auth.users
WHERE id NOT IN (
  SELECT user_id 
  FROM wspr_workspace_members 
  WHERE workspace_id = (SELECT id FROM wspr_workspaces WHERE name = 'Public' LIMIT 1)
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- ============================================
-- STEP 6: Verify all users are Public members
-- ============================================
SELECT 
  'Total users:' as info,
  COUNT(*) as count
FROM auth.users;

SELECT 
  'Public workspace members:' as info,
  COUNT(*) as count
FROM wspr_workspace_members wm
INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
WHERE w.name = 'Public';

-- These two numbers should match!
