'use client'

import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  CheckCircle, 
  Users, 
  MapPin,
  Clock,
  Activity,
  Radio,
} from 'lucide-react'

const HeroCards = () => {
  const [activeCard, setActiveCard] = useState(0)

  // The "Countdown Timer" / Auto-switcher logic
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3)
    }, 4000) 

    return () => clearInterval(timer)
  }, [])

  const cards = [
    {
      id: 'monitoring',
      title: 'OPERATIONS • LIVE',
      content: (
        <>
          <div className="flex items-start gap-4 p-3 bg-red-50 rounded-lg border border-red-100 transition-all duration-500">
            <div className="bg-red-100 p-2 rounded-full shrink-0">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-900">Capacity Warning: Sector 4</div>
              <div className="text-xs text-red-700 mt-1">Crowd density exceeded 85%. Dispatching nearby stewards.</div>
            </div>
            <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-200 shrink-0">NOW</span>
          </div>
          <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100 transition-all duration-500 delay-100">
             <div className="bg-blue-100 p-2 rounded-full shrink-0">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-blue-900">Staff Check-in Complete</div>
              <div className="text-xs text-blue-700 mt-1">North Gate team is fully staffed and online.</div>
            </div>
            <span className="text-xs text-slate-500 shrink-0">2m ago</span>
          </div>
          <div className="h-24 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
              <div className="text-center">
                 <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                   <Activity className="w-4 h-4" /> Live Metrics
                 </div>
                 <div className="text-slate-400 text-sm">Processing Crowd Data...</div>
              </div>
           </div>
        </>
      )
    },
    {
      id: 'incident',
      title: 'INCIDENT LOGGING',
      content: (
        <>
           <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm ring-1 ring-slate-900/5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-500">INC-2024-892</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold uppercase tracking-wide">High Priority</span>
              </div>
              
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Medical Assistance Required</h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                 <MapPin className="w-3 h-3" />
                 <span>Main Stage Barrier, Left Side</span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">JD</div>
                <div className="text-xs text-slate-600"><span className="font-medium text-slate-900">John Doe</span> assigned to respond.</div>
              </div>
           </div>
           <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 opacity-60">
             <div className="bg-slate-200 p-1.5 rounded-md">
               <Clock className="w-4 h-4 text-slate-500" />
             </div>
             <div className="text-xs text-slate-500">Previous incidents archived automatically.</div>
           </div>
        </>
      )
    },
    {
      id: 'staff',
      title: 'TEAM MANAGEMENT',
      content: (
        <>
           <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-3">
                 <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><Radio className="w-4 h-4"/></div>
                 <div>
                    <div className="text-sm font-bold text-emerald-900">Response Team A</div>
                    <div className="text-xs text-emerald-700">Active • Channel 4</div>
                 </div>
              </div>
              <div className="flex -space-x-1">
                {[
                  { i: 1, bg: 'bg-emerald-300' },
                  { i: 2, bg: 'bg-emerald-500' },
                  { i: 3, bg: 'bg-emerald-700' }
                ].map(({ i, bg }) => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${bg} flex items-center justify-center text-[8px] font-bold text-emerald-900`}>
                    {i}
                  </div>
                ))}
              </div>
           </div>
           <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Comms</div>
              <div className="flex gap-3">
                <div className="w-1 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="text-xs font-medium text-slate-900">Redeployment Order</div>
                  <div className="text-[10px] text-slate-500">Move to East Entrance for ingress support.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 bg-slate-300 rounded-full"></div>
                <div>
                  <div className="text-xs font-medium text-slate-900">Shift Briefing</div>
                  <div className="text-[10px] text-slate-500">Completed at 14:00.</div>
                </div>
              </div>
           </div>
        </>
      )
    }
  ]

  return (
    <div className="relative mt-12 lg:mt-0 w-full perspective-1000">
      <div className="relative mx-auto w-full max-w-lg rotate-2 transform transition-all duration-700 hover:rotate-0 lg:rotate-y-6">
        <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_40px_90px_-40px_rgba(15,23,42,0.95)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs font-mono font-bold text-slate-400 tracking-wider">
              {cards[activeCard].title}
            </div>
          </div>
          
          {/* Dynamic Content */}
          <div className="space-y-4 flex-1 relative">
            {cards.map((card, index) => (
              <div 
                key={card.id}
                className={`space-y-4 transition-all duration-500 absolute w-full top-0 left-0 ${
                  index === activeCard 
                    ? 'opacity-100 translate-x-0 visible' 
                    : 'opacity-0 translate-x-8 invisible'
                }`}
              >
                {card.content}
              </div>
            ))}
          </div>
          {/* Pagination Indicators */}
          <div className="mt-auto pt-6 flex justify-center gap-2">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCard(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeCard ? 'w-8 bg-[#23408e]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Floating Badge - Constant */}
        <div className="absolute -bottom-6 -left-6 z-10 flex items-center gap-3 rounded-xl bg-emerald-500 p-4 text-white shadow-xl shadow-emerald-900/30 animate-bounce-slow">
           <ShieldCheck className="w-8 h-8" />
           <div>
              <div className="font-bold text-lg">System Active</div>
              <div className="text-xs opacity-90">100% Uptime</div>
           </div>
        </div>
      </div>
    </div>
  )
}

export default HeroCards
