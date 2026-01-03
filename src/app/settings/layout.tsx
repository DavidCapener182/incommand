"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon, CalendarDaysIcon, ChartBarIcon, BellIcon, QuestionMarkCircleIcon, UserCircleIcon, BookOpenIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = Buffer;
}

const nav = [
  { name: 'General', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Events', href: '/settings/events', icon: CalendarDaysIcon },
  { name: 'Event Invites', href: '/settings/event-invites', icon: UserCircleIcon },
  { name: 'SOPs', href: '/settings/sops', icon: DocumentTextIcon },
  { name: 'AI Usage', href: '/settings/ai-usage', icon: ChartBarIcon },
  { name: 'Notification Settings', href: '/settings/notifications', icon: BellIcon },
  { name: 'User Guides', href: '/settings/guides', icon: BookOpenIcon },
  { name: 'Support', href: '/settings/support', icon: QuestionMarkCircleIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';
  
  // Get page title and subtitle based on current route
  const getPageInfo = () => {
    const currentNav = nav.find(item => 
      pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href))
    );
    
    if (!currentNav) return { title: 'Settings', subtitle: 'Manage your account preferences' };
    
    const subtitles: Record<string, string> = {
      'General': 'Manage your account preferences and profile information',
      'Events': 'View and manage your events and logs',
      'Event Invites': 'Create and manage event access invites',
      'SOPs': 'Manage Standard Operating Procedures templates and event SOPs',
      'AI Usage': 'Track your AI usage and subscription limits',
      'Notification Settings': 'Configure how you receive notifications',
      'User Guides': 'Learn how to use inCommand effectively',
      'Support': 'Get help and contact our support team',
    };
    
    return {
      title: currentNav.name,
      subtitle: subtitles[currentNav.name] || 'Manage your settings',
    };
  };
  
  const { title, subtitle } = getPageInfo();
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300 font-sans">
      <aside className="w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex flex-col shadow-lg z-10 sticky top-0 h-screen">
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Settings</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2 py-4 px-2 overflow-y-auto">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors
                  ${active ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-h-screen">
        <div className="sticky top-0 z-20 bg-white dark:bg-[#23408e] border-b border-gray-200 dark:border-[#2d437a] px-8 py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="p-8 bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
          {children}
        </div>
      </main>
    </div>
  );
} 