'use client'
import React from 'react';

export default function GeneralSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">General Settings</h1>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Platform Information</h2>
        <p className="text-gray-600 mb-2">Manage your basic platform settings here.</p>
        <div className="text-gray-400 italic">(General settings form coming soon...)</div>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Account</h2>
        <p className="text-gray-600 mb-2">Update your account information or preferences.</p>
        <div className="text-gray-400 italic">(Account settings form coming soon...)</div>
      </div>
    </div>
  );
} 