-- Create LDGR subfolders for Public workspace channels
-- This creates a subfolder for each channel that doesn't have one

DO $$
DECLARE
  channel_record RECORD;
  public_folder_id UUID;
  new_subfolder_id UUID;
BEGIN
  -- Get Public workspace LDGR folder ID
  SELECT ldgr_folder_id INTO public_folder_id
  FROM wspr_workspaces
  WHERE name = 'Public'
  LIMIT 1;

  IF public_folder_id IS NULL THEN
    RAISE EXCEPTION 'Public workspace has no LDGR folder';
  END IF;

  RAISE NOTICE 'Public folder ID: %', public_folder_id;

  -- Loop through all channels in Public workspace that don't have LDGR folders
  FOR channel_record IN
    SELECT c.id, c.name, w.owner_id
    FROM wspr_channels c
    JOIN wspr_workspaces w ON w.id = c.workspace_id
    WHERE w.name = 'Public'
    AND c.ldgr_folder_id IS NULL
  LOOP
    -- Create subfolder for this channel
    INSERT INTO folders (user_id, name, parent_id, display_order)
    VALUES (
      channel_record.owner_id,
      channel_record.name,
      public_folder_id,
      0
    )
    RETURNING id INTO new_subfolder_id;

    -- Link the subfolder to the channel
    UPDATE wspr_channels
    SET ldgr_folder_id = new_subfolder_id
    WHERE id = channel_record.id;

    RAISE NOTICE 'Created subfolder "%" with ID: % for channel: %', 
      channel_record.name, new_subfolder_id, channel_record.id;
  END LOOP;

END $$;

-- Verify the setup
SELECT 
  w.name as workspace_name,
  c.name as channel_name,
  c.ldgr_folder_id as channel_folder_id,
  f.name as folder_name,
  f.parent_id as parent_folder_id
FROM wspr_workspaces w
JOIN wspr_channels c ON c.workspace_id = w.id
LEFT JOIN folders f ON f.id = c.ldgr_folder_id
WHERE w.name = 'Public'
ORDER BY c.name;
