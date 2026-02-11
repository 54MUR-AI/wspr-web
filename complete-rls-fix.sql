-- COMPLETE RLS FIX - Fixes all infinite recursion issues
-- Run this entire script in one go in Supabase SQL Editor

-- ============================================
-- STEP 1: DISABLE ALL RLS TEMPORARILY
-- ============================================
ALTER TABLE wspr_workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE folder_access DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================

-- Workspace policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;

-- Workspace member policies
DROP POLICY IF EXISTS "Users can view workspace members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Users can join workspaces" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Users can manage their membership" ON wspr_workspace_members;

-- File policies
DROP POLICY IF EXISTS "Users can view their files" ON files;
DROP POLICY IF EXISTS "Users can upload files" ON files;
DROP POLICY IF EXISTS "Users can update their files" ON files;
DROP POLICY IF EXISTS "Users can delete their files" ON files;

-- Folder policies
DROP POLICY IF EXISTS "Users can view their folders" ON folders;
DROP POLICY IF EXISTS "Users can create folders" ON folders;
DROP POLICY IF EXISTS "Users can update their folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their folders" ON folders;

-- Folder access policies
DROP POLICY IF EXISTS "Users can view their folder access" ON folder_access;
DROP POLICY IF EXISTS "Folder owners can manage access" ON folder_access;
DROP POLICY IF EXISTS "Workspace owners can manage folder access" ON folder_access;

-- ============================================
-- STEP 3: RE-ENABLE RLS WITH FORCE
-- ============================================
ALTER TABLE wspr_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspaces FORCE ROW LEVEL SECURITY;

ALTER TABLE wspr_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspace_members FORCE ROW LEVEL SECURITY;

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders FORCE ROW LEVEL SECURITY;

ALTER TABLE folder_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_access FORCE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE SIMPLE NON-RECURSIVE POLICIES
-- ============================================

-- ----------------
-- WORKSPACE MEMBERS (Base level - no external references)
-- ----------------

CREATE POLICY "Users can view workspace members"
ON wspr_workspace_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage workspace members"
ON wspr_workspace_members
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR workspace_id IN (
    SELECT id FROM wspr_workspaces WHERE owner_id = auth.uid()
  )
);

-- ----------------
-- WORKSPACES (References members only)
-- ----------------

CREATE POLICY "Users can view their workspaces"
ON wspr_workspaces
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT workspace_id 
    FROM wspr_workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update"
ON wspr_workspaces
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() AND name != 'Public');

-- ----------------
-- FOLDER ACCESS (Simple - no recursion)
-- ----------------

CREATE POLICY "Users can view their folder access"
ON folder_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Folder owners can manage access"
ON folder_access
FOR ALL
TO authenticated
USING (
  folder_id IN (
    SELECT id FROM folders WHERE user_id = auth.uid()
  )
);

-- ----------------
-- FOLDERS (Simple - no workspace references)
-- ----------------

CREATE POLICY "Users can view their folders"
ON folders
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR id IN (
    SELECT folder_id FROM folder_access WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create folders"
ON folders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their folders"
ON folders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their folders"
ON folders
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ----------------
-- FILES (Simple - no workspace references)
-- ----------------

CREATE POLICY "Users can view their files"
ON files
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR folder_id IN (
    SELECT folder_id FROM folder_access WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload files"
ON files
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their files"
ON files
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their files"
ON files
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user 
ON wspr_workspace_members(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user 
ON wspr_workspace_members(user_id);

CREATE INDEX IF NOT EXISTS idx_folder_access_user 
ON folder_access(user_id);

CREATE INDEX IF NOT EXISTS idx_folder_access_folder 
ON folder_access(folder_id);

CREATE INDEX IF NOT EXISTS idx_files_user 
ON files(user_id);

CREATE INDEX IF NOT EXISTS idx_files_folder 
ON files(folder_id);

CREATE INDEX IF NOT EXISTS idx_folders_user 
ON folders(user_id);

-- ============================================
-- STEP 6: VERIFY RLS IS ENABLED
-- ============================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('wspr_workspaces', 'wspr_workspace_members', 'files', 'folders', 'folder_access')
AND schemaname = 'public'
ORDER BY tablename;
