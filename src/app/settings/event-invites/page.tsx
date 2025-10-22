"use client";

import React from 'react';
import { useEventMembership } from '@/hooks/useEventMembership';
import InviteManagement from '@/components/InviteManagement';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function EventInvitesPage() {
  const { canAccessAdminFeatures, hasActiveMembership } = useEventMembership();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
          <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Event Invites</h1>
      </div>
      
      <div className="space-y-6">
        {!canAccessAdminFeatures || !hasActiveMembership ? (
          <div className="card-depth text-gray-900 dark:text-gray-100 p-6 text-center">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg mb-4">
              <UserCircleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200 mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-blue-300">
              You need admin privileges and an active event membership to manage event invites.
            </p>
          </div>
        ) : (
          <div className="card-depth text-gray-900 dark:text-gray-100 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200 mb-2">Manage Event Access</h2>
              <p className="text-gray-600 dark:text-blue-300">
                Create and manage invites for temporary access to your current event. 
                Invite users with specific roles and set expiration dates.
              </p>
            </div>
            <InviteManagement />
          </div>
        )}
      </div>
    </div>
  );
}
