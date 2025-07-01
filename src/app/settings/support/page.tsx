import React from 'react';

export default function SupportPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Support</h1>
      <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-blue-200">Contact Support</h2>
        <p className="text-gray-600 dark:text-blue-100 mb-2">Need help? Reach out to our support team or browse our help resources.</p>
        <div className="text-gray-400 dark:text-blue-300 italic">(Support contact info and FAQ coming soon...)</div>
      </div>
    </div>
  );
} 