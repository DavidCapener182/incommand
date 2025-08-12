"use client";

import React, { useState } from "react";
import { UserGroupIcon, PlusIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

// Sidebar removed for a cleaner, single-page experience

export default function StaffManagementPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Staff Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your team directory, availability and documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow">
              <PlusIcon className="w-5 h-5" />
              Add Staff
            </button>
            <button className="inline-flex items-center gap-2 bg-white dark:bg-[#23408e] text-gray-700 dark:text-white border border-gray-200 dark:border-[#2d437a] py-2.5 px-4 rounded-lg shadow-sm hover:shadow">
              <ClipboardDocumentListIcon className="w-5 h-5" />
              Import CSV
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Staff", value: 0 },
            { label: "Active", value: 0 },
            { label: "Inactive", value: 0 },
          ].map((kpi) => (
            <div key={kpi.label} className="relative bg-white dark:bg-[#23408e] text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
              <p className="text-sm text-gray-600 dark:text-blue-100">{kpi.label}</p>
              <p className="text-3xl font-extrabold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Search and filters */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, role, skill..."
                className="w-full rounded-lg border border-gray-200 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              <select className="rounded-lg border border-gray-200 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 px-3 py-2">
                <option>All Roles</option>
                <option>Manager</option>
                <option>Supervisor</option>
                <option>Security</option>
              </select>
              <select className="rounded-lg border border-gray-200 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 px-3 py-2">
                <option>Status: All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff list placeholder */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 shadow-sm">
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No staff members</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first staff member.</p>
            <div className="mt-6">
              <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow">
                <PlusIcon className="w-4 h-4" />
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 