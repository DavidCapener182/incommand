import React from 'react';
import SuperAdminNav from '@/components/navigation/SuperAdminNav';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] overflow-hidden">
      <SuperAdminNav />
      <main className="ml-64 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

