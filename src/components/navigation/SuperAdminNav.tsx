'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  LifebuoyIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const items = [
  { href: '/admin', label: 'Dashboard', icon: HomeIcon },
  { href: '/admin/companies', label: 'Companies', icon: BuildingOfficeIcon },
  { href: '/admin/billing', label: 'Billing', icon: CreditCardIcon },
  { href: '/admin/content', label: 'Content', icon: DocumentTextIcon },
  { href: '/admin/support', label: 'Support', icon: LifebuoyIcon },
  { href: '/admin/metrics', label: 'System Metrics', icon: ChartBarIcon },
  { href: '/admin/settings', label: 'Settings', icon: CogIcon },
];

export default function SuperAdminNav() {
  const path = usePathname();

  return (
    <nav className="w-64 shrink-0 border-r bg-background dark:bg-[#15192c] border-gray-200 dark:border-[#2d437a] fixed top-0 left-0 h-screen z-30">
      <div className="p-4 border-b border-gray-200 dark:border-[#2d437a]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Back Office</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">System Administration</p>
      </div>
      
      <ul className="p-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#1a2a57] ${
                  active 
                    ? 'bg-blue-50 text-blue-700 dark:bg-[#1a2a57] dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                href={href}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


