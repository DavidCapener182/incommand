'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { 
  Train, 
  Bus, 
  Car, 
  AlertTriangle, 
  MoreHorizontal,
  MapPin,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FootballData } from '@/types/football'
import { StatusType } from '@/components/football/StatusIndicator'

interface FootballCard_TransportProps {
  className?: string
  onOpenModal?: () => void
}

// --- Helper Components ---
const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md h-full relative overflow-hidden", className)}>
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action }: { icon: any; title: string; action?: () => void }) => (
  <div className="flex items-center justify-between mb-3 shrink-0">
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
    {action && (
      <button onClick={action} className="text-slate-400 hover:text-slate-600 transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    )}
  </div>
)

const TransportItem = ({ 
  icon: Icon, 
  label, 
  status 
}: { 
  icon: any
  label: string
  status: string 
}) => {
  const type = parseTransportStatus(status)
  
  const styles = {
    normal: "text-emerald-700 bg-emerald-50 border-emerald-100",
    busy: "text-amber-700 bg-amber-50 border-amber-100",
    alert: "text-red-700 bg-red-50 border-red-100"
  }

  return (
    <div className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      </div>
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wide", styles[type])}>
        {status}
      </span>
    </div>
  )
}

function parseTransportStatus(status: string): StatusType {
  const lower = status.toLowerCase()
  if (lower.includes('delay') || lower.includes('disruption') || lower.includes('closed') || lower.includes('cancelled')) {
    return 'alert'
  }
  if (lower.includes('busy') || lower.includes('wait') || lower.includes('capacity') || lower.includes('%')) {
    return 'busy'
  }
  return 'normal'
}

export default function FootballCard_Transport({ className = '', onOpenModal }: FootballCard_TransportProps) {
  const [data, setData] = useState<FootballData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // --- Fetch Logic ---
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/football/data')
        if (res.ok) {
          const json = await res.json()
          if (mounted) setData(json.data)
        }
      } catch (e) {}
    }
    load()
    if (autoRefresh) {
      const id = setInterval(load, 60000)
      return () => { mounted = false; clearInterval(id) }
    }
    return () => { mounted = false }
  }, [autoRefresh])

  // --- Status Calculation ---
  const statusType = useMemo((): StatusType => {
    if (!data) return 'normal'
    const t = data.transportWeather.transport
    const statuses = [t.rail, t.buses, t.taxi]
    if (statuses.some(s => parseTransportStatus(s) === 'alert') || (t.roadClosures?.length ?? 0) > 0) return 'alert'
    if (statuses.some(s => parseTransportStatus(s) === 'busy')) return 'busy'
    return 'normal'
  }, [data])

  const handleExport = async () => {
    try {
      const res = await fetch('/api/football/export/transport?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) { /* Download logic */ }
    } catch (e) {}
  }

  return (
    <CardFrame className={className}>
      <CardHeader 
        icon={Train} 
        title="Transport Status" 
        action={onOpenModal} 
      />

      {!data ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs animate-pulse">
           <div className="h-8 w-8 rounded bg-slate-100 mb-2" />
           Loading data...
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0 justify-between">
           
           {/* Header Status Badge */}
           <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Status</p>
              <div className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
                statusType === 'alert' ? "bg-red-100 text-red-700" :
                statusType === 'busy' ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              )}>
                {statusType === 'normal' ? 'Normal Service' : statusType === 'busy' ? 'Delays Reported' : 'Issues Reported'}
              </div>
           </div>

           {/* Transport Rows */}
           <div className="flex-1 flex flex-col gap-2">
              <TransportItem 
                icon={Train} 
                label="Rail" 
                status={data.transportWeather.transport.rail} 
              />
              <TransportItem 
                icon={Bus} 
                label="Buses" 
                status={data.transportWeather.transport.buses} 
              />
              <TransportItem 
                icon={Car} 
                label="Taxi" 
                status={data.transportWeather.transport.taxi} 
              />
              
              {/* Road Closures (Conditional) */}
              {data.transportWeather.transport.roadClosures && data.transportWeather.transport.roadClosures.length > 0 && (
                <div className="mt-1 flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                   <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                   <div className="min-w-0">
                      <p className="text-[10px] font-bold text-red-700 uppercase mb-0.5">Road Closures</p>
                      <p className="text-xs font-medium text-red-900 leading-tight truncate">
                        {data.transportWeather.transport.roadClosures.join(', ')}
                      </p>
                   </div>
                </div>
              )}
           </div>

           {/* Footer: Last Updated / Export Link */}
           <div className="mt-3 pt-2 border-t border-slate-50 flex justify-center">
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Export transport report</span>
              </button>
           </div>

        </div>
      )}
    </CardFrame>
  )
}