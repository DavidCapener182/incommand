'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon, CalendarDaysIcon, ChartBarIcon, BellIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const nav = [
  { name: 'General', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Events', href: '/settings/events', icon: CalendarDaysIcon },
  { name: 'AI Usage', href: '/settings/ai-usage', icon: ChartBarIcon },
  { name: 'Notification Settings', href: '/settings/notifications', icon: BellIcon },
  { name: 'Support', href: '/settings/support', icon: QuestionMarkCircleIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
  <div className="flex items-center space-x-2">
    <UserCircleIcon className="h-6 w-6 text-blue-700" />
    <span className="text-lg font-semibold text-gray-900">Settings</span>
  </div>
</div>
        <nav className="flex-1 space-y-2">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
} 