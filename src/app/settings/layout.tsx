"use client";
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon, CalendarDaysIcon, ChartBarIcon, BellIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Buffer } from 'buffer';
import IconSidebar from '../../components/IconSidebar';

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = Buffer;
}

const navigation = [
  { name: 'General', href: '/settings', icon: Cog6ToothIcon, id: 'general' },
  { name: 'Events', href: '/settings/events', icon: CalendarDaysIcon, id: 'events' },
  { name: 'AI Usage', href: '/settings/ai-usage', icon: ChartBarIcon, id: 'ai-usage' },
  { name: 'Notification Settings', href: '/settings/notifications', icon: BellIcon, id: 'notifications' },
  { name: 'Support', href: '/settings/support', icon: QuestionMarkCircleIcon, id: 'support' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  
  // Determine active item based on current path
  const getActiveItem = () => {
    if (pathname === '/settings') return 'general';
    if (pathname.startsWith('/settings/events')) return 'events';
    if (pathname.startsWith('/settings/ai-usage')) return 'ai-usage';
    if (pathname.startsWith('/settings/notifications')) return 'notifications';
    if (pathname.startsWith('/settings/support')) return 'support';
    return 'general';
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
      <IconSidebar
        navigation={navigation}
        activeItem={getActiveItem()}
        title="Settings"
      />
      
      {/* Main content */}
      <main className="flex-1 ml-16 lg:ml-64 bg-gray-50 dark:bg-[#15192c] min-h-screen transition-colors duration-300">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 