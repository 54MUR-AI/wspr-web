-- Debug why queries return no rows
-- Check what auth.uid() returns and if membership data exists

-- 1. What is auth.uid() returning?
SELECT 
  'Your auth.uid():' as info,
  auth.uid() as current_user_id;

-- 2. Show ALL memberships in the table (no WHERE clause)
SELECT 
  'All memberships:' as info,
  workspace_id,
  user_id,
  role,
  joined_at
FROM wspr_workspace_members
ORDER BY joined_at DESC
LIMIT 10;

-- 3. Show your specific user ID from earlier query
-- We know from check-testworkspace.sql that your user_id is d5bf8d03-b60b-4920-8368-3aab05641707
SELECT 
  'Your memberships by known ID:' as info,
  workspace_id,
  user_id,
  role
FROM wspr_workspace_members
WHERE user_id = 'd5bf8d03-b60b-4920-8368-3aab05641707'::uuid;

-- 4. Compare: Does auth.uid() match your known user ID?
SELECT 
  'ID comparison:' as info,
  auth.uid() as auth_uid,
  'd5bf8d03-b60b-4920-8368-3aab05641707'::uuid as known_user_id,
  auth.uid() = 'd5bf8d03-b60b-4920-8368-3aab05641707'::uuid as ids_match;
