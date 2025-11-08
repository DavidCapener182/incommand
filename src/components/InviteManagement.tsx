'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

interface EventInvite {
  id: string;
  role: string;
  intended_email?: string;
  allow_multiple: boolean;
  max_uses: number;
  used_count: number;
  expires_at: string;
  last_used_at?: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  metadata: Record<string, any>;
  invite_code?: string; // Only available for newly created invites
  invite_link?: string; // Only available for newly created invites
}

interface InviteManagementProps {
  eventId?: string | null;
}

export default function InviteManagement({ eventId }: InviteManagementProps) {
  const [currentEventId, setCurrentEventId] = useState<string | null>(eventId || null);
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newInvite, setNewInvite] = useState({
    role: 'read_only' as 'medic' | 'security' | 'production' | 'read_only',
    intended_email: '',
    allow_multiple: false,
    max_uses: 1,
    expires_at: '',
    metadata: {}
  });

  useEffect(() => {
    const fetchCurrentEvent = async () => {
      if (!currentEventId) {
        try {
          const { data: currentEvent, error } = await supabase
            .from('events')
            .select('id')
            .eq('is_current', true)
            .single();
          
          if (error || !currentEvent) {
            setError('No current event found');
            setLoading(false);
            return;
          }
          
          setCurrentEventId(currentEvent.id);
        } catch (err) {
          setError('Failed to fetch current event');
          setLoading(false);
        }
      }
    };

    fetchCurrentEvent();
  }, [currentEventId]);

  const fetchInvites = useCallback(async () => {
    if (!currentEventId) return;
    
    try {
      const response = await fetch(`/api/events/${currentEventId}/invites`);
      if (!response.ok) {
        throw new Error('Failed to fetch invites');
      }
      const data = await response.json();
      setInvites(data.invites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invites');
      logger.error('Failed to fetch invites', err, {
        component: 'InviteManagement',
        action: 'fetchInvites',
        eventId: currentEventId || undefined
      });
    } finally {
      setLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    if (currentEventId) {
      fetchInvites();
    }
  }, [currentEventId, fetchInvites]);

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${currentEventId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvite),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite');
      }

      // Add the new invite to the list with code and link for display
      const inviteWithDetails = {
        id: data.invite.id,
        role: data.invite.role,
        intended_email: newInvite.intended_email,
        allow_multiple: newInvite.allow_multiple,
        max_uses: newInvite.max_uses,
        used_count: 0,
        expires_at: data.invite.expires_at,
        last_used_at: undefined,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        metadata: newInvite.metadata,
        // Store the code and link for display
        invite_code: data.invite.code,
        invite_link: data.invite.link
      };
      setInvites(prev => [inviteWithDetails, ...prev]);
      setShowCreateForm(false);
      setNewInvite({
        role: 'read_only',
        intended_email: '',
        allow_multiple: false,
        max_uses: 1,
        expires_at: '',
        metadata: {}
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
      logger.error('Failed to create invite', err, {
        component: 'InviteManagement',
        action: 'createInvite',
        eventId: currentEventId || undefined
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${currentEventId}/invites?inviteId=${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invite');
      }

      setInvites(invites.map(invite => 
        invite.id === inviteId 
          ? { ...invite, status: 'revoked' as const }
          : invite
      ));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invite');
      logger.error('Failed to revoke invite', err, {
        component: 'InviteManagement',
        action: 'revokeInvite',
        eventId: currentEventId || undefined,
        inviteId
      });
    }
  };

  const deleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to permanently delete this invite? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${currentEventId}/invites?inviteId=${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permanent: true })
      });

      if (!response.ok) {
        throw new Error('Failed to delete invite');
      }

      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete invite');
      logger.error('Failed to delete invite', err, {
        component: 'InviteManagement',
        action: 'deleteInvite',
        eventId: currentEventId || undefined,
        inviteId
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'revoked':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Event Invites</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Invite
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Create New Invite</h3>
          <form onSubmit={createInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newInvite.role}
                  onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="read_only">Read Only</option>
                  <option value="medic">Medic</option>
                  <option value="security">Security</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intended Email (Optional)
                </label>
                <input
                  type="email"
                  value={newInvite.intended_email}
                  onChange={(e) => setNewInvite({ ...newInvite, intended_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={newInvite.max_uses}
                  onChange={(e) => setNewInvite({ ...newInvite, max_uses: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At
                </label>
                <input
                  type="datetime-local"
                  value={newInvite.expires_at}
                  onChange={(e) => setNewInvite({ ...newInvite, expires_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_multiple"
                checked={newInvite.allow_multiple}
                onChange={(e) => setNewInvite({ ...newInvite, allow_multiple: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="allow_multiple" className="text-sm text-gray-700">
                Allow multiple uses
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Show invite details for newly created invites */}
      {invites.some(invite => invite.invite_code && invite.invite_link) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">New Invite Created!</h3>
          {invites
            .filter(invite => invite.invite_code && invite.invite_link)
            .map(invite => (
              <div key={invite.id} className="bg-white border border-green-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Code</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={invite.invite_code}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg text-center"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(invite.invite_code!)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Copy code"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direct Link</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={invite.invite_link}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(invite.invite_link!)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Copy link"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Share either the 6-digit code or the direct link with the user. The code is easier to communicate verbally, while the link is more convenient for digital sharing.
                </p>
              </div>
            ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {invites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No invites created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {invite.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.intended_email || 'Any email'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.used_count} / {invite.max_uses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                        {getStatusIcon(invite.status)}
                        <span className="ml-1">{invite.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {invite.status === 'active' && (
                          <button
                            onClick={() => revokeInvite(invite.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Revoke invite"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {invite.status === 'revoked' && (
                          <button
                            onClick={() => deleteInvite(invite.id)}
                            className="text-gray-600 hover:text-red-900 transition-colors"
                            title="Permanently delete invite"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
