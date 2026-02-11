import { X, UserPlus, Mail } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface InviteToWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  workspaceName: string
}

export default function InviteToWorkspaceModal({ isOpen, onClose, workspaceId, workspaceName }: InviteToWorkspaceModalProps) {
  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setIsInviting(true)
    setError('')
    setSuccess('')

    try {
      // Find user by email
      const { data: users, error: userError } = await supabase
        .from('wspr_profiles')
        .select('user_id')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (userError || !users) {
        setError('User not found. They need to sign up first.')
        setIsInviting(false)
        return
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('wspr_workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', users.user_id)
        .single()

      if (existingMember) {
        setError('User is already a member of this workspace')
        setIsInviting(false)
        return
      }

      // Add user as member
      const { error: inviteError } = await supabase
        .from('wspr_workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: users.user_id,
          role: 'member'
        })

      if (inviteError) {
        setError('Failed to invite user: ' + inviteError.message)
        setIsInviting(false)
        return
      }

      // Grant read access to workspace LDGR folder
      const { data: workspace } = await supabase
        .from('wspr_workspaces')
        .select('ldgr_folder_id')
        .eq('id', workspaceId)
        .single()

      if (workspace?.ldgr_folder_id) {
        const { error: accessError } = await supabase
          .from('folder_access')
          .insert({
            folder_id: workspace.ldgr_folder_id,
            user_id: users.user_id,
            access_level: 'read'
          })

        if (accessError && accessError.code !== '23505') {
          console.error('Error granting folder access:', accessError)
        }
      }

      setSuccess(`Successfully invited ${email} to ${workspaceName}!`)
      setEmail('')
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (error) {
      console.error('Invite error:', error)
      setError('Failed to invite user')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-samurai-grey-dark">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-samurai-red" />
            <div>
              <h2 className="text-xl font-bold text-white">Invite to Workspace</h2>
              <p className="text-sm text-samurai-steel">{workspaceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-samurai-steel" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              User Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-samurai-steel" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-3 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white placeholder-samurai-steel focus:border-samurai-red focus:outline-none transition-colors"
                disabled={isInviting}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-samurai-grey-dark flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isInviting}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            className="btn-primary"
            disabled={isInviting || !email.trim()}
          >
            {isInviting ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
