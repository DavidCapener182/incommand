"use client";
import React from "react";
import { UserGroupIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function StaffManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101c36] p-8 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors">
          <PlusIcon className="h-5 w-5" />
          Add Staff
        </button>
      </div>
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full overflow-x-auto">
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
} 