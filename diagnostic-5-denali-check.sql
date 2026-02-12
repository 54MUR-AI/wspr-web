-- 5. Check if DenaliFox user exists
SELECT 
  '5. DenaliFox user check:' as info,
  id,
  email,
  raw_user_meta_data->>'display_name' as display_name
FROM auth.users
WHERE raw_user_meta_data->>'display_name' ILIKE '%denali%'
   OR email ILIKE '%denali%';
