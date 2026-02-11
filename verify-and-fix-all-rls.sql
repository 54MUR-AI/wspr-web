-- Comprehensive RLS fix for WSPR
-- This script fixes all RLS issues in one go

-- ============================================
-- STEP 1: Check current RLS status
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('wspr_workspaces', 'wspr_messages', 'wspr_channels', 'wspr_workspace_members')
AND schemaname = 'public';

-- ============================================
-- STEP 2: Fix wspr_workspaces
-- ============================================

-- Drop all workspace policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they own or are members of" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_select" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON wspr_workspaces;

-- Enable RLS but NOT forced
ALTER TABLE wspr_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspaces NO FORCE ROW LEVEL SECURITY;

-- Create workspace policies
CREATE POLICY "Users can view their workspaces"
ON wspr_workspaces FOR SELECT TO authenticated
USING (
  id IN (
    SELECT workspace_id FROM wspr_workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create workspaces"
ON wspr_workspaces FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update"
ON wspr_workspaces FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces FOR DELETE TO authenticated
USING (owner_id = auth.uid() AND name != 'Public');

-- ============================================
-- STEP 3: Fix wspr_messages
-- ============================================

-- Drop all message policies
DROP POLICY IF EXISTS "Users can view messages in their channels" ON wspr_messages;
DROP POLICY IF EXISTS "Users can insert messages in their channels" ON wspr_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON wspr_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON wspr_messages;

-- Enable RLS but NOT forced
ALTER TABLE wspr_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_messages NO FORCE ROW LEVEL SECURITY;

-- Create message policies with Public workspace support
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

CREATE POLICY "Users can insert messages in their channels"
ON wspr_messages FOR INSERT TO authenticated
WITH CHECK (
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
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own messages"
ON wspr_messages FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON wspr_messages FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 4: Verify all policies
-- ============================================

-- Check workspace policies
SELECT 'WORKSPACE POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'wspr_workspaces'
ORDER BY cmd, policyname;

-- Check message policies
SELECT 'MESSAGE POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'wspr_messages'
ORDER BY cmd, policyname;

-- Should show exactly:
-- WORKSPACES: 4 policies (1 SELECT, 1 INSERT, 1 UPDATE, 1 DELETE)
-- MESSAGES: 4 policies (1 SELECT, 1 INSERT, 1 UPDATE, 1 DELETE)
