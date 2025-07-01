"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon, CalendarDaysIcon, ChartBarIcon, BellIcon, QuestionMarkCircleIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Buffer } from 'buffer';
import { useState } from 'react';
import IconSidebar from '../../components/IconSidebar';

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

  const sidebarItems = nav.map(item => ({
    name: item.name,
    icon: item.icon,
    id: item.href.split('/').pop() || 'general',
    href: item.href
  }));

  const currentActiveItem = sidebarItems.find(item => 
    pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href))
  )?.id || 'general';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
      {/* Icon Sidebar */}
      <IconSidebar 
        items={sidebarItems}
        activeItem={currentActiveItem}
      />

      {/* Main content */}
      <main className="flex-1 ml-16 transition-all duration-300">
        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#15192c] transition-colors duration-300 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 