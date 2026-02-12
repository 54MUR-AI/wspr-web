-- Fix DenaliFox profile display name
-- User ID: 2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a

-- Check current profile
SELECT 
  'Current profile:' as info,
  id,
  display_name,
  email,
  avatar_url
FROM wspr_profiles
WHERE id = '2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a';

-- Update display name to DenaliFox
UPDATE wspr_profiles
SET display_name = 'DenaliFox',
    updated_at = NOW()
WHERE id = '2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a';

-- Verify update
SELECT 
  'Updated profile:' as info,
  id,
  display_name,
  email,
  avatar_url
FROM wspr_profiles
WHERE id = '2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a';
