-- 3. Show ALL workspaces
SELECT 
  '3. All workspaces:' as info,
  id,
  name,
  owner_id,
  is_public,
  created_at
FROM wspr_workspaces
ORDER BY created_at DESC;
