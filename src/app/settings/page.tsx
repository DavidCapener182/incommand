"use client";
import React, { useState, useEffect } from 'react';

export default function GeneralSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">General Settings</h1>
      <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-blue-200">Platform Information</h2>
        <p className="text-gray-600 dark:text-blue-100 mb-2">Manage your basic platform settings here.</p>
        <div className="text-gray-400 dark:text-blue-300 italic">(General settings form coming soon...)</div>
      </div>
      <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-blue-200">Account</h2>
        <p className="text-gray-600 dark:text-blue-100 mb-2">Update your account information or preferences.</p>
        <div className="text-gray-400 dark:text-blue-300 italic">(Account settings form coming soon...)</div>
      </div>
    </div>
  );
} 