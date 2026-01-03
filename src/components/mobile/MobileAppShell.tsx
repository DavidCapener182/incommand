'use client'

import React, { useMemo, useState } from 'react'
import { HomeIcon, ChatBubbleLeftRightIcon, PlusIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useEventContext } from '@/contexts/EventContext'
import { useAuth } from '@/contexts/AuthContext'
import MobileIncidentHome from './MobileIncidentHome'
import MobileChat from './MobileChat'
import MobileLostAndFound from './MobileLostAndFound'
import IncidentCreationModal from '../IncidentCreationModal'
import { useRouter } from 'next/navigation'

type TabKey = 'incidents' | 'chat' | 'lost' | 'documents'

export default function MobileAppShell() {
  const { eventData, eventId, loading: eventLoading } = useEventContext()
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('incidents')
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)

  const companyId = useMemo(() => {
    return (
      eventData?.company_id ||
      user?.user_metadata?.company_id ||
      user?.user_metadata?.company ||
      'default-company'
    )
  }, [eventData?.company_id, user?.user_metadata])

  const connectionStatus = eventId ? 'online' : 'offline'
  const eventName = eventData?.event_name || 'No active event'

  const renderContent = () => {
    if (activeTab === 'chat') {
      return <MobileChat eventId={eventId} companyId={companyId} />
    }
    if (activeTab === 'lost') {
      return <MobileLostAndFound />
    }
    return (
      <MobileIncidentHome
        eventId={eventId}
        eventName={eventName}
        connectionStatus={connectionStatus}
        loadingEvent={eventLoading}
        onLogNewIncident={() => setIsIncidentModalOpen(true)}
      />
    )
  }

  // Helper for bottom nav items
  const NavItem = ({
    label,
    icon,
    tab,
    isActive,
    onClick,
  }: {
    label: string
    icon: React.ReactNode
    tab: TabKey
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 group"
    >
      {isActive && (
        <span className="absolute top-2 h-1 w-1 rounded-full bg-[#2A3990] dark:bg-blue-400 shadow-[0_0_8px_rgba(42,57,144,0.6)]" />
      )}
      <div
        className={`h-6 w-6 transition-colors duration-200 ${
          isActive
            ? 'text-[#2A3990] dark:text-blue-400 stroke-[2px]'
            : 'text-gray-400 dark:text-gray-500 stroke-[1.5px] group-hover:text-gray-600 dark:group-hover:text-gray-300'
        }`}
      >
        {icon}
      </div>
      <span
        className={`mt-1 text-[10px] font-medium transition-colors duration-200 ${
          isActive
            ? 'text-[#2A3990] dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {label}
      </span>
    </button>
  )

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-gray-50 dark:bg-[#0e1427] text-gray-900 dark:text-gray-100 flex flex-col">
      <div
        className="bg-[#2A3990] text-white px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="flex-shrink-0"
            style={{ width: '1.4rem', height: '1.4rem' }}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M20 55 L45 75 L85 20"
              fill="none"
              stroke="#ed1c24"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-semibold">InCommand</span>
        </div>
        <span className="text-xs font-medium bg-white/15 px-3 py-1 rounded-full">
          Mobile
        </span>
      </div>
      <header className="px-4 pt-4 pb-3 bg-white/90 dark:bg-[#0f1a33]/80 backdrop-blur-md shadow-sm border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Current Event</span>
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[70vw]">
              {eventLoading ? 'Loading…' : eventName}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
              connectionStatus === 'online'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            <span>Control Room {connectionStatus === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">{renderContent()}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 bg-white/90 dark:bg-[#0f1a33]/90 backdrop-blur-lg border-t border-gray-200/70 dark:border-gray-700/60"
        style={{
          paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
          paddingRight: 'max(env(safe-area-inset-right), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
          <div
            className="grid grid-cols-5 items-end gap-2 px-2 pt-2"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
          >
          <NavItem
            label="Home"
            icon={<HomeIcon />}
            tab="incidents"
            isActive={activeTab === 'incidents'}
            onClick={() => {
              setActiveTab('incidents')
              setIsIncidentModalOpen(false)
            }}
          />
          <NavItem
            label="Chat"
            icon={<ChatBubbleLeftRightIcon />}
            tab="chat"
            isActive={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          
          {/* Button aligned horizontally with other nav items */}
          <div className="flex flex-col items-center justify-start translate-y-1">
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2A3990] to-[#4c5ecf] text-white shadow-lg shadow-blue-900/20 transition-transform active:scale-95 hover:shadow-xl dark:shadow-blue-900/40"
              aria-label="Log New Incident"
            >
              <PlusIcon className="h-6 w-6 stroke-[2.5px]" />
            </button>
            <span className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              Log
            </span>
          </div>

          <NavItem
            label="Lost & Found"
            icon={<CubeIcon />}
            tab="lost"
            isActive={activeTab === 'lost'}
            onClick={() => setActiveTab('lost')}
          />
          <NavItem
            label="Documents"
            icon={<DocumentTextIcon />}
            tab="documents"
            isActive={false}
            onClick={() => router.push('/documents')}
          />
        </div>
      </nav>

      {/* --- Incident Modal --- */}
      {user && (
        <IncidentCreationModal
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          onIncidentCreated={async () => {
            setIsIncidentModalOpen(false)
          }}
        />
      )}
    </div>
  )
}