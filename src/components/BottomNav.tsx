"use client"
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { HomeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

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

  React.useEffect(() => {
    const measure = () => {
      if (typeof window === 'undefined') return;
      const footers = document.getElementsByTagName('footer');
      const footerEl = footers && footers.length > 0 ? footers[0] as HTMLElement : null;
      const h = footerEl ? footerEl.offsetHeight + 8 : 52; // Add 8px padding above footer
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
    <AnimatePresence>
      <motion.nav 
        role="navigation" 
        aria-label="Primary" 
        className="fixed inset-x-0 z-50 bg-white/90 dark:bg-gray-900/90 supports-[backdrop-filter]:backdrop-blur-[8px] backdrop-saturate-150 border-t border-white/20 dark:border-gray-700/30 shadow-xl shadow-black/5 dark:shadow-black/20" 
        style={{ bottom: bottomOffset, backdropFilter: 'blur(8px)' }}
        initial={{ y: 100 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.3
        }}
      >
        <div className="mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between">
            {/* Home (left) */}
            <motion.button
              type="button"
              role="button"
              aria-label="Navigate to Home"
              aria-current={isActive('/incidents') ? 'page' : undefined}
              onClick={() => go('/incidents')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive('/incidents') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={isActive('/incidents') ? { rotate: 0 } : { rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HomeIcon className="w-6 h-6" />
              </motion.div>
              <span className="text-sm font-medium">Home</span>
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
                  className="flex-1 mx-4 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 overflow-hidden shadow-sm"
                >
                  <div className="flex items-center">
                    <motion.span 
                      className="text-red-500 mr-2 text-xs font-bold flex items-center"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                      LIVE
                    </motion.span>
                    <div className="text-xs text-blue-700 dark:text-blue-200 font-medium mr-4 truncate">
                      {displaySummary}
                    </div>
                    {/* Enhanced Scrolling Incident Summary */}
                    {recentIncidents.length > 0 && (
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
                        </motion.div>
                      </div>
                    )}
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
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent ${isHelpCenterOpen ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              whileHover={!chatDisabled ? { scale: 1.05 } : {}}
              whileTap={!chatDisabled ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={isHelpCenterOpen ? { rotate: 0 } : { rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </motion.div>
              <span className="text-sm font-medium">Chat</span>
            </motion.button>
          </div>
        </div>
      </motion.nav>
    </AnimatePresence>
  )
}

