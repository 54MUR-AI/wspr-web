-- Create wspr_attachments table
CREATE TABLE IF NOT EXISTS wspr_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES wspr_messages(id) ON DELETE CASCADE,
  ldgr_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON wspr_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON wspr_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_ldgr_file_id ON wspr_attachments(ldgr_file_id);

-- Enable RLS
ALTER TABLE wspr_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view attachments in their channels" ON wspr_attachments;
DROP POLICY IF EXISTS "Users can upload attachments to their channels" ON wspr_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON wspr_attachments;

-- Policy: Users can view attachments in channels they have access to
CREATE POLICY "Users can view attachments in their channels"
ON wspr_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wspr_messages
    INNER JOIN wspr_channels ON wspr_messages.channel_id = wspr_channels.id
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_messages.id = wspr_attachments.message_id
    AND wspr_workspace_members.user_id = auth.uid()
  )
);

-- Policy: Users can upload attachments to channels they have access to
CREATE POLICY "Users can upload attachments to their channels"
ON wspr_attachments
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM wspr_messages
    INNER JOIN wspr_channels ON wspr_messages.channel_id = wspr_channels.id
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_messages.id = wspr_attachments.message_id
    AND wspr_workspace_members.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON wspr_attachments
FOR DELETE
USING (uploaded_by = auth.uid());
