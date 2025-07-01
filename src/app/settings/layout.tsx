"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon, CalendarDaysIcon, ChartBarIcon, BellIcon, QuestionMarkCircleIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Buffer } from 'buffer';
import { useState } from 'react';

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = Buffer;
}

const nav = [
  { name: 'General', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Events', href: '/settings/events', icon: CalendarDaysIcon },
  { name: 'AI Usage', href: '/settings/ai-usage', icon: ChartBarIcon },
  { name: 'Notification Settings', href: '/settings/notifications', icon: BellIcon },
  { name: 'Support', href: '/settings/support', icon: QuestionMarkCircleIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300 pt-16 lg:pt-0">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] 
        flex flex-col shadow-lg transition-transform duration-300 ease-in-out
        lg:mt-0 mt-16
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Settings</span>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a2a57] transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-2 py-4 px-2">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)} // Close mobile menu on navigation
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors
                  ${active ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-0">
        {/* Mobile header - positioned to account for main navigation */}
        <div className="lg:hidden bg-white dark:bg-[#23408e] border-b border-gray-200 dark:border-[#2d437a] px-4 py-3 sticky top-16 z-40 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2a57] transition-colors"
            >
              <Bars3Icon className="h-5 w-5" />
              <span className="text-sm font-medium">Settings Menu</span>
            </button>
          </div>
        </div>
        
        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#15192c] transition-colors duration-300 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 