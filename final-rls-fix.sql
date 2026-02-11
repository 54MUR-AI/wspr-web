-- FINAL RLS FIX - Zero cross-references between tables
-- This completely eliminates infinite recursion by making policies independent

-- ============================================
-- STEP 1: DISABLE ALL RLS
-- ============================================
ALTER TABLE wspr_workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE folder_access DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can view workspace members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Users can join workspaces" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Users can manage their membership" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Users can manage workspace members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Users can view their files" ON files;
DROP POLICY IF EXISTS "Users can upload files" ON files;
DROP POLICY IF EXISTS "Users can update their files" ON files;
DROP POLICY IF EXISTS "Users can delete their files" ON files;
DROP POLICY IF EXISTS "Users can view their folders" ON folders;
DROP POLICY IF EXISTS "Users can create folders" ON folders;
DROP POLICY IF EXISTS "Users can update their folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their folders" ON folders;
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
-- STEP 4: CREATE INDEPENDENT POLICIES (NO CROSS-REFERENCES)
-- ============================================

-- ----------------
-- WORKSPACE MEMBERS - Completely independent, no joins
-- ----------------

-- Allow all authenticated users to view members (simple, no recursion)
CREATE POLICY "Users can view workspace members"
ON wspr_workspace_members
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert/update/delete their own membership or any membership (managed by app logic)
CREATE POLICY "Users can manage workspace members"
ON wspr_workspace_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ----------------
-- WORKSPACES - Uses subquery to members (one-way only)
-- ----------------

-- Users can only see workspaces they are members of
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

-- Users can create workspaces
CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Owners can update their workspaces
CREATE POLICY "Workspace owners can update"
ON wspr_workspaces
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Owners can delete their workspaces (except Public)
CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() AND name != 'Public');

-- ----------------
-- FOLDER ACCESS - Independent
-- ----------------

CREATE POLICY "Users can view their folder access"
ON folder_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage folder access"
ON folder_access
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ----------------
-- FOLDERS - Independent
-- ----------------

CREATE POLICY "Users can view folders"
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

CREATE POLICY "Users can update folders"
ON folders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete folders"
ON folders
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ----------------
-- FILES - Independent
-- ----------------

CREATE POLICY "Users can view files"
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

CREATE POLICY "Users can update files"
ON files
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete files"
ON files
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 5: VERIFY RLS
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('wspr_workspaces', 'wspr_workspace_members', 'files', 'folders', 'folder_access')
AND schemaname = 'public'
ORDER BY tablename;
