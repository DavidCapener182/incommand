"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon, CalendarDaysIcon, ChartBarIcon, BellIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Buffer } from 'buffer';

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
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#101c36] transition-colors duration-300">
      <aside className="w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex flex-col shadow-lg z-10">
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
  <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Settings</span>
  </div>
</div>
        <nav className="flex-1 space-y-2 py-4 px-2">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
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
      <main className="flex-1 p-8 bg-gray-50 dark:bg-[#101c36] transition-colors duration-300">{children}</main>
    </div>
  );
} 