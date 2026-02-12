-- 2. Show ALL profiles in wspr_profiles
SELECT 
  '2. All profiles in wspr_profiles:' as info,
  id,
  display_name,
  updated_at
FROM wspr_profiles
ORDER BY updated_at DESC;
