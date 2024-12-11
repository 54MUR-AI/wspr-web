import React, { useState, useEffect } from 'react';
import { Users, Settings, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { GroupChat, GroupMember } from '../../types/group';
import { groupService } from '../../services/group.service';
import MessageComposer from './MessageComposer';
import UserPresence from './UserPresence';

interface GroupChatProps {
  groupId: string;
  onClose?: () => void;
}

const GroupChatComponent: React.FC<GroupChatProps> = ({ groupId, onClose }) => {
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupData, memberData] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setMembers(memberData);
    } catch (err) {
      setError('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await groupService.inviteMember(groupId, inviteEmail);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      setError('Failed to send invitation');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await groupService.leaveGroup(groupId);
      onClose?.();
    } catch (err) {
      setError('Failed to leave group');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await groupService.removeMember(groupId, memberId);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, role: 'admin' | 'member') => {
    try {
      await groupService.updateMemberRole(groupId, memberId, role);
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role } : m
      ));
    } catch (err) {
      setError('Failed to update member role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error || 'Group not found'}</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  const isAdmin = members.some(m => 
    m.id === localStorage.getItem('userId') && m.role === 'admin'
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{group.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{group.name}</h2>
            <p className="text-sm text-muted-foreground">
              {members.length} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Members</h3>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInvite(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-64">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      {isAdmin && member.id !== localStorage.getItem('userId') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Messages will be rendered here */}
      </ScrollArea>

      <div className="p-4 border-t">
        <MessageComposer
          recipientId={groupId}
          onSend={(content) => {
            // Handle group message send
          }}
          onFileUpload={(fileId) => {
            // Handle group file upload
          }}
        />
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember}>Send Invite</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLeaveGroup}
            >
              Leave Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChatComponent;
