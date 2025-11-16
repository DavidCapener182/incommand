'use client'

import React from 'react'

export default function FootballCard_Transport({ className }: { className?: string }) {
  const data = {
    transport: {
      rail: 'Operating Normally',
      buses: '60% Capacity',
      taxi: 'Moderate Wait (1–10 mins)',
      closures: ['Walton Breck Rd (Planned)'],
    },
  }

  return (
    <div className={`h-full card-depth flex flex-col justify-between ${className || ''}`}>
      <h3 className="text-gray-800 font-semibold text-lg mb-3">Transport Status</h3>
      <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Rail:</strong> {data.transport.rail}</p>
        <p><strong>Buses:</strong> {data.transport.buses}</p>
        <p><strong>Taxi:</strong> {data.transport.taxi}</p>
        <p><strong>Road Closures:</strong></p>
        <ul className="list-disc ml-4 text-xs">
          {data.transport.closures.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}