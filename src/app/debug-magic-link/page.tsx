'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DebugMagicLinkPage() {
  const searchParams = useSearchParams();
  const entries = Array.from(searchParams?.entries?.() ?? []);
  const [hash, setHash] = useState('');

  useEffect(() => {
    setHash(window.location.hash);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Magic Link Debug Page</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Full URL:</h2>
            <p className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
              {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
            </p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">URL Hash:</h2>
            <p className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
              {hash || 'No hash'}
            </p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Query Parameters:</h2>
            <div className="bg-gray-100 p-2 rounded">
              <ul className="space-y-1">
                {entries.map(([key, value]) => (
                  <li key={key} className="font-mono text-sm">
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
                {entries.length === 0 && (
                  <li className="text-gray-500">No query parameters</li>
                )}
              </ul>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">All Search Params:</h2>
            <div className="bg-gray-100 p-2 rounded">
              <pre className="text-sm">
                {JSON.stringify(Object.fromEntries(entries), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
