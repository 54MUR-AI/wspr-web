-- Verify if get_user_display_names function exists

SELECT 
  'RPC Functions:' as info,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'get_user_display_names'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- If no rows returned, the function doesn't exist
-- Run create-get-user-display-names.sql to create it
