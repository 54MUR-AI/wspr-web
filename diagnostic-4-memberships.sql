-- 4. Show ALL workspace memberships
SELECT 
  '4. All workspace memberships:' as info,
  wm.workspace_id,
  w.name as workspace_name,
  wm.user_id,
  p.display_name as member_display_name,
  wm.role,
  wm.joined_at
FROM wspr_workspace_members wm
LEFT JOIN wspr_workspaces w ON wm.workspace_id = w.id
LEFT JOIN wspr_profiles p ON wm.user_id = p.id
ORDER BY wm.joined_at DESC;
