import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BuildingOffice2Icon, UsersIcon, CpuChipIcon, ArrowUpCircleIcon, PaperClipIcon, ChatBubbleLeftRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { TicketIcon, UserGroupIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import Toast, { useToast, ToastMessage } from './Toast';

interface EventMessagesPanelProps {
  eventName: string;
  CHAT_LIST: { key: string; label: string; icon: string; pinned?: boolean }[];
  selectedChat: string;
  setSelectedChat: (key: string) => void;
  showSidebarMobile: boolean;
  setShowSidebarMobile: (show: boolean) => void;
  isMobile: boolean;
  AIChat: React.ComponentType<{ isVisible: boolean }>;
}

interface CommunityChatProps {
  chatId: string;
  chatName: string;
  addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
  isMobile: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  handleInputFocus?: () => void;
  handleInputBlur?: () => void;
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
          setMessages(result.data || []);
          // Toast for new message (if not from current user)
          if (addToast && result.data && result.data.length > 0) {
            const lastMsg = result.data[result.data.length - 1];
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
                onClick: jumpToMessage,
                meta: { messageId: lastMsg.id },
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

  // Focus input when chat becomes visible
  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatId]);

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
          inputRef.current.focus();
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
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 rounded-t-lg">
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
            <img
              key={m.id}
              src={m.avatar_url || '/icon.png'}
              alt={m.name}
              className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 shadow"
              title={m.name}
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
                <img src={m.avatar_url || '/icon.png'} alt={m.name} className="w-5 h-5 rounded-full" />
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
                  <img
                    src={msg.profiles?.avatar_url || '/default-avatar.png'}
                    alt={msg.profiles?.full_name}
                    className="w-8 h-8 rounded-full"
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
                  <img
                    src={msg.profiles?.avatar_url || '/default-avatar.png'}
                    alt={msg.profiles?.full_name}
                    className="w-10 h-10 rounded-full mr-2"
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
                  <img
                    src={msg.profiles?.avatar_url || '/default-avatar.png'}
                    alt={msg.profiles?.full_name}
                    className="w-10 h-10 rounded-full ml-2"
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
            style={isMobile ? { fontSize: 16 } : {}} // extra safety for iOS
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
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 min-w-[44px] min-h-[44px] rounded-full bg-[#2A3990] text-white dark:bg-white dark:text-[#2A3990] hover:bg-[#1e2a6a] dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A3990] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-lg text-lg"
            aria-label="Send message"
          >
            <ArrowUpCircleIcon className="w-7 h-7" />
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by inCommand • For emergencies, contact control room.
        </div>
      </div>
    </div>
  );
};

