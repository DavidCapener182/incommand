import React, { useState, useEffect } from 'react';
import AIChat from './AIChat';
import { UserCircleIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, InformationCircleIcon, HomeIcon, QuestionMarkCircleIcon, NewspaperIcon, XMarkIcon, BuildingOffice2Icon, UsersIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import EventMessagesPanel from './EventMessagesPanel';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'help', label: 'Help', icon: '❓' },
  { key: 'news', label: 'News', icon: '📰' },
];

const CHAT_LIST = [
  { key: 'ai', label: 'AI Chatbot', icon: '💬', pinned: true }
];

export default function HelpCenterModal({ isOpen, onClose }: HelpCenterModalProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedChat, setSelectedChat] = useState('ai');
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [expandedHelpArticle, setExpandedHelpArticle] = useState<string | null>(null);
  const topArticles = [
    { key: 'incident', title: 'Logging an Incident' },
    { key: 'evac', title: 'Evacuation Procedure' },
    { key: 'radio', title: 'Radio Protocols' },
  ];
  const helpArticles = [
    { key: 'log-incident', title: 'How to Log an Incident' },
    { key: 'evac-sop', title: 'Evacuation SOP' },
    { key: 'radio-etiquette', title: 'Radio Etiquette' },
  ];
  const [aiChatUnread, setAIChatUnread] = useState(false);
  const [eventName, setEventName] = useState<string>('Current Event');

  useEffect(() => {
    if (activeTab === 'messages') {
      if (typeof window !== 'undefined') {
        const lastMessageTime = localStorage.getItem('lastAIChatMessage');
        const lastViewTime = localStorage.getItem('lastAIChatView');
        if (lastMessageTime && lastViewTime) {
          setAIChatUnread(new Date(lastMessageTime) > new Date(lastViewTime));
        } else if (lastMessageTime && !lastViewTime) {
          setAIChatUnread(true);
        } else {
          setAIChatUnread(false);
        }
      }
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (activeTab === 'messages' && selectedChat === 'ai' && typeof window !== 'undefined') {
      localStorage.setItem('lastAIChatView', new Date().toISOString());
      setAIChatUnread(false);
    }
  }, [activeTab, selectedChat, isOpen]);

  useEffect(() => {
    const fetchEventName = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('event_name')
        .eq('is_current', true)
        .single();
      if (data?.event_name) setEventName(data.event_name);
      else setEventName('Current Event');
    };
    fetchEventName();
  }, []);

  if (!isOpen) return null;

  // Responsive helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      {/* Modal Panel */}
      <div
        className={
          `absolute transition-all duration-300
          ${isMobile ? 'inset-0 rounded-none shadow-none max-w-full h-full flex flex-col' : 'right-6 bottom-24 md:bottom-8 max-w-3xl w-full h-[90vh] md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden'}
          bg-gradient-to-b from-[#2A3990] via-white to-white dark:from-[#101c36] dark:via-[#151d34] dark:to-[#232c43]`
        }
        style={{
          left: isMobile ? undefined : 'auto',
          pointerEvents: 'auto',
          background: isMobile
            ? 'linear-gradient(to bottom, #2A3990 0%, #fff 90%, #fff 100%)'
            : 'linear-gradient(to bottom, #2A3990 0%, #fff 90%, #fff 100%)',
        }}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/80 hover:bg-blue-100 dark:bg-[#232c43]/80 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow transition"
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
          aria-label="Close help center"
        >
          <XMarkIcon className="h-6 w-6 text-blue-700 dark:text-blue-200" />
        </button>
        {/* Top Bar: Logo left, X right */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center">
            <img src="/inCommand.png" alt="inCommand Logo" className="h-12 w-auto" />
          </div>
        </div>
        {/* Content */}
        <div className={`flex-1 ${activeTab === 'messages' ? (isMobile ? 'flex flex-col' : 'flex') : ''} overflow-y-auto p-0 md:p-6`}> 
          {activeTab === 'home' && (
            <div className="p-6 flex flex-col gap-4">
              {/* Welcome Card */}
              <div className="bg-white dark:bg-[#232c43] rounded-2xl shadow-md p-6 flex flex-col gap-2 items-start border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  <UserCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                  <span>Hi David!</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400 dark:text-blue-200" />
                  <span>This is inCommand technical support. How can we help?</span>
                </div>
                {/* Quick Action */}
                <button className="flex items-center gap-2 bg-[#2A3990] hover:bg-[#1e2a6a] text-white font-medium px-4 py-2 rounded-lg shadow transition">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                  <span>Send us a message</span>
                </button>
              </div>
              {/* Search Bar */}
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232c43] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Search for help, SOPs, or FAQs..."
                  disabled
                />
              </div>
              {/* Helper text */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <InformationCircleIcon className="w-4 h-4" />
                <span>Tip: Try searching for "evacuation" or "radio".</span>
              </div>
              {/* Top SOPs/FAQs */}
              <div className="mt-4">
                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Top SOPs & FAQs</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {topArticles.map(article => (
                    <button
                      key={article.key}
                      className="bg-white dark:bg-[#232c43] border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg min-h-[100px] flex flex-row items-center gap-3 p-4 text-left transition-all duration-200 focus:outline-none hover:scale-102 hover:shadow-2xl hover:ring-2 hover:ring-blue-200/30 focus:ring-2 focus:ring-blue-400"
                      onClick={() => setExpandedArticle(article.key)}
                      style={{height: '100%'}}
                    >
                      <DocumentTextIcon className="w-6 h-6 text-blue-500 dark:text-blue-300 flex-shrink-0" />
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{article.title}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-300 mt-1">Click to view</span>
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
                  <div className="bg-white dark:bg-[#232c43] rounded-2xl shadow-2xl max-w-lg w-full p-8 md:p-10 relative flex flex-col items-center">
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
            </div>
          )}
          {activeTab === 'messages' && (
            <EventMessagesPanel
              eventName={eventName}
              CHAT_LIST={CHAT_LIST}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              showSidebarMobile={showSidebarMobile}
              setShowSidebarMobile={setShowSidebarMobile}
              isMobile={isMobile}
              AIChat={AIChat}
            />
          )}
          {activeTab === 'help' && (
            <div className="p-6 flex flex-col gap-4">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Help Articles & FAQs</div>
              <div className="flex flex-col gap-3">
                {helpArticles.map(article => (
                  <button
                    key={article.key}
                    className="bg-white dark:bg-[#232c43] border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg active:scale-[0.98] transition p-4 text-left flex flex-col focus:ring-2 focus:ring-blue-400"
                    onClick={() => setExpandedHelpArticle(article.key)}
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">{article.title}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-300 mt-1">Click to expand</span>
                  </button>
                ))}
              </div>
              {/* Expanded Help Article Modal */}
              {expandedHelpArticle && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-[#232c43] rounded-2xl shadow-2xl max-w-lg w-full p-8 md:p-10 relative flex flex-col items-center">
                    <button
                      className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setExpandedHelpArticle(null)}
                    >
                      <svg className="h-5 w-5 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">
                      {helpArticles.find(a => a.key === expandedHelpArticle)?.title}
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 text-center">[Markdown content coming soon]</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'news' && <div className="p-6">News/Announcements - Coming soon</div>}
        </div>
        {/* Bottom Tab Navigation */}
        <nav className="flex justify-around items-center border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-[#232c43]/90 p-2 pt-3">
          <button
            className={`flex flex-col items-center flex-1 py-1 px-2 rounded-lg transition-colors duration-150 ${activeTab === 'home' ? 'bg-blue-100 dark:bg-[#1e2a6a] text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setActiveTab('home')}
          >
            <HomeIcon className={`w-6 h-6 mb-0.5 ${activeTab === 'home' ? 'text-blue-700 dark:text-blue-200' : ''}`} />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-1 px-2 rounded-lg transition-colors duration-150 ${activeTab === 'messages' ? 'bg-blue-100 dark:bg-[#1e2a6a] text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => { setActiveTab('messages'); setShowSidebarMobile(true); }}
          >
            <ChatBubbleLeftRightIcon className={`w-6 h-6 mb-0.5 ${activeTab === 'messages' ? 'text-blue-700 dark:text-blue-200' : ''}`} />
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-1 px-2 rounded-lg transition-colors duration-150 ${activeTab === 'help' ? 'bg-blue-100 dark:bg-[#1e2a6a] text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setActiveTab('help')}
          >
            <QuestionMarkCircleIcon className={`w-6 h-6 mb-0.5 ${activeTab === 'help' ? 'text-blue-700 dark:text-blue-200' : ''}`} />
            <span className="text-xs font-medium">Help</span>
          </button>
          <button
            className={`flex flex-col items-center flex-1 py-1 px-2 rounded-lg transition-colors duration-150 ${activeTab === 'news' ? 'bg-blue-100 dark:bg-[#1e2a6a] text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setActiveTab('news')}
          >
            <NewspaperIcon className={`w-6 h-6 mb-0.5 ${activeTab === 'news' ? 'text-blue-700 dark:text-blue-200' : ''}`} />
            <span className="text-xs font-medium">News</span>
          </button>
        </nav>
      </div>
    </div>
  );
} 