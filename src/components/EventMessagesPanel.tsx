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

// Main Panel component
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
                onClick={() => setShowSidebarMobile(true)}
                aria-label="Back to groups"
                style={{ fontSize: '18px' }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M15 18l-6-6 6-6" /></svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <span className="font-bold text-lg ml-2 flex-1 truncate">
                {selectedChat === 'ai' ? 'AI Chatbot' : 
                 uniqueCommunityChats.find(c => c.id === selectedChat)?.name || 
                 CHAT_LIST.find(c => c.key === selectedChat)?.label || 'Unknown'}
              </span>
            </div>
          )}
          
          {/* Chat Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {selectedChat === 'ai' ? (
              <AIChat isVisible={true} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 p-8">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-blue-200 dark:text-blue-800" />
                <div className="text-xl font-semibold mb-2">Community Chat</div>
                <div className="text-sm">Group chat functionality coming soon!</div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default EventMessagesPanel; 