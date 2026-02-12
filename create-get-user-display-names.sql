-- Create get_user_display_names RPC function for WSPR
-- This function fetches display names from auth.users table

CREATE OR REPLACE FUNCTION get_user_display_names(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    COALESCE(
      au.raw_user_meta_data->>'display_name',
      au.email
    ) as display_name
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_display_names(uuid[]) TO authenticated;

-- Test the function
SELECT * FROM get_user_display_names(ARRAY[auth.uid()]);
