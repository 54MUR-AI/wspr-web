import { encryptMessage, decryptMessage, generateGroupKey } from '../utils/crypto';
import { User } from '../types/user';
import { GroupChat, GroupMember, GroupInvite } from '../types/group';

class GroupService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/groups${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Group operation failed');
    }

    return response.json();
  }

  async createGroup(name: string, members: string[]): Promise<GroupChat> {
    const groupKey = await generateGroupKey();
    const encryptedGroupKey = await Promise.all(
      members.map(async (memberId) => ({
        userId: memberId,
        key: await encryptMessage(groupKey, memberId),
      }))
    );

    const response = await this.fetchWithAuth('', {
      method: 'POST',
      body: JSON.stringify({
        name,
        members,
        encryptedKeys: encryptedGroupKey,
      }),
    });

    return response.group;
  }

  async getGroup(groupId: string): Promise<GroupChat> {
    return this.fetchWithAuth(`/${groupId}`);
  }

  async updateGroup(groupId: string, updates: Partial<GroupChat>): Promise<GroupChat> {
    return this.fetchWithAuth(`/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.fetchWithAuth(`/${groupId}`, {
      method: 'DELETE',
    });
  }

  async addMembers(groupId: string, memberIds: string[]): Promise<void> {
    const group = await this.getGroup(groupId);
    const groupKey = await this.getGroupKey(groupId);
    
    const encryptedGroupKey = await Promise.all(
      memberIds.map(async (memberId) => ({
        userId: memberId,
        key: await encryptMessage(groupKey, memberId),
      }))
    );

    await this.fetchWithAuth(`/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        memberIds,
        encryptedKeys: encryptedGroupKey,
      }),
    });
  }

  async removeMember(groupId: string, memberId: string): Promise<void> {
    await this.fetchWithAuth(`/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async leaveGroup(groupId: string): Promise<void> {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('User not authenticated');
    await this.removeMember(groupId, userId);
  }

  async getGroupKey(groupId: string): Promise<string> {
    const response = await this.fetchWithAuth(`/${groupId}/key`);
    return decryptMessage(response.encryptedKey, 'self');
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.fetchWithAuth(`/${groupId}/members`);
  }

  async updateMemberRole(
    groupId: string,
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<void> {
    await this.fetchWithAuth(`/${groupId}/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async inviteMember(groupId: string, email: string): Promise<GroupInvite> {
    return this.fetchWithAuth(`/${groupId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async acceptInvite(inviteId: string): Promise<GroupChat> {
    return this.fetchWithAuth(`/invites/${inviteId}/accept`, {
      method: 'POST',
    });
  }

  async rejectInvite(inviteId: string): Promise<void> {
    await this.fetchWithAuth(`/invites/${inviteId}/reject`, {
      method: 'POST',
    });
  }

  async getGroupInvites(): Promise<GroupInvite[]> {
    return this.fetchWithAuth('/invites');
  }

  async searchGroups(query: string): Promise<GroupChat[]> {
    return this.fetchWithAuth(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const groupService = new GroupService();
export default groupService;
