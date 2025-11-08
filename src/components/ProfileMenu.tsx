'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircle, Info, Settings, User } from 'lucide-react';
import { Button } from './ui/button';

export default function ProfileMenu() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // signOut() will handle the redirect to /login
  };

  return (
    <div className="w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      {/* Menu Header */}
      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        My Account
      </div>
      
      {/* Separator */}
      <div className="h-px bg-gray-200 -mx-2 mb-2.5"></div>
      
      {/* Menu Items */}
      <div className="space-y-1">
        <Link 
          href="/profile" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </Link>

        <Link 
          href="/settings" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <Link 
          href="/#how-it-works" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>About</span>
        </Link>

        <Link 
          href="/help" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </Link>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="destructive"
          mode="default"
          size="sm"
          className="w-full justify-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
