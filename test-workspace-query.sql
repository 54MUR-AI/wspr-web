-- Test the exact query that WSPR uses to fetch workspaces
-- This simulates what getUserWorkspaces() does

SELECT 
  w.*,
  wm.user_id as member_user_id
FROM wspr_workspaces w
INNER JOIN wspr_workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = auth.uid()
ORDER BY w.created_at DESC;

-- If TestWorkspace doesn't show up here, there's an RLS policy issue
-- If it does show up, it's a frontend caching/state issue
