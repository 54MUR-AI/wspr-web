-- 1. Show ALL users in auth.users
SELECT 
  '1. All users in auth.users:' as info,
  id,
  email,
  raw_user_meta_data->>'display_name' as display_name,
  created_at
FROM auth.users
ORDER BY created_at DESC;
