import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AIChat from './AIChat';
import { UserCircleIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, InformationCircleIcon, HomeIcon, QuestionMarkCircleIcon, NewspaperIcon, XMarkIcon, UsersIcon, CpuChipIcon, ChartBarIcon, BellIcon, Cog6ToothIcon, PlayCircleIcon, EnvelopeIcon, PhoneIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import EventMessagesPanel from './EventMessagesPanel';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'home' | 'messages' | 'help' | 'news';
  initialMessagesCategory?: 'ai' | 'team' | 'notifications' | 'tickets';
}

// Tabs are managed with state only; removed unused TABS constant

// Removed CHAT_LIST; not used

export default function HelpCenterPanel({ isOpen, onClose, initialTab, initialMessagesCategory }: HelpCenterModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('messages');
  // Removed selectedChat/showSidebarMobile; simplified messages panel
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [expandedHelpArticle, setExpandedHelpArticle] = useState<string | null>(null);
  const [expandedHelpTitle, setExpandedHelpTitle] = useState<string | null>(null);
  const topArticles = [
    { key: 'incident', title: 'Logging an Incident' },
    { key: 'evac', title: 'Evacuation Procedure' },
    { key: 'radio', title: 'Radio Protocols' },
  ];
  // Removed unused helpArticles
  const [aiChatUnread, setAIChatUnread] = useState(false);
  const [eventName, setEventName] = useState<string>('Current Event');
  const [eventId, setEventId] = useState<string | null>(null);
  // Compute news unread count on the fly from items list
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [newsFilter, setNewsFilter] = useState<'All' | 'Announcement' | 'Feature' | 'Maintenance' | 'Event'>('All');
  const [helpSearch, setHelpSearch] = useState<string>('');
  const [helpCategory, setHelpCategory] = useState<'All' | 'Getting Started' | 'Features' | 'Troubleshooting' | 'Advanced'>('All');
  const [helpLoading, setHelpLoading] = useState<boolean>(false);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);
  const [homeSearchInput, setHomeSearchInput] = useState<string>('');

  // Home/System status state
  const [systemStatusLoading, setSystemStatusLoading] = useState<boolean>(true);
  const [systemHealth, setSystemHealth] = useState<'Online' | 'Offline'>('Online');
  const [lastSync, setLastSync] = useState<string>('');
  const [activeIncidentsCount] = useState<number | null>(null);
  const [staffOnDutyCount] = useState<number | null>(null);

  // News items source used across UI and for unread badge
  const allNewsItems = useMemo(() => ([
    { type: 'Announcement' as const, title: 'New dashboard widgets', date: '2025-08-01', unread: true },
    { type: 'Feature' as const, title: 'AI Insights improvements', date: '2025-07-21', unread: false },
    { type: 'Maintenance' as const, title: 'Scheduled downtime - Sunday 02:00 UTC', date: '2025-07-28', unread: true },
    { type: 'Event' as const, title: `${eventName}: Weather alert integration`, date: '2025-07-18', unread: false },
  ]), [eventName]);
  const computedUnreadCount = useMemo(() => allNewsItems.filter(i => i.unread).length, [allNewsItems]);

  // Messages tab state
  const [messagesCategory, setMessagesCategory] = useState<'ai' | 'team' | 'notifications' | 'tickets'>('ai');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lastMessageTime = localStorage.getItem('lastAIChatMessage');
    const lastViewTime = localStorage.getItem('lastAIChatView');
    if (lastMessageTime && lastViewTime) {
      setAIChatUnread(new Date(lastMessageTime) > new Date(lastViewTime));
    } else if (lastMessageTime && !lastViewTime) {
      setAIChatUnread(true);
    } else {
      setAIChatUnread(false);
    }
  }, [activeTab, isOpen]);

  // Apply initial tab/category when opened
  useEffect(() => {
    if (!isOpen) return;
    if (initialTab) setActiveTab(initialTab);
    if (initialMessagesCategory) setMessagesCategory(initialMessagesCategory);
  }, [isOpen, initialTab, initialMessagesCategory]);

  useEffect(() => {
    if (activeTab === 'messages' && messagesCategory === 'ai' && typeof window !== 'undefined') {
      localStorage.setItem('lastAIChatView', new Date().toISOString());
      setAIChatUnread(false);
    }
  }, [activeTab, messagesCategory, isOpen]);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, event_name')
        .eq('is_current', true)
        .single();
      if (data?.event_name && data?.id) {
        setEventName(data.event_name);
        setEventId(data.id);
      } else {
        setEventName('Current Event');
        setEventId(null);
      }
    };
    fetchEvent();
  }, []);

  // Close on Escape key for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    // Simulate loading system status
    setSystemStatusLoading(true);
    const t = setTimeout(() => {
      setSystemHealth('Online');
      setLastSync(new Date().toLocaleString());
      setSystemStatusLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // Responsive helpers without SSR mismatch
  useEffect(() => {
    if (!isOpen) return;
    const updateIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.matchMedia('(max-width: 767px)').matches);
      }
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, [isOpen]);

  // Simulated loading states for Help/News lists
  useEffect(() => {
    if (activeTab !== 'help' || !isOpen) return;
    setHelpLoading(true);
    const t = setTimeout(() => setHelpLoading(false), 300);
    return () => clearTimeout(t);
  }, [activeTab, isOpen]);
  useEffect(() => {
    if (activeTab !== 'news' || !isOpen) return;
    setNewsLoading(true);
    const t = setTimeout(() => setNewsLoading(false), 300);
    return () => clearTimeout(t);
  }, [activeTab, newsFilter, isOpen]);

  return (
    <div className="flex flex-col rounded-2xl border bg-white shadow-2xl overflow-hidden h-full">
      {/* Brand bar remains */}
      <div className="px-4 pt-4 pb-3 bg-[#2A3990] text-white border-b border-white/20">
        <div className="flex items-center justify-between">
          <Image src="/inCommand.png" alt="inCommand Logo" width={120} height={48} className="h-12 w-auto" priority />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-label="Close help panel"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {/* Content */}
      <div className={`${activeTab === 'messages' ? 'flex-1 flex overflow-hidden p-0' : 'flex-1 overflow-y-auto p-0 md:p-6'} h-full`}>
          {activeTab === 'home' && (
            <>
              {/* Sticky Top Section on Mobile */}
              {isMobile ? (
                <div className="sticky top-0 z-30 p-4 pb-2">
                  {/* Welcome Card */}
                  <div className="bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 rounded-2xl shadow-md p-4 flex flex-col gap-2 items-start mb-4">
                    <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      <UserCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                      <span>Hi David!</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400 dark:text-blue-200" />
                      <span>This is inCommand technical support. How can we help?</span>
                    </div>
                    {/* Quick Action */}
                    <button onClick={() => { setActiveTab('messages'); setMessagesCategory('ai'); }} className="flex items-center gap-2 bg-[#2A3990] hover:bg-[#1e2a6a] text-white font-medium px-4 py-2 rounded-lg shadow transition">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                      <span>Send us a message</span>
                    </button>
                  </div>
                  {/* Search Bar */}
                  <form className="relative mb-2" onSubmit={(e) => { e.preventDefault(); if (homeSearchInput.trim()) { setActiveTab('help'); setHelpSearch(homeSearchInput.trim()); } }}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <MagnifyingGlassIcon className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      value={homeSearchInput}
                      onChange={(e) => setHomeSearchInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232c43] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                      placeholder="Search for help, SOPs, or FAQs..."
                      aria-label="Search help"
                    />
                    <button type="submit" className="hidden" aria-hidden="true" />
                  </form>
                  {/* Helper text */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>Tip: Try searching for &quot;evacuation&quot; or &quot;radio&quot;.</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex flex-col gap-4">
                  {/* Welcome Card */}
                  <div className="bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 rounded-2xl shadow-md p-6 flex flex-col gap-2 items-start">
                    <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      <UserCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                      <span>Hi David!</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400 dark:text-blue-200" />
                      <span>This is inCommand technical support. How can we help?</span>
                    </div>
                    {/* Quick Action */}
                    <button onClick={() => { setActiveTab('messages'); setMessagesCategory('ai'); }} className="flex items-center gap-2 bg-[#2A3990] hover:bg-[#1e2a6a] text-white font-medium px-4 py-2 rounded-lg shadow transition">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                      <span>Send us a message</span>
                    </button>
                  </div>
                  {/* Search Bar */}
                  <form className="relative mt-2" onSubmit={(e) => { e.preventDefault(); if (homeSearchInput.trim()) { setActiveTab('help'); setHelpSearch(homeSearchInput.trim()); } }}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <MagnifyingGlassIcon className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      value={homeSearchInput}
                      onChange={(e) => setHomeSearchInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232c43] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                      placeholder="Search for help, SOPs, or FAQs..."
                      aria-label="Search help"
                    />
                    <button type="submit" className="hidden" aria-hidden="true" />
                  </form>
                  {/* Helper text */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>Tip: Try searching for &quot;evacuation&quot; or &quot;radio&quot;.</span>
                  </div>
                </div>
              )}
              {/* Quick Actions Grid */}
              <div className={`${isMobile ? 'p-4 pt-0' : 'px-6'} mt-2`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 shadow hover:shadow-lg hover:scale-[1.01] transition focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Report Incident" onClick={() => {
                    try {
                      const ev = new CustomEvent('openNewIncidentModal');
                      window.dispatchEvent(ev);
                    } catch {}
                  }}>
                    <ExclamationTriangleIcon className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                    <div className="text-left">
                      <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">Report Incident</div>
                      <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300">Log a new incident quickly</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 shadow hover:shadow-lg hover:scale-[1.01] transition focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="View Analytics" onClick={() => { try { router.push('/analytics'); } catch {} }}>
                    <ChartBarIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                    <div className="text-left">
                      <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">View Analytics</div>
                      <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300">See trends & insights</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 shadow hover:shadow-lg hover:scale-[1.01] transition focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="System Status">
                    <CpuChipIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                    <div className="text-left">
                      <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">System Status</div>
                      <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300">Health & uptime</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 shadow hover:shadow-lg hover:scale-[1.01] transition focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Staff Directory" onClick={() => { try { router.push('/staff'); } catch {} }}>
                    <UsersIcon className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                    <div className="text-left">
                      <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">Staff Directory</div>
                      <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300">Find team contacts</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* System Status Indicators (no fake counts) */}
              <div className={`${isMobile ? 'p-4' : 'px-6'} mt-2`}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className={`rounded-xl p-3 md:p-4 bg-white/70 dark:bg-[#232c43]/80 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 shadow ${systemStatusLoading ? 'animate-pulse' : ''}`}>
                      {i === 0 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">System</div>
                          <div className="mt-1 text-sm md:text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <span className={systemHealth === 'Online' ? 'text-emerald-500' : 'text-red-500'}>●</span>
                            {systemStatusLoading ? '—' : systemHealth}
                          </div>
                        </div>
                      )}
                      {i === 1 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">Last Sync</div>
                           <div className="mt-1 text-[11px] md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{systemStatusLoading ? '—' : (lastSync || 'Not connected')}</div>
                        </div>
                      )}
                      {i === 2 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">Status Notes</div>
                          <div className="mt-1 text-[11px] md:text-sm text-gray-700 dark:text-gray-300">All systems nominal</div>
                        </div>
                      )}
                      {i === 3 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">Active Incidents</div>
                           <div className="mt-1 text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">{systemStatusLoading ? '—' : (activeIncidentsCount ?? 'Not connected')}</div>
                        </div>
                      )}
                      {i === 4 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">Staff on Duty</div>
                           <div className="mt-1 text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">{systemStatusLoading ? '—' : (staffOnDutyCount ?? 'Not connected')}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top SOPs/FAQs */}
              <div className={`mt-4 ${isMobile ? 'p-4 pt-0' : ''}`} style={isMobile ? { maxHeight: 'calc(100dvh - 320px)', overflowY: 'auto' } : {}}>
                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Top SOPs & FAQs</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {topArticles.map(article => (
                    <button
                      key={article.key}
                      className="bg-white/70 dark:bg-[#232c43]/80 backdrop-blur-md border border-white/40 dark:border-gray-600/40 rounded-xl shadow-lg min-h-[100px] flex flex-row items-center gap-3 p-4 text-left transition-all duration-200 focus:outline-none hover:scale-[1.02] hover:shadow-2xl hover:ring-2 hover:ring-blue-200/30 focus:ring-2 focus:ring-blue-400"
                      onClick={() => setExpandedArticle(article.key)}
                      style={{height: '100%'}}
                    >
                      <DocumentTextIcon className="w-6 h-6 text-blue-500 dark:text-blue-300 flex-shrink-0" />
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{article.title}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-300 mt-1">Step-by-step guidance and best practices</span>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Divider and Browse all */}
                <div className="my-6 border-t border-gray-200 dark:border-gray-700" />
                <button className="text-blue-700 dark:text-blue-300 font-medium hover:underline text-sm mt-2 flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4 text-blue-400 dark:text-blue-200" />
                  Browse all articles
                </button>
              </div>
              {/* Expanded Article View */}
              {expandedArticle && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white/90 dark:bg-[#232c43]/90 supports-[backdrop-filter]:backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full p-8 md:p-10 relative flex flex-col items-center border border-white/40 dark:border-gray-600/40">
                    <button
                      className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setExpandedArticle(null)}
                    >
                      <svg className="h-5 w-5 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">
                      {topArticles.find(a => a.key === expandedArticle)?.title}
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 text-center">[Article content coming soon]</div>
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'messages' && (
            <div className="flex-1 min-h-0 p-0">
              <EventMessagesPanel
                eventId={eventId}
                eventName={eventName}
                AIChat={AIChat}
              />
            </div>
          )}
          {activeTab === 'help' && (
              <div className="p-6 flex flex-col gap-4">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Help Center</div>
                {/* Search Bar */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232c43] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                  placeholder="Search Getting Started, Features, Troubleshooting..."
                />
                {/* Autocomplete suggestions */}
                {helpSearch.trim().length > 0 && (
                  <div className="absolute mt-1 left-0 right-0 z-20 rounded-lg bg-white/95 dark:bg-[#232c43]/95 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 shadow-lg max-h-56 overflow-auto">
                    {(() => {
                      const q = helpSearch.trim().toLowerCase();
                      const catalog: { category: 'Getting Started' | 'Features' | 'Troubleshooting' | 'Advanced'; items: string[]; key: string }[] = [
                        { category: 'Getting Started', items: ['Setup your first event','Invite your team','Configure notifications'], key: 'getting-started' },
                        { category: 'Features', items: ['AI Insights','Predictive Alerts','Incident Logging'], key: 'features' },
                        { category: 'Troubleshooting', items: ['Cannot log in','Notifications not received','Sync issues'], key: 'troubleshooting' },
                        { category: 'Advanced', items: ['Role-based permissions','Custom risk weights','Offline sync'], key: 'advanced' },
                      ];
                      const filtered = catalog
                        .filter(c => helpCategory === 'All' || c.category === helpCategory)
                        .flatMap(c => c.items
                          .map((title, idx) => ({ title, category: c.category, idx, key: `${c.key}-${idx}` }))
                          .filter(x => x.title.toLowerCase().includes(q))
                        )
                        .slice(0, 8);
                      if (filtered.length === 0) {
                        return <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No suggestions</div>;
                      }
                      return filtered.map(s => (
                        <button key={s.key} onClick={() => { setExpandedHelpArticle(s.key); setExpandedHelpTitle(s.title); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-white/10 flex items-center justify-between">
                          <span className="text-sm text-gray-800 dark:text-gray-200">{s.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 border border-white/40 dark:border-gray-600/40 text-gray-600 dark:text-gray-300">{s.category}</span>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
              {/* Category filter chips */}
              <div className="flex items-center gap-2 text-xs">
                {(['All','Getting Started','Features','Troubleshooting','Advanced'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHelpCategory(c)}
                    className={`px-2 py-1 rounded-full border supports-[backdrop-filter]:backdrop-blur transition ${helpCategory === c ? 'bg-white/40 dark:bg-white/10 border-white/40 dark:border-gray-600/40 text-gray-800 dark:text-gray-200' : 'bg-white/20 dark:bg-white/5 border-white/30 dark:border-gray-600/30 text-gray-700 dark:text-gray-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {/* Sections */}
              {helpLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><HomeIcon className="w-5 h-5" /> Getting Started</div>
                      <div className="flex flex-col gap-2">
                          {(() => {
                            const items = ['Setup your first event','Invite your team','Configure notifications'].filter(t => t.toLowerCase().includes(helpSearch.trim().toLowerCase()));
                            return items.length > 0 ? items.map((t, idx) => (
                              <button key={t} onClick={() => { setExpandedHelpArticle('getting-started-' + idx); setExpandedHelpTitle(t); }} className="text-left px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 hover:shadow transition">
                                {t}
                              </button>
                            )) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400">No matches</div>
                            );
                          })()}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><CpuChipIcon className="w-5 h-5" /> Features</div>
                      <div className="flex flex-col gap-2">
                          {(() => {
                            const items = ['AI Insights','Predictive Alerts','Incident Logging'].filter(t => t.toLowerCase().includes(helpSearch.trim().toLowerCase()));
                            return items.length > 0 ? items.map((t, idx) => (
                              <button key={t} onClick={() => { setExpandedHelpArticle('features-' + idx); setExpandedHelpTitle(t); }} className="text-left px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 hover:shadow transition">
                                {t}
                              </button>
                            )) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400">No matches</div>
                            );
                          })()}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" /> Troubleshooting</div>
                      <div className="flex flex-col gap-2">
                          {(() => {
                            const items = ['Cannot log in','Notifications not received','Sync issues'].filter(t => t.toLowerCase().includes(helpSearch.trim().toLowerCase()));
                            return items.length > 0 ? items.map((t, idx) => (
                              <button key={t} onClick={() => { setExpandedHelpArticle('troubleshooting-' + idx); setExpandedHelpTitle(t); }} className="text-left px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 hover:shadow transition">
                                {t}
                              </button>
                            )) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400">No matches</div>
                            );
                          })()}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><Cog6ToothIcon className="w-5 h-5" /> Advanced</div>
                      <div className="flex flex-col gap-2">
                          {(() => {
                            const items = ['Role-based permissions','Custom risk weights','Offline sync'].filter(t => t.toLowerCase().includes(helpSearch.trim().toLowerCase()));
                            return items.length > 0 ? items.map((t, idx) => (
                              <button key={t} onClick={() => { setExpandedHelpArticle('advanced-' + idx); setExpandedHelpTitle(t); }} className="text-left px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 hover:shadow transition">
                                {t}
                              </button>
                            )) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400">No matches</div>
                            );
                          })()}
                      </div>
                    </div>
                      <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 supports-[backdrop-filter]:backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4 md:col-span-2">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><DocumentTextIcon className="w-5 h-5" /> API Docs</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">Coming soon: Full API reference and developer guides.</div>
                    </div>
                  </div>
                  {/* Tutorials & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><PlayCircleIcon className="w-5 h-5" /> Video Tutorials</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">Tutorial videos will appear here.</div>
                    </div>
                    <div className="rounded-xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><LifebuoyIcon className="w-5 h-5" /> Contact Support</div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <button className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-1"><ChatBubbleLeftRightIcon className="w-4 h-4" /> Live Chat</button>
                        <button className="px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 flex items-center gap-1"><EnvelopeIcon className="w-4 h-4" /> Email</button>
                        <button className="px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 flex items-center gap-1"><PhoneIcon className="w-4 h-4" /> Phone</button>
                        <button className="px-3 py-2 rounded-lg bg-white/70 dark:bg-[#232c43]/80 border border-white/40 dark:border-gray-600/40 flex items-center gap-1"><LifebuoyIcon className="w-4 h-4" /> Tickets</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* Expanded Help Article Modal */}
              {expandedHelpArticle && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white/90 dark:bg-[#232c43]/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full p-8 md:p-10 relative flex flex-col items-center border border-white/40 dark:border-gray-600/40">
                    <button
                      className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => { setExpandedHelpArticle(null); setExpandedHelpTitle(null); }}
                    >
                      <svg className="h-5 w-5 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">
                      {expandedHelpTitle || 'Article'}
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 text-center">[Markdown content coming soon]</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'news' && (
             <div className="p-4 md:p-6 flex flex-col gap-4">
              {/* Filter chips as buttons */}
              <div className="flex items-center gap-2 text-xs">
                {(['All','Announcement','Feature','Maintenance','Event'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setNewsFilter(f)}
                    className={`px-2 py-1 rounded-full border backdrop-blur transition ${newsFilter === f ? 'bg-white/40 dark:bg-white/10 border-white/40 dark:border-gray-600/40 text-gray-800 dark:text-gray-200' : 'bg-white/20 dark:bg-white/5 border-white/30 dark:border-gray-600/30 text-gray-700 dark:text-gray-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* News grid with loading/empty states */}
              {newsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                (() => {
                  const filtered = newsFilter === 'All' ? allNewsItems : allNewsItems.filter(i => i.type === newsFilter);
                  return (
                    <>
                      {filtered.length === 0 ? (
                        <div className="rounded-2xl bg-white/40 dark:bg-white/10 border border-white/30 dark:border-gray-600/30 p-6 text-center text-gray-700 dark:text-gray-300">
                          No news available for this filter.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filtered.map((item, idx) => (
                            <div key={idx} className="relative rounded-2xl bg-white/60 dark:bg-[#232c43]/70 backdrop-blur-md border border-white/40 dark:border-gray-600/40 p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.type}</div>
                                  <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.date}</div>
                                </div>
                                {item.unread && <span className="ml-2 mt-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px]">•</span>}
                              </div>
                              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Click to view details</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          )}
      </div>
             {/* Messages-only panel - no bottom nav needed */}
    </div>
  );
} 
