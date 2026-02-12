-- Cleanup duplicate message policies
-- The old policies (messages_insert, messages_select, messages_update) are conflicting with the new ones

-- Drop the OLD duplicate policies
DROP POLICY IF EXISTS "messages_insert" ON wspr_messages;
DROP POLICY IF EXISTS "messages_select" ON wspr_messages;
DROP POLICY IF EXISTS "messages_update" ON wspr_messages;

-- Verify only 4 policies remain
SELECT 
  'Remaining message policies (should be exactly 4):' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'wspr_messages'
ORDER BY cmd, policyname;

-- Expected policies:
-- 1. Users can delete their own messages (DELETE)
-- 2. Users can insert messages in their channels (INSERT)
-- 3. Users can view messages in their channels (SELECT)
-- 4. Users can update their own messages (UPDATE)
