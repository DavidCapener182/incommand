import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UsersIcon, ArrowUpCircleIcon, PaperClipIcon, ChatBubbleLeftRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { UserGroupIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { ToastMessage } from './Toast';

export interface CommunityChatProps {
  chatId: string;
  chatName: string;
  addToast?: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  isMobile: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  handleInputFocus?: () => void;
  handleInputBlur?: () => void;
}

export function getGroupInfoTooltip(name: string) {
    if (name.toLowerCase().includes('smt')) return 'Only SMT members can see this group.';
    if (name.toLowerCase().includes('supervisor')) return 'Only supervisors can see this group.';
    if (name.toLowerCase().includes('community')) return 'All event members can see this group.';
    return 'Group visibility depends on your role.';
}

// CommunityChat component for group chat UI/UX
const CommunityChat: React.FC<CommunityChatProps> = ({ chatId, chatName, addToast, isMobile, inputRef, handleInputFocus, handleInputBlur }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<{ id: string; name: string; email: string; avatar_url?: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const lastToastMsgId = useRef<string | null>(null);

  // Fetch messages from Supabase
  useEffect(() => {
    console.log('Chat panel mounted. chatId:', chatId);
    if (!chatId) {
      console.log('No chatId provided!');
      return;
    }
    console.log('Fetching messages from Supabase...');
    setLoadingMessages(true);
    setError(null);
    supabase
      .from('event_chat_messages')
      .select('*, profiles:profiles!user_id(id, full_name, avatar_url)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .then((result) => {
        console.log('Supabase result:', result);
        if (result.error) {
          setError('Could not load messages');
          setMessages([]);
        } else {
          const rows = (result.data || []) as any[];
          setMessages(rows);
          // Toast for new message (if not from current user)
          if (addToast && rows.length > 0) {
            const lastMsg: any = rows[rows.length - 1];
            if (
              lastMsg.id !== lastToastMsgId.current &&
              lastMsg.user_id !== user?.id
            ) {
              const jumpToMessage = () => {
                const el = messageRefs.current[lastMsg.id];
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-4', 'ring-blue-400', 'transition');
                  setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-blue-400', 'transition');
                  }, 1200);
                }
              };
              addToast({
                type: 'info',
                title: 'New Message',
                message: `${lastMsg.profiles?.full_name || 'Someone'}: ${lastMsg.message}`,
              });
              lastToastMsgId.current = lastMsg.id;
            }
          }
        }
        setLoadingMessages(false);
      });
    // Optionally: add real-time subscription here
    // ...
  }, [chatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch members when showMembers is toggled on
  useEffect(() => {
    async function fetchMembers() {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('event_chat_members')
        .select('user_id, profiles:profiles(id, full_name, email, avatar_url)')
        .eq('chat_id', chatId);
      if (error) {
        setMembers([]);
      } else {
        setMembers(
          (data || []).map((row: any) => ({
            id: row.user_id,
            name: row.profiles?.full_name || 'Unknown',
            email: row.profiles?.email || '',
            avatar_url: row.profiles?.avatar_url || '',
          }))
        );
      }
      setLoadingMembers(false);
    }
    if (showMembers) fetchMembers();
  }, [showMembers, chatId]);

  // Send message to Supabase
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !user) return;
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.from('event_chat_messages').insert([
      {
        chat_id: chatId,
        user_id: user.id,
        message: content.trim(),
      },
    ]);
    setIsLoading(false);
    setInputMessage('');
    if (error) {
      setError('Failed to send message');
    } else {
      // Refetch messages (or rely on real-time subscription)
      supabase
        .from('event_chat_messages')
        .select('*, profiles:profiles!user_id(id, full_name, avatar_url)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .then((result) => {
          console.log('Supabase result:', result);
          if (!result.error) setMessages(result.data || []);
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const clearChat = () => {
    // Optionally: implement admin-only clear
    setError(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  let lastDate = '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    // Detect @ and show dropdown
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ')) {
      setShowMentions(true);
      setMentionQuery(value.slice(atIndex + 1));
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && members.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % members.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + members.length) % members.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const member = members[mentionIndex];
        if (member) {
          insertMention(member.name);
        }
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertMention = (name: string) => {
    if (!inputRef || !inputRef.current) return;
    const value = inputRef.current.value;
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const before = value.slice(0, atIndex + 1);
      const after = value.slice(atIndex + 1).replace(/\S*/, '');
      const newValue = before + name + ' ' + after;
      inputRef.current.value = newValue;
      setShowMentions(false);
      setMentionQuery('');
      setMentionIndex(0);
      // Move cursor to after inserted mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = (before + name + ' ').length;
          if (!isMobile) {
            inputRef.current.focus();
          }
        }
      }, 0);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Chat Header */}
      <div className={`sticky ${isMobile ? 'top-[60px]' : 'top-0'} z-10 bg-white dark:bg-gray-900 shadow flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 rounded-t-lg`}>
        <div className="flex items-center gap-3">
          {/* Group icon - choose based on group name */}
          {members.length === 0 ? (
            <span className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
              <UsersIcon className="w-5 h-5" />
            </span>
          ) : (
            (() => {
              if (/senior management team|smt/i.test(chatName)) return <UserGroupIcon className="w-7 h-7 text-pink-500" />;
              if (/supervisors?/i.test(chatName)) return <ShieldCheckIcon className="w-7 h-7 text-blue-500" />;
              if (/issues?/i.test(chatName)) return <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />;
              return <UsersIcon className="w-7 h-7 text-blue-600" />;
            })()
          )}
          <div>
            <div className={`font-semibold text-lg leading-tight ${members.length === 0 ? 'text-gray-400' : ''}`}>
              {members.length === 0 ? (
                <span>
                  No members
                  <span className="ml-1" title="You're the only member in this group. Add more via event admin.">
                    <InformationCircleIcon className="inline w-4 h-4 text-gray-400" />
                  </span>
                </span>
              ) : (
                chatName
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              Event Group Chat
              {/* Info tooltip for group visibility/purpose */}
              <span title={getGroupInfoTooltip(chatName)}>
                <InformationCircleIcon className="inline w-4 h-4 text-gray-400" />
              </span>
            </div>
          </div>
          {/* Show up to 5 member avatars beside group name */}
          {members.slice(0, 5).map((m) => (
            <Image
              key={m.id}
              src={m.avatar_url || '/icon.png'}
              alt={m.name || 'Member avatar'}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 shadow"
              title={m.name}
              unoptimized
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* View Members button with badge */}
          <button
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowMembers((v) => !v)}
            aria-label="View Members"
            tabIndex={0}
          >
            <UsersIcon className="w-4 h-4" />
            View Members
            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">{members.length} Members</span>
          </button>
        </div>
      </div>
      {/* Expandable members section */}
      {showMembers && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
          <div className="font-semibold text-sm mb-1">Members</div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm border border-gray-100 dark:border-gray-800">
                <Image
                  src={m.avatar_url || '/icon.png'}
                  alt={m.name || 'Member avatar'}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full"
                  unoptimized
                />
                <span className="text-xs font-medium">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 min-h-0 ${isMobile ? 'pb-32' : ''}`}>
        {/* Pinned Messages */}
        {messages.filter(msg => msg.pinned).length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Pinned</span>
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            </div>
            {messages.filter(msg => msg.pinned).map((msg, idx) => {
              const nameColor = msg.role === 'manager' ? 'text-pink-400' : msg.role === 'supervisor' ? 'text-blue-400' : 'text-gray-500';
              return (
                <div key={msg.id} className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 rounded-lg p-3 mb-2 shadow">
                  <Image
                    src={msg.profiles?.avatar_url || '/default-avatar.png'}
                    alt={msg.profiles?.full_name || 'User avatar'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                    unoptimized
                  />
                  <div className="flex-1">
                    <div className={`font-bold ${nameColor}`}>{msg.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-800 dark:text-gray-100">{msg.message}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{formatTimestamp(msg.created_at)}</span>
                      <span className="ml-1">✓✓</span>
                    </div>
                  </div>
                  {/* Action bar on hover */}
                  <div className="flex gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-150 z-10">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Reply">↩️</button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Unpin">📌</button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Delete">🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
            <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2 text-blue-200 dark:text-blue-800" />
            <div className="text-lg font-semibold mb-1">No messages yet</div>
            <div className="text-sm">Start the conversation with your team.</div>
          </div>
        )}
        {/* Regular Messages */}
        {messages.length > 0 && messages.filter(msg => !msg.pinned).map((msg, idx) => {
          const msgDate = new Date(msg.created_at).toLocaleDateString();
          const prevMsg = messages[idx - 1];
          const prevDate = prevMsg ? new Date(prevMsg.created_at).toLocaleDateString() : null;
          const showDate = idx === 0 || msgDate !== prevDate;
          let nameColor = 'text-gray-500';
          if (msg.role === 'manager') nameColor = 'text-pink-400';
          else if (msg.role === 'supervisor') nameColor = 'text-blue-400';
          else if (msg.role === 'staff') nameColor = 'text-gray-400';
          else {
            // Deterministic color from user_id
            const palette = ['text-pink-400', 'text-blue-400', 'text-green-400', 'text-yellow-500', 'text-purple-400', 'text-gray-400'];
            let hash = 0;
            const id = msg.user_id || '';
            for (let i = 0; i < id.length; i++) {
              hash = id.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIdx = Math.abs(hash) % palette.length;
            nameColor = palette[colorIdx];
          }
          const isOwn = msg.user_id === user?.id;
          // Mock status for demo
          const status = msg.status || ['sent', 'delivered', 'read'][Math.floor(Math.random() * 3)];
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-2">
                  <span className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
                    {msgDate}
                  </span>
                </div>
              )}
              <div
                ref={el => { messageRefs.current[msg.id] = el; }}
                className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} fade-in`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {!isOwn && (
                  <Image
                    src={msg.profiles?.avatar_url || '/default-avatar.png'}
                    alt={msg.profiles?.full_name || 'User avatar'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full mr-2"
                    unoptimized
                  />
                )}
                <div className="relative max-w-lg">
                  <div className={`font-bold ${nameColor}`}>{msg.profiles?.full_name || 'Unknown'}</div>
                  <div className={`rounded-xl px-4 py-2 ${isOwn ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200' : 'bg-[#3a2e3a] text-white'}`}>
                    {msg.message}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>{formatTimestamp(msg.created_at)}</span>
                    <span
                      title={status === 'read' ? 'Read' : status === 'delivered' ? 'Delivered' : 'Sent'}
                      className="ml-1 select-none"
                    >
                      {status === 'read' ? (
                        <span className="text-blue-400">✓✓</span>
                      ) : status === 'delivered' ? (
                        <span className="text-gray-400">✓✓</span>
                      ) : (
                        <span className="text-gray-400">✓</span>
                      )}
                    </span>
                  </div>
                  {/* Action bar on hover */}
                  <div className="absolute right-0 top-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Reply">↩️</button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Pin">📌</button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Delete">🗑️</button>
                  </div>
                </div>
                {isOwn && (
                  <Image
                    src={msg.profiles?.avatar_url || '/default-avatar.png'}
                    alt={msg.profiles?.full_name || 'User avatar'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full ml-2"
                    unoptimized
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className={`p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl ${isMobile ? 'fixed bottom-0 left-0 w-full z-50 pb-[env(safe-area-inset-bottom)]' : ''}`}
        style={isMobile ? { touchAction: 'manipulation' } : {}}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Attachment Icon (UI only) */}
          <button
            type="button"
            className="p-2 min-w-[44px] min-h-[44px] rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 shadow"
            title="Attach file (coming soon)"
            aria-label="Attach file (coming soon)"
            disabled
          >
            <PaperClipIcon className="w-6 h-6" />
          </button>
          {/* Message Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={`Message ${chatName}…`}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            disabled={isLoading}
            aria-label="Message input"
            style={{ fontSize: '16px' }}
          />
          {showMentions && filteredMembers.length > 0 && (
            <ul className="absolute bottom-14 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-64 max-h-48 overflow-y-auto">
              {filteredMembers.map((m, idx) => (
                <li
                  key={m.id}
                  className={`px-4 py-2 cursor-pointer ${idx === mentionIndex ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                  onMouseDown={() => insertMention(m.name)}
                >
                  @{m.name}
                </li>
              ))}
            </ul>
          )}
          {/* Send Button */}
          <button
            type="submit"
            className="p-2 min-w-[44px] min-h-[44px] rounded-full bg-blue-500 hover:bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150 shadow-lg"
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            <ArrowUpCircleIcon className="w-6 h-6" />
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by inCommand • For emergencies, contact control room.
        </div>
      </div>
    </div>
  );
};

export default CommunityChat; 
