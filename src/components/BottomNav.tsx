"use client"
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { HomeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface BottomNavProps {
  onOpenHelpCenter?: () => void;
  helpCenterId?: string;
  isHelpCenterOpen?: boolean;
}

export default function BottomNav({ onOpenHelpCenter, helpCenterId, isHelpCenterOpen }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [bottomOffset, setBottomOffset] = React.useState<number>(44);

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

