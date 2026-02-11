-- Prevent creation of duplicate Public workspaces
-- Only ONE Public workspace should exist

-- Add unique constraint on Public workspace name
CREATE UNIQUE INDEX IF NOT EXISTS unique_public_workspace 
ON wspr_workspaces (name) 
WHERE is_public = true AND name = 'Public';

-- Verify constraint exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'wspr_workspaces'
AND indexname = 'unique_public_workspace';
