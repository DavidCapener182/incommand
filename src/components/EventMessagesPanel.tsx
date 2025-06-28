import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FaRobot, FaUsers, FaShieldAlt, FaExclamationCircle } from 'react-icons/fa';
import AIChat from './AIChat';
import { useSession } from '@supabase/auth-helpers-react';

const mainGroups = [
  { key: 'ai', label: 'AI Chatbot', icon: <FaRobot />, pinned: true },
];

interface Event {
  id: string;
  event_name: string;
}

interface Group {
  id: string;
  name: string;
  type: string;
}

interface Message {
  id: number;
  sender: string; // user_id
  text: string;
}

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

// Helper to map group type/name to icon/label
function getGroupMeta(group: Partial<Group>) {
  const name = group.name?.toLowerCase() || '';
  if (group.type === 'smt' || name.includes('smt')) {
    return { icon: <FaUsers />, label: 'SMT', key: group.id };
  }
  if (group.type === 'supervisors' || name.includes('supervisor')) {
    return { icon: <FaShieldAlt />, label: 'Supervisors', key: group.id };
  }
  if (group.type === 'issues' || name.includes('issue')) {
    return { icon: <FaExclamationCircle />, label: 'Issues', key: group.id };
  }
  // fallback
  return { icon: <FaUsers />, label: group.name || 'Group', key: group.id };
}

function getInitials(nameOrEmail: string) {
  if (!nameOrEmail) return '?';
  const parts = nameOrEmail.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const emailPart = nameOrEmail.split('@')[0];
  if (emailPart.length >= 2) {
    return (emailPart[0] + emailPart[1]).toUpperCase();
  }
  if (emailPart.length === 1) {
    return (emailPart[0] + emailPart[0]).toUpperCase();
  }
  return '?';
}

