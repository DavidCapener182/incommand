"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FaRobot, FaUsers, FaShieldAlt, FaExclamationCircle, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AIChat from './AIChat';
import { useSession } from '@supabase/auth-helpers-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { VoiceMessageBubble } from '@/components/ui/VoiceMessageBubble';
import { useSearchParams } from 'next/navigation';

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
  voice_url?: string;
  duration?: number;
  message_type?: 'text' | 'voice';
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

interface EventMessagesPanelProps {
  eventId?: string | null;
  eventName?: string;
  AIChat?: React.ComponentType<{ isVisible: boolean }>;
  mode?: 'list' | 'chat' | 'combined';
  activeThreadId?: string | null;
  onOpenThread?: (id: string) => void;
  onBackMobile?: () => void;
}

const EventMessagesPanel: React.FC<EventMessagesPanelProps> = ({
  eventId,
  eventName,
  AIChat,
  mode = 'combined',
  activeThreadId,
  onOpenThread,
  onBackMobile,
}) => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [communityGroups, setCommunityGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ai');
  const [messagesByGroup, setMessagesByGroup] = useState<{ [groupId: string]: Message[] }>({});
  const [inputValue, setInputValue] = useState('');
  const [profiles, setProfiles] = useState<{ [userId: string]: Profile }>({});
  const session = useSession();
  const currentUserId = session?.user?.id;
  const searchParams = useSearchParams();
  const [mobileActive, setMobileActive] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  
  // Voice recording functionality
  const {
    recordingState,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecording();

  // Set or fetch current event based on provided props
  useEffect(() => {
    let isMounted = true;
    async function ensureEvent() {
      if (eventId || eventName) {
        const composed: Event = {
          id: eventId || 'current',
          event_name: eventName || 'Current Event',
        } as Event;
        if (isMounted) setCurrentEvent(composed);
        // If we have an id but no name, optionally fetch name by id
        if (eventId && !eventName) {
          const { data } = await supabase
            .from('events')
            .select('id, event_name')
            .eq('id', eventId)
            .single<Event>();
          if (isMounted && data) setCurrentEvent(data);
        }
        return;
      }
      // Fallback: fetch the current event from Supabase
      const { data } = await supabase
        .from('events')
        .select('id, event_name')
        .eq('is_current', true)
        .single<Event>();
      if (isMounted && data) setCurrentEvent(data);
    }
    ensureEvent();
    return () => { isMounted = false; };
  }, [eventId, eventName]);

  // Fetch community groups for the event
  useEffect(() => {
    if (!currentEvent) return;
    async function fetchGroups() {
      const { data } = await supabase
        .from('event_chats')
        .select('id, name, type')
        .eq('event_id', currentEvent?.id ?? '');
      if (data) {
        setCommunityGroups(data as Group[]);
      }
    }
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent]);

  // Open thread from query string on load
  useEffect(() => {
    const thread = searchParams?.get('thread');
    if (thread) {
      setSelectedGroup(thread);
      setMobileActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch messages from Supabase for selected group
  const fetchMessages = useCallback(async () => {
    if (selectedGroup === 'ai') return;
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
  }, [selectedGroup]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
          data.forEach((p: any) => {
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
    const { error } = await (supabase as any)
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

  const handleVoiceMessage = useCallback(async (voiceData: { url: string; duration: number }) => {
    if (!currentUserId || !selectedGroup) return;

    try {
      // Send voice message to the database
      const { error } = await supabase
        .from('event_chat_messages')
        .insert({
          group_id: selectedGroup,
          sender: currentUserId,
          text: '', // Voice messages have empty text
          voice_url: voiceData.url,
          duration: voiceData.duration,
          message_type: 'voice'
        } as any);

      if (error) {
        console.error('Error sending voice message:', error);
        return;
      }

      // Clear input and refresh messages
      setInputValue('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  }, [currentUserId, selectedGroup, fetchMessages]);

  // Handle voice recording completion
  useEffect(() => {
    if (recordingState === 'idle' && recordingDuration > 0) {
      // Voice recording completed, send the message
      handleVoiceMessage({
        url: '', // This will be set by the useVoiceRecording hook
        duration: Math.round(recordingDuration / 1000)
      });
    }
  }, [recordingState, recordingDuration, handleVoiceMessage]);

  // Find selected group meta
  const selectedGroupMeta =
    selectedGroup === 'ai'
      ? { icon: <FaRobot />, label: 'AI Chatbot', key: 'ai' }
      : getGroupMeta(
          communityGroups.find((g) => g.id === selectedGroup) || {}
  );

  // LIST MODE ONLY
  if (mode === 'list') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="sticky top-0 z-10 bg-white border-b p-3">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">●</span>
            <span className="truncate">{currentEvent?.event_name || 'Current Event'}</span>
            <span className="ml-auto text-xs text-emerald-600 font-medium">LIVE</span>
          </div>
          <div className="mt-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search conversations"
              placeholder="Search"
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversation list">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500">Main</div>
          <ul className="divide-y">
            {mainGroups
              .filter(g => g.label.toLowerCase().includes(query.toLowerCase()))
              .map((group) => (
                <li key={group.key}>
                  <button
                    role="option"
                    aria-selected={selectedGroup === group.key}
                    onClick={() => { setSelectedGroup(group.key); setMobileActive(true); onOpenThread && onOpenThread(group.key); }}
                    className={`w-full flex items-center gap-2 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedGroup === group.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
                  >
                    <span className="text-slate-600">{group.icon}</span>
                    <span className="truncate font-medium">{group.label}</span>
                    {group.pinned && <span className="ml-auto text-[10px] text-amber-600">PINNED</span>}
                  </button>
                </li>
              ))}
          </ul>
          <div className="px-3 py-2 text-xs font-semibold text-slate-500">Community</div>
          <ul className="divide-y">
            {communityGroups
              .filter((g) => (g.name || '').toLowerCase().includes(query.toLowerCase()))
              .map((group) => {
                const meta = getGroupMeta(group);
                const unread = 0;
                return (
                  <li key={meta.key}>
                    <button
                      role="option"
                      aria-selected={selectedGroup === group.id}
                      onClick={() => { setSelectedGroup(group.id); setMobileActive(true); onOpenThread && onOpenThread(group.id); }}
                      className={`w-full flex items-center gap-2 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedGroup === group.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-slate-600">{meta.icon}</span>
                      <span className="truncate font-medium">{meta.label}</span>
                      {unread > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] px-2 py-0.5">{unread}</span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    );
  }

  // CHAT MODE ONLY
  if (mode === 'chat') {
    const threadId = activeThreadId ?? selectedGroup;
    if (!threadId) {
      return (
        <div className="h-full w-full flex items-center justify-center text-sm text-slate-500">
          Select a conversation
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full min-h-0">
        {threadId === 'ai' ? (
          <div className="flex-1 min-h-0 overflow-y-auto" role="log" aria-live="polite">
            {AIChat ? <AIChat isVisible={true} /> : null}
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3" role="log" aria-live="polite">
              {(messagesByGroup[threadId] || []).map((msg) => {
                const profile = profiles[msg.sender];
                const isCurrentUser = msg.sender === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${isCurrentUser ? 'ml-auto rounded-2xl rounded-br-sm bg-blue-50' : 'mr-auto rounded-2xl rounded-bl-sm bg-slate-50'} max-w-[72%] px-3 py-2`}>
                      {msg.message_type === 'voice' && msg.voice_url ? (
                        <VoiceMessageBubble
                          url={msg.voice_url}
                          duration={msg.duration || 0}
                          senderName={profile?.full_name || msg.sender}
                          timestamp={msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          isOwnMessage={isCurrentUser}
                        />
                      ) : (
                        <div className="text-slate-700">{msg.text}</div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">
                        {msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t p-3 flex items-center gap-2">
              <button type="button" aria-label="Attach file" className="px-2 py-1 rounded-lg border text-slate-600 cursor-not-allowed" disabled>
                📎
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                onMouseDown={!isRecording ? startRecording : undefined}
                onMouseUp={isRecording ? stopRecording : undefined}
                onMouseLeave={isRecording ? cancelRecording : undefined}
                onTouchStart={!isRecording ? startRecording : undefined}
                onTouchEnd={isRecording ? stopRecording : undefined}
                className={`rounded-full w-10 h-10 flex items-center justify-center text-white ${isRecording ? 'bg-red-500' : 'bg-blue-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                title={isRecording ? 'Release to stop recording' : 'Hold to record voice message'}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              {isRecording && (
                <div className="text-sm font-semibold text-red-500">Recording... {Math.floor(recordingDuration / 1000)}s</div>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a message..."
                aria-label="Message input"
                className="flex-1 min-w-0 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSend} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Send message">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // DEFAULT COMBINED MODE (existing behavior)
  return (
    <div className={`card-depth grid grid-cols-1 ${sidebarOpen ? 'md:grid-cols-[200px_minmax(0,1fr)]' : 'md:grid-cols-1'} h-full min-h-0 overflow-hidden`}>
      {/* Sidebar */}
      <aside id="messages-sidebar" className={`hidden md:flex ${!sidebarOpen ? 'md:hidden' : ''} flex-col border-r bg-white`} aria-label="Conversations Sidebar">
        <div className="sticky top-0 z-10 bg-white border-b p-3">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">●</span>
            <span className="truncate">{currentEvent?.event_name || 'Current Event'}</span>
            <span className="ml-auto text-xs text-emerald-600 font-medium">LIVE</span>
          </div>
          <div className="mt-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search conversations"
              placeholder="Search"
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversation list">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500">Main</div>
          <ul className="divide-y">
            {mainGroups
              .filter(g => g.label.toLowerCase().includes(query.toLowerCase()))
              .map((group) => (
                <li key={group.key} className="">
                  <button
                    role="option"
                    aria-selected={selectedGroup === group.key}
                    onClick={() => { setSelectedGroup(group.key); setMobileActive(true); }}
                    className={`w-full flex items-center gap-2 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedGroup === group.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
                  >
                    <span className="text-slate-600">{group.icon}</span>
                    <span className="truncate font-medium">{group.label}</span>
                    {group.pinned && <span className="ml-auto text-[10px] text-amber-600">PINNED</span>}
                  </button>
                </li>
              ))}
          </ul>
          <div className="px-3 py-2 text-xs font-semibold text-slate-500">Community</div>
          <ul className="divide-y">
            {communityGroups
              .filter((g) => (g.name || '').toLowerCase().includes(query.toLowerCase()))
              .map((group) => {
                const meta = getGroupMeta(group);
                const unread = 0;
                return (
                  <li key={meta.key}>
                    <button
                      role="option"
                      aria-selected={selectedGroup === group.id}
                      onClick={() => { setSelectedGroup(group.id); setMobileActive(true); }}
                      className={`w-full flex items-center gap-2 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedGroup === group.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-slate-600">{meta.icon}</span>
                      <span className="truncate font-medium">{meta.label}</span>
                      {unread > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] px-2 py-0.5">{unread}</span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </aside>

      {/* Mobile: List or Chat */}
      <div className="md:hidden flex flex-col">
        {!mobileActive ? (
          <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversation list">
            <div className="sticky top-0 z-10 bg-white border-b p-3">
              <div className="text-sm font-semibold text-slate-800">Messages</div>
              <div className="mt-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search conversations"
                  placeholder="Search"
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <ul className="divide-y">
              {mainGroups
                .filter(g => g.label.toLowerCase().includes(query.toLowerCase()))
                .map((group) => (
                  <li key={group.key}>
                    <button
                      role="option"
                      aria-selected={selectedGroup === group.key}
                      onClick={() => { setSelectedGroup(group.key); setMobileActive(true); }}
                      className="w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="text-slate-600">{group.icon}</span>
                      <span className="truncate font-medium">{group.label}</span>
                    </button>
                  </li>
                ))}
              {communityGroups
                .filter((g) => (g.name || '').toLowerCase().includes(query.toLowerCase()))
                .map((group) => {
                  const meta = getGroupMeta(group);
                  return (
                    <li key={meta.key}>
                      <button
                        role="option"
                        aria-selected={selectedGroup === group.id}
                        onClick={() => { setSelectedGroup(group.id); setMobileActive(true); }}
                        className="w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="text-slate-600">{meta.icon}</span>
                        <span className="truncate font-medium">{meta.label}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b p-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileActive(false)}
                className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Back to conversations"
              >
                Back
              </button>
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-slate-600">{selectedGroupMeta.icon}</span>
                <span>{selectedGroupMeta.label}</span>
              </div>
            </div>
            {selectedGroup === 'ai' ? (
              AIChat ? <AIChat isVisible={true} /> : null
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3" role="log" aria-live="polite">
                  {(messagesByGroup[selectedGroup] || []).map((msg) => {
                    const profile = profiles[msg.sender];
                    const isCurrentUser = msg.sender === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${isCurrentUser ? 'ml-auto rounded-2xl rounded-br-sm bg-blue-50' : 'mr-auto rounded-2xl rounded-bl-sm bg-slate-50'} max-w-[72%] px-3 py-2`}>
                          {msg.message_type === 'voice' && msg.voice_url ? (
                            <VoiceMessageBubble
                              url={msg.voice_url}
                              duration={msg.duration || 0}
                              senderName={profile?.full_name || msg.sender}
                              timestamp={msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              isOwnMessage={isCurrentUser}
                            />
                          ) : (
                            <div className="text-slate-700">{msg.text}</div>
                          )}
                          <div className="mt-1 text-xs text-slate-500">
                            {msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t p-3 flex items-center gap-2">
                  <button type="button" aria-label="Attach file" className="px-2 py-1 rounded-lg border text-slate-600 cursor-not-allowed" disabled>
                    📎
                  </button>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    onMouseDown={!isRecording ? startRecording : undefined}
                    onMouseUp={isRecording ? stopRecording : undefined}
                    onMouseLeave={isRecording ? cancelRecording : undefined}
                    onTouchStart={!isRecording ? startRecording : undefined}
                    onTouchEnd={isRecording ? stopRecording : undefined}
                    className={`rounded-full w-10 h-10 flex items-center justify-center text-white ${isRecording ? 'bg-red-500' : 'bg-blue-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    title={isRecording ? 'Release to stop recording' : 'Hold to record voice message'}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
                  </button>
                  {isRecording && (
                    <div className="text-sm font-semibold text-red-500">Recording... {Math.floor(recordingDuration / 1000)}s</div>
                  )}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Type a message..."
                    aria-label="Message input"
                    className="flex-1 min-w-0 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleSend} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Send message">
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop Chat Pane */}
      <main className="hidden md:flex flex-col bg-white min-h-0">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b p-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-controls="messages-sidebar"
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-slate-600">{selectedGroupMeta.icon}</span>
            <span>{selectedGroupMeta.label}</span>
          </div>
        </div>
        {selectedGroup === 'ai' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-0" role="log" aria-live="polite">
            {AIChat ? <AIChat isVisible={true} /> : null}
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3" role="log" aria-live="polite">
              {(messagesByGroup[selectedGroup] || []).map((msg) => {
                const profile = profiles[msg.sender];
                const isCurrentUser = msg.sender === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${isCurrentUser ? 'ml-auto rounded-2xl rounded-br-sm bg-blue-50' : 'mr-auto rounded-2xl rounded-bl-sm bg-slate-50'} max-w-[72%] px-3 py-2`}>
                      {msg.message_type === 'voice' && msg.voice_url ? (
                        <VoiceMessageBubble
                          url={msg.voice_url}
                          duration={msg.duration || 0}
                          senderName={profile?.full_name || msg.sender}
                          timestamp={msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          isOwnMessage={isCurrentUser}
                        />
                      ) : (
                        <div className="text-slate-700">{msg.text}</div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">
                        {msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t p-3 flex items-center gap-2">
              <button type="button" aria-label="Attach file" className="px-2 py-1 rounded-lg border text-slate-600 cursor-not-allowed" disabled>
                📎
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                onMouseDown={!isRecording ? startRecording : undefined}
                onMouseUp={isRecording ? stopRecording : undefined}
                onMouseLeave={isRecording ? cancelRecording : undefined}
                onTouchStart={!isRecording ? startRecording : undefined}
                onTouchEnd={isRecording ? stopRecording : undefined}
                className={`rounded-full w-10 h-10 flex items-center justify-center text-white ${isRecording ? 'bg-red-500' : 'bg-blue-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                title={isRecording ? 'Release to stop recording' : 'Hold to record voice message'}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              {isRecording && (
                <div className="text-sm font-semibold text-red-500">Recording... {Math.floor(recordingDuration / 1000)}s</div>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a message..."
                aria-label="Message input"
                className="flex-1 min-w-0 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSend} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Send message">
                Send
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EventMessagesPanel; 