const EventMessagesPanel: React.FC<EventMessagesPanelProps> = ({
  eventName,
  CHAT_LIST,
  selectedChat,
  setSelectedChat,
  showSidebarMobile,
  setShowSidebarMobile,
  isMobile,
  AIChat,
}) => {
  const { messages: toastMessages, addToast, removeToast } = useToast();
  const [eventId, setEventId] = useState<string | null>(null);
  const [communityChats, setCommunityChats] = useState<{id: string, name: string, type: string}[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  // Keyboard open detection
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    let initialHeight = window.innerHeight;
    const onResize = () => {
      const heightDiff = initialHeight - window.innerHeight;
      setKeyboardOpen(heightDiff > 150); // 150px threshold
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMobile]);

  // Pass focus/blur handlers to input
  const handleInputFocus = () => { if (isMobile) setKeyboardOpen(true); };
  const handleInputBlur = () => { if (isMobile) setKeyboardOpen(false); };

  // Fetch eventId from eventName
  useEffect(() => {
    async function fetchEventId() {
      setError(null);
      setLoadingChats(true);
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('event_name', eventName)
        .single();
      if (error || !data) {
        setError('Could not find event');
        setEventId(null);
        setCommunityChats([]);
        setLoadingChats(false);
        return;
      }
      setEventId(data.id);
      setLoadingChats(false);
    }
    if (eventName && eventName !== 'Current Event') {
      fetchEventId();
    }
  }, [eventName]);

  // Fetch community chats for eventId
  useEffect(() => {
    async function fetchChats() {
      if (!eventId) return;
      setLoadingChats(true);
      setError(null);
      const { data, error } = await supabase
        .from('event_chats')
        .select('id, name, type')
        .eq('event_id', eventId);
      if (error) {
        setError('Could not fetch community chats');
        setCommunityChats([]);
      } else {
        setCommunityChats(data || []);
      }
      setLoadingChats(false);
    }
    if (eventId) fetchChats();
  }, [eventId]);

  // Remove duplicate community chats by name+type
  const uniqueCommunityChats = Array.from(
    new Map(communityChats.map(chat => [chat.name + chat.type, chat])).values()
  );

  return (
    <div className={`flex-1 flex ${isMobile ? 'flex-col min-h-[100dvh]' : ''} h-full`} style={isMobile ? { minHeight: '100dvh' } : {}}>
      {/* Toast Notifications */}
      <Toast messages={toastMessages} onRemove={removeToast} />
      {/* Sidebar (Group List) */}
      {(!isMobile || showSidebarMobile) && (
        <aside className={`w-full md:w-60 bg-white dark:bg-[#232c43] border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col shadow-2xl z-10 transition-all duration-200 ${isMobile ? 'rounded-t-2xl' : 'rounded-l-2xl'} overflow-hidden`} aria-label="Chat sidebar">
          {/* Sticky Event Header */}
          <div className="sticky top-0 z-20 bg-white dark:bg-[#232c43] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100 flex-1 truncate">{eventName !== 'Current Event' ? eventName : 'Event'}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">LIVE</span>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700" />
          {/* Sidebar scrollable area */}
          <nav className="flex-1 flex flex-col overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {/* Main Groups Section */}
            <div>
              <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">MAIN GROUPS</div>
              {CHAT_LIST.map(chat => {
                let Icon = CpuChipIcon;
                if (chat.key === 'company') Icon = BuildingOffice2Icon;
                if (chat.key === 'team') Icon = UsersIcon;
                if (chat.key === 'ai') Icon = CpuChipIcon;
                return (
                  <button
                    key={chat.key}
                    className={`group flex items-center gap-3 px-4 py-3 text-left focus:outline-none transition-all duration-150 relative
                      ${selectedChat === chat.key ? 'bg-blue-50 dark:bg-[#1e2a6a] border-l-4 border-[#2A3990] dark:border-blue-400 shadow-lg' : 'hover:bg-blue-50 dark:hover:bg-[#232c43]'}
                      ${selectedChat === chat.key ? 'font-bold text-[#2A3990] dark:text-blue-200' : 'text-gray-700 dark:text-gray-200'}
                    `}
                    onClick={() => { setSelectedChat(chat.key); if (isMobile) setShowSidebarMobile(false); }}
                    aria-label={chat.label}
                    tabIndex={0}
                    title={chat.label}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="flex-1 truncate">{chat.label}</span>
                    {chat.pinned && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300">PINNED</span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Community Groups Section */}
            <div className="mt-4">
              <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">COMMUNITY GROUPS</div>
              <div className="flex flex-col bg-white dark:bg-[#232c43] rounded-2xl shadow-md overflow-hidden">
                {loadingChats && <div className="pl-8 text-xs text-gray-400">Loading...</div>}
                {error && <div className="pl-8 text-xs text-red-500">{error}</div>}
                <ul className="flex flex-col gap-1 pl-8 pr-2 pb-3">
                  {uniqueCommunityChats.map((chat) => {
                    let Icon = UsersIcon;
                    if (/senior management team|smt/i.test(chat.name)) Icon = UserGroupIcon;
                    else if (/supervisors?/i.test(chat.name)) Icon = ShieldCheckIcon;
                    else if (/issues?/i.test(chat.name)) Icon = ExclamationTriangleIcon;
                    return (
                      <li key={chat.id}>
                        <button
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2
                            ${selectedChat === chat.id
                              ? 'bg-blue-50 dark:bg-blue-900 font-bold text-[#2A3990] dark:text-blue-200 shadow'
                              : 'hover:bg-blue-50 dark:hover:bg-blue-800 text-gray-800 dark:text-gray-200'}
                          `}
                          onClick={() => { setSelectedChat(chat.id); if (isMobile) setShowSidebarMobile(false); }}
                        >
                          <Icon className="w-5 h-5 text-blue-400" />
                          <span>{chat.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </nav>
          {/* + Add Group Button */}
          <div className="mt-auto p-4">
            <button
              className="flex items-center justify-center w-full py-2 text-gray-400 hover:text-blue-500 disabled:opacity-50"
              disabled
              aria-label="Add Group (coming soon)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="ml-2">Add Group</span>
            </button>
          </div>
        </aside>
      )}
      {/* Chat Area */}
      {(!isMobile || !showSidebarMobile) && (
        <main className="flex flex-col h-full bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-[#232c43] shadow-2xl rounded-r-2xl md:rounded-l-none overflow-hidden relative">
          {/* Top bar with back button on mobile */}
          {isMobile && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-20">
              <button
                className="flex items-center gap-1 text-blue-700 dark:text-blue-300 text-lg font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900 focus:outline-none"
                onClick={() => setShowDrawer(true)}
                aria-label="Back to groups"
                style={{ fontSize: '18px' }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M15 18l-6-6 6-6" /></svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <span className="font-bold text-lg ml-2 flex-1 truncate">{uniqueCommunityChats.find(c => c.id === selectedChat)?.name || 'Unknown'}</span>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {selectedChat === 'ai' ? (
              <AIChat isVisible={true} />
            ) : (
              <CommunityChat
                chatId={selectedChat}
                chatName={uniqueCommunityChats.find(c => c.id === selectedChat)?.name || 'Unknown'}
                addToast={addToast}
                isMobile={isMobile}
                inputRef={inputRef}
                handleInputFocus={handleInputFocus}
                handleInputBlur={handleInputBlur}
              />
            )}
          </div>
          {/* 4. Member list modal (mobile) */}
          {isMobile && showMembersModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-40">
              <div className="w-full sm:w-96 bg-white dark:bg-gray-900 rounded-t-2xl p-4 shadow-lg animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Group Members</span>
                  <button onClick={() => setShowMembersModal(false)} aria-label="Close members modal" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {/* ...render member list here... */}
              </div>
            </div>
          )}
        </main>
      )}
      {/* Mobile Drawer */}
      {isMobile && showDrawer && (
        <div className="fixed left-0 w-full z-50 top-[64px] h-[calc(100vh-64px)]">
          {/* Overlay */}
          <div
            className="fixed left-0 w-full bg-black bg-opacity-40 z-50 transition-opacity duration-200 top-[64px] h-[calc(100vh-64px)]"
            onClick={() => setShowDrawer(false)}
            aria-label="Close chat drawer"
            tabIndex={-1}
          />
          {/* Drawer */}
          <aside
            className="fixed left-0 w-4/5 max-w-xs bg-white dark:bg-[#232c43] border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl z-50 transition-transform duration-300 transform translate-x-0 overflow-y-auto p-4 top-[64px] h-[calc(100vh-64px)]"
            aria-label="Chat sidebar drawer"
          >
            {/* Sidebar content (copied from desktop sidebar) */}
            <div className="sticky top-0 z-20 bg-white dark:bg-[#232c43] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
              <TicketIcon className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100 flex-1 truncate">{eventName !== 'Current Event' ? eventName : 'Event'}</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">LIVE</span>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700" />
            {/* Sidebar scrollable area */}
            <nav className="flex-1 flex flex-col overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {/* Main Groups Section */}
              <div>
                <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">MAIN GROUPS</div>
                {CHAT_LIST.map(chat => {
                  let Icon = CpuChipIcon;
                  if (chat.key === 'company') Icon = BuildingOffice2Icon;
                  if (chat.key === 'team') Icon = UsersIcon;
                  if (chat.key === 'ai') Icon = CpuChipIcon;
                  return (
                    <button
                      key={chat.key}
                      className={`group flex items-center gap-3 px-4 py-3 text-left focus:outline-none transition-all duration-150 relative
                        ${selectedChat === chat.key ? 'bg-blue-50 dark:bg-[#1e2a6a] border-l-4 border-[#2A3990] dark:border-blue-400 shadow-lg' : 'hover:bg-blue-50 dark:hover:bg-[#232c43]'}
                        ${selectedChat === chat.key ? 'font-bold text-[#2A3990] dark:text-blue-200' : 'text-gray-700 dark:text-gray-200'}
                      `}
                      onClick={() => { setSelectedChat(chat.key); setShowDrawer(false); }}
                      aria-label={chat.label}
                      tabIndex={0}
                      title={chat.label}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="flex-1 truncate">{chat.label}</span>
                      {chat.pinned && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300">PINNED</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Community Groups Section */}
              <div className="mt-4">
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">COMMUNITY GROUPS</div>
                <div className="flex flex-col bg-white dark:bg-[#232c43] rounded-2xl shadow-md overflow-hidden">
                  {loadingChats && <div className="pl-8 text-xs text-gray-400">Loading...</div>}
                  {error && <div className="pl-8 text-xs text-red-500">{error}</div>}
                  <ul className="flex flex-col gap-1 pl-8 pr-2 pb-3">
                    {uniqueCommunityChats.map((chat) => {
                      let Icon = UsersIcon;
                      if (/senior management team|smt/i.test(chat.name)) Icon = UserGroupIcon;
                      else if (/supervisors?/i.test(chat.name)) Icon = ShieldCheckIcon;
                      else if (/issues?/i.test(chat.name)) Icon = ExclamationTriangleIcon;
                      return (
                        <li key={chat.id}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2
                              ${selectedChat === chat.id
                                ? 'bg-blue-50 dark:bg-blue-900 font-bold text-[#2A3990] dark:text-blue-200 shadow'
                                : 'hover:bg-blue-50 dark:hover:bg-blue-800 text-gray-800 dark:text-gray-200'}
                            `}
                            onClick={() => { setSelectedChat(chat.id); setShowDrawer(false); }}
                          >
                            <Icon className="w-5 h-5 text-blue-400" />
                            <span>{chat.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </nav>
            {/* Close button for accessibility */}
            <button
              className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowDrawer(false)}
              aria-label="Close drawer"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

function getGroupInfoTooltip(name: string) {
  if (name.toLowerCase().includes('smt')) return 'Only SMT members can see this group.';
  if (name.toLowerCase().includes('supervisor')) return 'Only supervisors can see this group.';
  if (name.toLowerCase().includes('community')) return 'All event members can see this group.';
  return 'Group visibility depends on your role.';
}

export default EventMessagesPanel; 