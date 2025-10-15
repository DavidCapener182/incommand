"use client"
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { HomeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeBottomNav } from '../hooks/useSwipeGestures'

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
  const [currentIncidentSummary, setCurrentIncidentSummary] = React.useState<string>('');
  const [recentIncidents, setRecentIncidents] = React.useState<Incident[]>([]);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  // Swipe gesture for toggling bottom nav visibility
  const swipeGestures = useSwipeBottomNav(() => {
    setIsVisible(prev => !prev);
  });

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

  // Auto-hide on scroll (mobile only)
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100;
        const isScrollingUp = currentScrollY < lastScrollY;
        
        if (isScrollingDown && isVisible) {
          setIsVisible(false);
        } else if (isScrollingUp && !isVisible) {
          setIsVisible(true);
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isVisible]);

  // Use prop if provided, otherwise use state
  const displaySummary = incidentSummary || currentIncidentSummary;


  const go = (href: string) => {
    try { router.push(href); } catch {}
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const chatDisabled = !onOpenHelpCenter;

  return (
    <AnimatePresence>
      <motion.nav 
        role="navigation" 
        aria-label="Primary" 
        className="fixed inset-x-0 bottom-0 z-50 bg-white/90 dark:bg-gray-900/90 supports-[backdrop-filter]:backdrop-blur-[8px] backdrop-saturate-150 border-t border-white/20 dark:border-gray-700/30 shadow-xl shadow-black/5 dark:shadow-black/20" 
        style={{ 
          backdropFilter: 'blur(8px)',
          paddingLeft: 'max(env(safe-area-inset-left), 0.5rem)',
          paddingRight: 'max(env(safe-area-inset-right), 0.5rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
        initial={{ y: 100 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.3
        }}
        {...swipeGestures}
      >
        <div className="mx-auto px-2 sm:px-4 py-1">
          <div className="flex items-center justify-between gap-2">
            {/* Home (left) */}
            <motion.button
              type="button"
              role="button"
              aria-label="Navigate to Home"
              aria-current={isActive('/incidents') ? 'page' : undefined}
              onClick={() => go('/incidents')}
              className={`touch-target flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive('/incidents') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={isActive('/incidents') ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <HomeIcon className="w-6 h-6" />
              </motion.div>
              <span className="text-sm font-semibold">Home</span>
            </motion.button>

            {/* Incident Summary with Enhanced Scrolling Ticker (center) */}
            <AnimatePresence mode="wait">
              {displaySummary && (
                <motion.div 
                  key="summary"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 mx-2 sm:mx-4 px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 overflow-hidden shadow-sm"
                >
                  <div className="flex items-center">
                    <motion.span 
                      className="text-red-500 mr-1.5 text-[10px] sm:text-xs font-bold flex items-center flex-shrink-0"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                      LIVE
                    </motion.span>
                    <div className="hidden sm:block text-xs text-blue-700 dark:text-blue-200 font-medium mr-4 truncate">
                      {displaySummary}
                    </div>
                    {/* Enhanced Scrolling Incident Summary */}
                    <div className="flex-1 overflow-hidden">
                      <motion.div 
                        className="animate-scroll-slow whitespace-nowrap text-xs text-blue-600 dark:text-blue-300"
                        initial={{ x: "100%" }}
                        animate={{ x: "-100%" }}
                        transition={{ 
                          duration: 40, 
                          repeat: Infinity, 
                          ease: "linear",
                          repeatDelay: 2
                        }}
                      >
                        {recentIncidents.length > 0 ? (
                          recentIncidents.map((incident, index) => {
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
                          })
                        ) : (
                          <span className="inline-block mr-8">
                            Monitoring for incidents...
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat (right) */}
            <motion.button
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
              className={`touch-target flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent ${isHelpCenterOpen ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md' : ''}`}
              whileHover={!chatDisabled ? { scale: 1.02 } : {}}
              whileTap={!chatDisabled ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={isHelpCenterOpen ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>
              <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Chat</span>
            </motion.button>
          </div>
        </div>
      </motion.nav>
    </AnimatePresence>
  )
}

