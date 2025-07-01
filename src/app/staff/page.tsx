"use client";
import React, { useState } from "react";
import { UserGroupIcon, PlusIcon, ClipboardDocumentListIcon, CogIcon, ChartBarIcon, CalendarIcon } from "@heroicons/react/24/outline";
import IconSidebar from '../components/IconSidebar';

// Staff navigation items
const navigation = [
  { name: 'Staff Directory', icon: UserGroupIcon, id: 'directory' },
  { name: 'Add Staff', icon: PlusIcon, id: 'add-staff' },
  { name: 'Schedules', icon: CalendarIcon, id: 'schedules' },
  { name: 'Performance', icon: ChartBarIcon, id: 'performance' },
  { name: 'Reports', icon: ClipboardDocumentListIcon, id: 'reports' },
  { name: 'Settings', icon: CogIcon, id: 'settings' },
];

export default function StaffManagementPage() {
  const [activeSection, setActiveSection] = useState('directory');

  const renderContent = () => {
    switch (activeSection) {
      case 'directory':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Staff Directory</h1>
              </div>
            </div>
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 overflow-x-auto hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Name</th>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Contact</th>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Email</th>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Skills</th>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Notes</th>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Active</th>
                    <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100" colSpan={7}>
                      <div className="text-center text-gray-400 dark:text-gray-300 py-8">
                        Staff list will appear here.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'add-staff':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <PlusIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Add New Staff Member</h1>
            </div>
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <p className="text-gray-600 dark:text-blue-100">Staff addition form will be implemented here.</p>
            </div>
          </div>
        );
      case 'schedules':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Staff Schedules</h1>
            </div>
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <p className="text-gray-600 dark:text-blue-100">Staff scheduling will be implemented here.</p>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Staff Performance</h1>
            </div>
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <p className="text-gray-600 dark:text-blue-100">Performance analytics will be implemented here.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Staff Reports</h1>
            </div>
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <p className="text-gray-600 dark:text-blue-100">Staff reports will be implemented here.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CogIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Staff Settings</h1>
            </div>
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <p className="text-gray-600 dark:text-blue-100">Staff management settings will be implemented here.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
      <IconSidebar
        navigation={navigation}
        activeItem={activeSection}
        onItemClick={setActiveSection}
        title="Staff"
      />
      
      <main className="flex-1 ml-16 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
} 