const EventMessagesPanel = () => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [communityGroups, setCommunityGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ai');
  const [messagesByGroup, setMessagesByGroup] = useState<{ [groupId: string]: Message[] }>({});
  const [inputValue, setInputValue] = useState('');
  const [profiles, setProfiles] = useState<{ [userId: string]: Profile }>({});
  const session = useSession();
  const currentUserId = session?.user?.id;

  // Fetch current event
  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('id, event_name')
        .eq('is_current', true)
        .single<Event>();
      if (data) setCurrentEvent(data);
    }
    fetchEvent();
  }, []);

  // Fetch community groups for the event
  useEffect(() => {
    if (!currentEvent || !currentEvent.id) return;
    async function fetchGroups() {
      const { data } = await supabase
        .from('event_chats')
        .select('id, name, type')
        .eq('event_id', currentEvent.id);
      if (data) {
        setCommunityGroups(data as Group[]);
        // Set default selected group if not set
        if (selectedGroup === 'ai' && data.length > 0) {
          setSelectedGroup(data[0].id);
        }
      }
    }
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent]);

  // Fetch messages from Supabase for selected group
  useEffect(() => {
    if (selectedGroup === 'ai') return;
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('event_chat_messages')
        .select('id, user_id, message, created_at')
        .eq('chat_id', selectedGroup)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching messages:', error);
        setMessagesByGroup(prev => ({ ...prev, [selectedGroup]: [] }));
      } else if (data) {
        setMessagesByGroup(prev => ({
          ...prev,
          [selectedGroup]: data.map((msg: any) => ({
            id: new Date(msg.created_at).getTime(),
            sender: msg.user_id,
            text: msg.message,
          })),
        }));
      }
    }
    fetchMessages();
  }, [selectedGroup]);

  // Fetch missing profiles for senders in current messages
  useEffect(() => {
    const messages = messagesByGroup[selectedGroup] || [];
    const missingUserIds = Array.from(new Set(messages.map(m => m.sender)))
      .filter(uid => uid && !profiles[uid] && uid !== 'You');
    if (missingUserIds.length === 0) return;
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', missingUserIds);
      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }
      if (data) {
        setProfiles(prev => {
          const newProfiles = { ...prev };
          data.forEach((p: Profile) => {
            newProfiles[p.id] = p;
          });
          return newProfiles;
        });
      }
    }
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesByGroup, selectedGroup]);

  // Update handleSend to insert into Supabase
  const handleSend = async () => {
    if (!inputValue.trim() || selectedGroup === 'ai') return;
    // Replace 'You' with actual user id if available
    const userId = 'You';
    const { error } = await supabase
      .from('event_chat_messages')
      .insert([
        {
          chat_id: selectedGroup,
          user_id: userId,
          message: inputValue,
        },
      ]);
    if (error) {
      console.error('Error sending message:', error);
      return;
    }
    setInputValue('');
    // Optionally, re-fetch messages
    const { data } = await supabase
      .from('event_chat_messages')
      .select('id, user_id, message, created_at')
      .eq('chat_id', selectedGroup)
      .order('created_at', { ascending: true });
    if (data) {
      setMessagesByGroup(prev => ({
        ...prev,
        [selectedGroup]: data.map((msg: any) => ({
          id: new Date(msg.created_at).getTime(),
          sender: msg.user_id,
          text: msg.message,
        })),
      }));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  // Find selected group meta
  const selectedGroupMeta =
    selectedGroup === 'ai'
      ? { icon: <FaRobot />, label: 'AI Chatbot', key: 'ai' }
      : getGroupMeta(
          communityGroups.find((g) => g.id === selectedGroup) || {}
        );

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '400px', borderRadius: 24, boxShadow: '0 4px 32px rgba(44,62,80,0.10)', background: '#f3f4f6', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#f3f4f6', padding: 16, borderRight: '1px solid #e5e7eb', borderTopLeftRadius: 24, borderBottomLeftRadius: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6366f1' }}>●</span> {currentEvent?.event_name || ''} <span style={{ fontSize: 12, color: '#10b981', marginLeft: 8 }}>LIVE</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>Main Groups</div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mainGroups.map(group => (
              <li key={group.key} style={{ marginBottom: 8 }}>
                <button
                  style={{
                    background: selectedGroup === group.key ? '#fff' : 'transparent',
                    border: selectedGroup === group.key ? '2px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '8px 12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 'bold',
                    color: selectedGroup === group.key ? '#6366f1' : '#111827',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedGroup(group.key)}
                >
                  {group.icon} {group.label}
                  {group.pinned && <span style={{ marginLeft: 'auto', color: '#f59e42', fontSize: 12 }}>PINNED</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>Community Groups</div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {communityGroups.map(group => {
              const meta = getGroupMeta(group);
              return (
                <li key={meta.key} style={{ marginBottom: 8 }}>
                  <button
                    style={{
                      background: selectedGroup === group.id ? '#fff' : 'transparent',
                      border: selectedGroup === group.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 'bold',
                      color: selectedGroup === group.id ? '#6366f1' : '#111827',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    {meta.icon} {meta.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <button style={{ width: '100%', padding: 8, borderRadius: 12, background: '#e5e7eb', color: '#6b7280', border: 'none', cursor: 'not-allowed' }} disabled>
          + Add Group
        </button>
      </aside>
      {/* Main Chat Area */}
      <main style={{ flex: 1, padding: 0, background: '#f3f4f6', display: 'flex', flexDirection: 'column', minHeight: '400px', borderTopRightRadius: 24, borderBottomRightRadius: 24 }}>
        {selectedGroup === 'ai' ? (
          <AIChat isVisible={true} />
        ) : (
          <>
            {/* Rounded, colored header bar */}
            <div style={{
              background: 'linear-gradient(90deg, #e0e7ff 0%, #f3f4f6 100%)',
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 0,
              borderTopLeftRadius: 0,
              borderBottomRightRadius: 0,
              boxShadow: '0 2px 8px rgba(44,62,80,0.06)',
              padding: '20px 32px 16px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 700,
              fontSize: 20,
              color: '#3730a3',
              marginBottom: 0
            }}>
              {selectedGroupMeta.icon}
              {selectedGroupMeta.label}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', margin: 0, border: 'none', borderRadius: 0, padding: 32, background: '#f3f4f6', boxShadow: 'none' }}>
              {(messagesByGroup[selectedGroup] || []).map((msg) => {
                const profile = profiles[msg.sender];
                const isCurrentUser = msg.sender === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-2">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || msg.sender}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white">
                            {profile?.full_name
                              ? profile.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                              : msg.sender.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-xs ${isCurrentUser ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none'} rounded-lg shadow px-4 py-2 flex flex-col`} style={{ alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
                      <span className="text-xs font-semibold mb-1">
                        {profile?.full_name || msg.sender}
                      </span>
                      <span className="break-words">{msg.text}</span>
                      <span className="text-[10px] text-gray-400 mt-1 self-end">
                        {msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {isCurrentUser && (
                      <div className="flex-shrink-0 ml-2">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || msg.sender}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white">
                            {profile?.full_name
                              ? profile.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                              : msg.sender.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', margin: 24, marginTop: 0 }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, marginRight: 4, cursor: 'not-allowed' }}
                title="Attach file (coming soon)"
                disabled
              >
                📎
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 16, background: '#fff', color: '#111827', outline: 'none', boxShadow: 'none' }}
              />
              <button
                onClick={handleSend}
                style={{ padding: '8px 16px', borderRadius: 12, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 16, boxShadow: '0 1px 4px rgba(99,102,241,0.10)' }}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EventMessagesPanel;
