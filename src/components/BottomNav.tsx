"use client"
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { HomeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface Incident {
  id: string;
  incident_type: string;
  occurrence?: string;
  callsign_from?: string;
  callsign_to?: string;
  created_at: string;
  status?: string;
  timestamp?: string;
  is_closed?: boolean;
}

interface BottomNavProps {
  onOpenHelpCenter?: () => void;
  helpCenterId?: string;
  isHelpCenterOpen?: boolean;
  incidentSummary?: string;
}

export default function BottomNav({ onOpenHelpCenter, helpCenterId, isHelpCenterOpen, incidentSummary }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [bottomOffset, setBottomOffset] = React.useState<number>(44);
  const [currentIncidentSummary, setCurrentIncidentSummary] = React.useState<string>('');
  const [recentIncidents, setRecentIncidents] = React.useState<Incident[]>([]);

  // Listen for incident summary updates
  React.useEffect(() => {
    const handleIncidentSummaryUpdate = (event: CustomEvent) => {
      setCurrentIncidentSummary(event.detail);
    };

    window.addEventListener('updateIncidentSummary', handleIncidentSummaryUpdate as EventListener);
    return () => {
      window.removeEventListener('updateIncidentSummary', handleIncidentSummaryUpdate as EventListener);
    };
  }, []);

  // Listen for recent incidents updates
  React.useEffect(() => {
    const handleRecentIncidentsUpdate = (event: CustomEvent) => {
      setRecentIncidents(event.detail);
    };

    window.addEventListener('updateRecentIncidents', handleRecentIncidentsUpdate as EventListener);
    return () => {
      window.removeEventListener('updateRecentIncidents', handleRecentIncidentsUpdate as EventListener);
    };
  }, []);

  // Use prop if provided, otherwise use state
  const displaySummary = incidentSummary || currentIncidentSummary;

  React.useEffect(() => {
    const measure = () => {
      if (typeof window === 'undefined') return;
      const footers = document.getElementsByTagName('footer');
      const footerEl = footers && footers.length > 0 ? footers[0] as HTMLElement : null;
      const h = footerEl ? footerEl.offsetHeight : 44;
      setBottomOffset(h);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const go = (href: string) => {
    try { router.push(href); } catch {}
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const chatDisabled = !onOpenHelpCenter;

  return (
    <nav role="navigation" aria-label="Primary" className="fixed inset-x-0 z-40 bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:backdrop-blur-[2px] backdrop-saturate-150 border-t border-white/20 dark:border-gray-700/30 shadow-xl shadow-black/5 dark:shadow-black/20" style={{ bottom: bottomOffset, backdropFilter: 'blur(2px)' }}>
      <div className="mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between">
          {/* Home (left) */}
          <button
            type="button"
            role="button"
            aria-label="Navigate to Home"
            aria-current={isActive('/incidents') ? 'page' : undefined}
            onClick={() => go('/incidents')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 hover:bg-white/60 dark:hover:bg-gray-800/60 ${isActive('/incidents') ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-sm">Home</span>
          </button>

          {/* Incident Summary with Scrolling Ticker (center) */}
          {displaySummary && (
            <div className="flex-1 mx-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
              <div className="flex items-center">
                <span className="text-red-500 animate-pulse mr-2 text-xs font-bold">LIVE</span>
                <div className="text-xs text-blue-700 dark:text-blue-200 font-medium mr-4">
                  {displaySummary}
                </div>
                {/* Scrolling Incident Summary */}
                {recentIncidents.length > 0 && (
                  <div className="flex-1 overflow-hidden">
                    <div className="animate-scroll-slow whitespace-nowrap text-xs text-blue-600 dark:text-blue-300">
                      {recentIncidents.map((incident, index) => {
                        // Format time (HH:MM)
                        const time = incident.timestamp || incident.created_at;
                        const timeStr = time ? new Date(time).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        }) : '';
                        
                        // Get occurrence text
                        const occurrenceText = incident.occurrence && incident.occurrence.trim() 
                          ? incident.occurrence.substring(0, 40)
                          : incident.incident_type;
                        
                        // Get status - prioritize is_closed over status field
                        let status = 'Open';
                        if (incident.is_closed !== undefined) {
                          status = incident.is_closed ? 'Closed' : 'Open';
                        } else if (incident.status) {
                          status = incident.status;
                        }
                        
                        // Create summary: "Time - Occurrence - Status"
                        const summary = `${timeStr} - ${occurrenceText}${occurrenceText.length > 40 ? '...' : ''} - ${status}`;
                        
                        return (
                          <span key={incident.id} className="inline-block mr-8">
                            {summary}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat (right) */}
          <button
            type="button"
            role="button"
            aria-label="Open Help Center"
            aria-haspopup="dialog"
            aria-controls={helpCenterId}
            aria-expanded={isHelpCenterOpen}
            disabled={chatDisabled}
            aria-disabled={chatDisabled}
            title={chatDisabled ? 'Chat unavailable' : 'Open Help Center'}
            onClick={() => { if (onOpenHelpCenter) onOpenHelpCenter(); }}
            className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:scale-105 hover:bg-white/60 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-sm">Chat</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

