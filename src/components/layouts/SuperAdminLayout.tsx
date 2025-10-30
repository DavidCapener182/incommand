import React from 'react';
import SuperAdminNav from '@/components/navigation/SuperAdminNav';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#15192c]">
      <SuperAdminNav />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

