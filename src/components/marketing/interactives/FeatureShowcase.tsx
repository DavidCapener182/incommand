'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { 
  Shield, AlertTriangle, Bell, Users, BarChart3, Lock, 
  MapPin, Activity, CheckCircle2, Wifi, TrendingUp, Map, FileCheck, Hash, MoreHorizontal, ChevronDown, Radio,
  type LucideIcon
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

type AccordionValue = string | undefined

type AccordionContextValue = {
  activeItem: AccordionValue
  setActiveItem: (value: AccordionValue) => void
}

type AccordionProps = {
  children: React.ReactNode
  defaultValue?: AccordionValue
  onValueChange?: (value: AccordionValue) => void
  className?: string
}

type AccordionItemProps = {
  children: React.ReactNode
  value: AccordionValue
  className?: string
}

type AccordionTriggerProps = {
  children: React.ReactNode
  className?: string
  value?: AccordionValue
}

type AccordionContentProps = {
  children: React.ReactNode
  className?: string
  value?: AccordionValue
}

type DashboardFrameProps = {
  children: React.ReactNode
  title: string
  badge?: string
}

type FeatureConfig = {
  id: string
  icon: LucideIcon
  title: string
  description: string
  visual: React.ComponentType
}

// --- UTILS ---
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// --- ACCORDION COMPONENTS ---
const AccordionContext = React.createContext<AccordionContextValue>({
  activeItem: undefined,
  setActiveItem: () => {}
})

const Accordion = ({ children, defaultValue, onValueChange, className }: AccordionProps) => {
  const [activeItem, setActiveItem] = useState<AccordionValue>(defaultValue)

  const handleValueChange = (value: AccordionValue) => {
    setActiveItem(value)
    if (onValueChange) onValueChange(value)
  }

  return (
    <AccordionContext.Provider value={{ activeItem, setActiveItem: handleValueChange }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

const AccordionItem = ({ children, value, className }: AccordionItemProps) => {
  return (
    <div className={cn("overflow-hidden", className)} data-value={value}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<{ value?: AccordionValue }>, { value }) 
          : child
      )}
    </div>
  )
}

const AccordionTrigger = ({ children, className, value }: AccordionTriggerProps) => {
  const { activeItem, setActiveItem } = React.useContext(AccordionContext)
  const isActive = activeItem === value

  return (
    <button
      onClick={() => setActiveItem(value)}
      className={cn("flex w-full items-center justify-between py-4 font-medium transition-all", className)}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400", isActive && "rotate-180")} />
    </button>
  )
}

const AccordionContent = ({ children, className, value }: AccordionContentProps) => {
  const { activeItem } = React.useContext(AccordionContext)
  const isActive = activeItem === value

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


// --- 1. REUSABLE DASHBOARD FRAME ---
const DashboardFrame = ({ children, title, badge }: DashboardFrameProps) => (
  <div className="flex h-full flex-col bg-white text-slate-900 shadow-sm relative z-10 font-sans">
    {/* App Header */}
    <div className="flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-3 shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <span className="text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">{title}</span>
      </div>
      {badge && (
        <motion.span 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-2 py-0.5 rounded-full bg-blue-50 text-[9px] font-bold text-blue-600 border border-blue-100 flex items-center gap-1"
        >
          <Wifi className="h-2 w-2 animate-pulse" /> {badge}
        </motion.span>
      )}
    </div>
    {/* Content Canvas */}
    <div className="flex-1 overflow-hidden p-3 relative bg-white">
      {children}
      {/* Subtle Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] z-0"></div>
    </div>
  </div>
)

// --- 2. IMPROVED VISUAL COMPONENTS ---

// VISUAL 1: Multi-Event (Staggered Cards & Filling Bars)
function MultiEventVisual() {
  const venues = [
    { name: 'Main Arena', status: 'LIVE', capacity: 92, color: 'emerald', bg: 'bg-emerald-100', image: '/assets/marketing/main-arena-concert.jpg' },
    { name: 'East Gate Plaza', status: 'LIVE', capacity: 78, color: 'blue', bg: 'bg-blue-100', image: '/assets/marketing/east-gate-plaza.jpg' },
    { name: 'Convention Ctr', status: 'STANDBY', capacity: 0, color: 'slate', bg: 'bg-slate-100', image: '/assets/marketing/convention-center.jpg' },
    { name: 'South Park', status: 'LIVE', capacity: 45, color: 'blue', bg: 'bg-blue-100', image: '/assets/marketing/south-park.jpg' },
  ]

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  }

  return (
    <DashboardFrame title="Global Command" badge="Multi-Site">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 grid-rows-2 gap-3 h-full w-full relative z-10" 
        style={{ gridAutoRows: '1fr' }}
      >
        {venues.map((venue, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all overflow-hidden h-full"
          >
             {/* Background Image */}
             <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
               {venue.image && (
                 <Image
                   src={venue.image}
                   alt={venue.name}
                   fill
                   className="object-cover opacity-60"
                   sizes="(min-width: 1024px) 50vw, 100vw"
                   priority={i < 2}
                 />
               )}
             </div>
             
             {/* Top gradient overlay - only behind title/status text */}
             <div 
               className="absolute top-0 left-0 right-0 h-12 pointer-events-none rounded-t-xl" 
               style={{
                 background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 70%, transparent 100%)'
               }}
             />
             
             {/* Bottom gradient overlay - only behind capacity text */}
             <div 
               className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none rounded-b-xl" 
               style={{
                 background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 70%, transparent 100%)'
               }}
             />

             {/* Decorative colored header */}
             <div className={`absolute top-0 left-0 right-0 h-1 ${venue.color === 'emerald' ? 'bg-emerald-500' : venue.color === 'blue' ? 'bg-blue-500' : 'bg-slate-300'} z-10`} />

            <div className="flex justify-between items-start relative z-10 mb-2">
              <div className="font-bold text-[10px] leading-tight text-slate-800 flex-1 mr-1">{venue.name}</div>
              <span className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0",
                venue.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : 
                venue.color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
              )}>
                {venue.color !== 'slate' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      venue.color === 'emerald' ? 'bg-emerald-400' : 'bg-blue-400'
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-1.5 w-1.5",
                      venue.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
                    )}></span>
                  </span>
                )}
                {venue.status}
              </span>
            </div>
            
            <div className="mt-auto relative z-10">
               {venue.status !== 'STANDBY' ? (
                 <>
                   <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                     <span>Cap.</span>
                     <motion.span 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="font-mono font-bold text-slate-700 text-[9px]"
                      >
                        {venue.capacity}%
                      </motion.span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: `${venue.capacity}%` }} 
                       transition={{ delay: 0.2 + (i*0.1), duration: 1.2, ease: "circOut" }}
                       className={cn("h-full rounded-full", venue.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} 
                     />
                   </div>
                 </>
               ) : (
                 <div className="flex items-center gap-1 text-[9px] text-slate-400 italic">
                   <Lock className="h-2.5 w-2.5" /> Offline
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </DashboardFrame>
  )
}

// VISUAL 2: Predictive Risk (Scanning Line & Dynamic Graph)
function RiskVisual() {
  return (
    <DashboardFrame title="Predictive AI" badge="Forecast">
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <motion.h4 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="text-lg font-bold text-slate-900 flex items-center gap-2"
            >
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Crowd Density
            </motion.h4>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xs text-slate-500 font-medium mt-1"
            >
              AI projects threshold breach.
            </motion.p>
          </div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
            className="px-3 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-100 shadow-sm"
          >
            Risk: HIGH
          </motion.div>
        </div>

        {/* Predictive Line Graph Visualization */}
        <div className="flex-1 relative flex items-end pb-6 overflow-hidden">
           {/* Chart grid lines */}
           <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-slate-400 pb-6 pointer-events-none">
             <div className="border-b border-slate-200 border-dashed flex items-center h-full"></div>
             <div className="border-b border-red-200 border-dashed flex items-center text-red-400 font-bold bg-red-50/30">CRITICAL</div>
             <div className="border-b border-slate-200 border-dashed flex items-center h-full"></div>
           </div>

           {/* The Trend Line (SVG) */}
           <svg className="absolute inset-0 h-[calc(100%-24px)] w-full z-20 overflow-visible" preserveAspectRatio="none">
             <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
             </defs>
             {/* Historical Data Line */}
             <motion.path
                d="M0,80 Q50,75 100,50 T200,45 T300,20" 
                fill="none" stroke="url(#trendGradient)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}
             />
              {/* Predictive Dashed Line */}
             <motion.path
                d="M300,20 Q350,5 400,-10" 
                fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }} animate={{ opacity: 1, pathLength: 1 }} transition={{ delay: 1.5, duration: 0.8 }}
             />
              {/* End Marker */}
              <motion.circle 
                cx="400" cy="-10" r="4" fill="#ef4444" stroke="white" strokeWidth="2"
                initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 2.2}} 
              />
           </svg>
           
           {/* Scanning Line Effect */}
           <motion.div 
             className="absolute top-0 bottom-6 w-px bg-slate-800/20 z-10"
             initial={{ left: '0%' }}
             animate={{ left: '100%' }}
             transition={{ duration: 2.5, ease: "linear", repeat: Infinity, repeatDelay: 1 }}
           >
              <div className="absolute top-0 -left-1 w-2 h-6 bg-gradient-to-b from-slate-400/0 via-slate-400/50 to-slate-400/0" />
           </motion.div>

           {/* X-Axis Labels */}
           <div className="absolute bottom-0 left-0 w-full flex justify-between text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-200">
             <span>-1h</span>
             <span>-30m</span>
             <span className="font-bold text-slate-900 bg-slate-100 px-1 rounded">NOW</span>
             <span className="text-red-500">+15m</span>
             <span className="text-red-500">+30m</span>
           </div>
        </div>
      </div>
    </DashboardFrame>
  )
}

// VISUAL 3: Alerts (Spring List & Bouncing)
function AlertsVisual() {
  type AlertPriority = 'critical' | 'high' | 'medium' | 'low'
  type AlertItem = {
    title: string
    loc: string
    time: string
    priority: AlertPriority
    icon: LucideIcon
  }

  const alerts: AlertItem[] = [
    { title: 'Medical Emergency', loc: 'Sector 4, Row G', time: 'now', priority: 'critical', icon: AlertTriangle },
    { title: 'Unauthorized Access', loc: 'Backstage Door 3', time: '2m', priority: 'high', icon: Lock },
    { title: 'Capacity Warning', loc: 'North Concourse', time: '5m', priority: 'medium', icon: Users },
    { title: 'Staff Redeployed', loc: 'Zone A to Zone B', time: '12m', priority: 'low', icon: CheckCircle2 },
  ]
  
  const getStyles = (p: AlertPriority) => {
    switch(p) {
      case 'critical': return 'bg-red-50 border-red-100 text-red-900'
      case 'high': return 'bg-amber-50 border-amber-100 text-amber-900'
      case 'medium': return 'bg-blue-50 border-blue-100 text-blue-900'
      default: return 'bg-slate-50 border-slate-100 text-slate-700'
    }
  }

  return (
    <DashboardFrame title="Operations Log" badge="LIVE">
       <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              Incoming Stream
            </span>
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </div>
         <AnimatePresence>
           {alerts.map((item, i) => (
             <motion.div 
               key={i}
               initial={{ x: 50, opacity: 0, height: 0 }}
               animate={{ x: 0, opacity: 1, height: "auto" }}
               transition={{ 
                 delay: i * 0.15, 
                 type: "spring", 
                 stiffness: 100, 
                 damping: 12 
               }}
               className={`flex items-start gap-3 p-3 rounded-lg border ${getStyles(item.priority)} shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden group`}
             >
               {item.priority === 'critical' && (
                 <motion.div 
                   className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" 
                   initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ delay: 0.5 }}
                 />
               )}
               
               <div className={`mt-0.5 shrink-0 p-1.5 rounded-full bg-white/50 backdrop-blur-sm`}>
                 <item.icon className="h-4 w-4" />
               </div>
               
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold truncate">{item.title}</span>
                   <span className="text-[9px] opacity-70 font-mono uppercase bg-white/50 px-1 rounded">{item.time}</span>
                 </div>
                 <p className="text-[10px] opacity-80 truncate mt-0.5 font-medium flex items-center gap-1">
                   <MapPin className="h-3 w-3" /> {item.loc}
                 </p>
               </div>
             </motion.div>
           ))}
         </AnimatePresence>
       </div>
    </DashboardFrame>
  )
}

// VISUAL 4: Staff (CAD Style Map)
function StaffVisual() {
    const zones = [
        { id: 'N', name: 'Main Stage', staff: 12, status: 'ok', x: 38, y: 25 },
        { id: 'E', name: 'East Gate', staff: 8, status: 'low', x: 85, y: 25 },
        { id: 'S', name: 'South Stage', staff: 15, status: 'ok', x: 65, y: 70 },
        { id: 'W', name: 'West Vendor', staff: 24, status: 'busy', x: 30, y: 50 },
        { id: 'HQ', name: 'HQ', staff: 5, status: 'critical', x: 50, y: 50 },
    ]

  return (
    <DashboardFrame title="Resource Map" badge="GPS Active">
      <div className="h-full flex flex-col z-10 relative">
        {/* Abstract Map Visualization */}
        <div className="flex-1 relative rounded-xl border border-slate-200 overflow-hidden shadow-inner bg-blue-50/30">
            {/* CAD Map Background - replaced next/image with img tag for compatibility */}
            <div className="absolute inset-0 pointer-events-none opacity-60 z-0">
                <Image
                  src="/image_0.png"
                  alt="Festival CAD Map"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
            </div>

        </div>
      </div>
    </DashboardFrame>
  )
}

// VISUAL 5: Data Decisions (Pulsing Heatmap & Rolling Counter)
function DataVisual() {
    const heatmapData = [30, 55, 80, 45, 92, 60, 20, 40, 75]
    
    const getColor = (val: number) => {
        if (val > 85) return 'bg-red-500'
        if (val > 60) return 'bg-amber-500'
        if (val > 40) return 'bg-blue-500'
        return 'bg-emerald-500'
    }

    // Number counting animation
    type CounterProps = { from: number; to: number }
    const Counter = ({ from, to }: CounterProps) => {
      const [count, setCount] = useState(from)
      useEffect(() => {
        const controls: { value: number; start?: number } = { value: from }
        const step = (timestamp: number) => {
          if (!controls.start) controls.start = timestamp
          const progress = Math.min((timestamp - controls.start) / 1000, 1) // 1 second
          setCount(Math.floor(progress * (to - from) + from))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, [from, to])
      return <span>{count.toLocaleString()}</span>
    }

  return (
    <DashboardFrame title="Analytics Hub" badge="Heatmap">
       <div className="h-full flex flex-col gap-4 relative z-10">
         <div className="flex justify-between items-end">
             <div>
                <motion.h4 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-slate-900 tabular-nums"
                >
                  <Counter from={0} to={14205} />
                </motion.h4>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Activity className="h-3 w-3 text-blue-500" /> Current Attendance
                </p>
             </div>
             <div className="text-right">
                 <div className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                     <TrendingUp className="h-3 w-3" /> +12%
                 </div>
             </div>
         </div>

        <div className="flex-1 relative flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] font-bold text-slate-700">Real-Time Density</div>
              <div className="flex gap-1">
                 <div className="h-2 w-2 bg-red-500 rounded-sm"></div>
                 <div className="h-2 w-2 bg-amber-500 rounded-sm"></div>
                 <div className="h-2 w-2 bg-blue-500 rounded-sm"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 grid-rows-3 gap-1 flex-1 rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
                {heatmapData.map((val, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0.6, 1, 0.6],
                          scale: 1,
                          backgroundColor: val > 80 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255,255,255,0)'
                        }}
                        transition={{ 
                          opacity: { repeat: Infinity, duration: 2 + (Math.random() * 2), ease: "easeInOut" },
                          delay: i * 0.05 
                        }}
                        className={cn(
                          "relative group flex items-center justify-center rounded-md transition-colors duration-500", 
                          getColor(val),
                          "bg-opacity-80"
                        )}
                    >
                        <span className="text-white font-bold text-xs opacity-80">{val}%</span>
                    </motion.div>
                ))}
            </div>
        </div>
       </div>
    </DashboardFrame>
  )
}

// VISUAL 6: Compliance (Typewriter & Drawing Timeline)
function ComplianceVisual() {
    const logs = [
      { id: '0xA4B2', action: 'Protocol Alpha Init', user: 'System AI', time: '10:42:15', status: 'verified' },
      { id: '0xB7C9', action: 'Zone C Lockdown', user: 'Admin_Lead', time: '10:45:22', status: 'verified' },
      { id: '0xD2E4', action: 'Incident #442 Filed', user: 'Officer_42', time: '10:58:01', status: 'pending' },
    ].reverse()

  return (
    <DashboardFrame title="Audit Trail" badge="Immutable">
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex-1 space-y-4 mt-2 relative pl-2">
            {/* Timeline stem drawing itself */}
            <motion.div 
              initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 1 }}
              className="absolute left-[20px] top-2 bottom-0 w-0.5 bg-slate-200 z-0 origin-top" 
            />
            
            {logs.map((log, i) => (
            <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.4) }}
                className="relative z-10 pl-8"
            >
                {/* Timeline Node Pop */}
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + (i * 0.4), type: "spring" }}
                  className={cn(
                    "absolute left-0 top-3 h-6 w-6 rounded-full border-[2px] border-white shadow-sm flex items-center justify-center z-10",
                    log.status === 'verified' ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                  )}
                >
                    {log.status === 'verified' ? <FileCheck className="h-3 w-3" /> : <MoreHorizontal className="h-3 w-3" />}
                </motion.div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                        <div className="text-[10px] font-bold text-slate-800">{log.action}</div>
                        <div className="text-[8px] font-mono text-slate-400 bg-slate-50 px-1 rounded border border-slate-100 flex items-center gap-0.5">
                            <Hash className="h-2 w-2" /> {log.id}
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px]">
                        <span className="font-medium text-slate-500 flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" /> {log.user}
                        </span>
                        <span className="font-mono text-slate-400">{log.time}</span>
                    </div>
                </div>
            </motion.div>
            ))}
        </div>
        
        {/* Animated Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}
          className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-center text-[10px] text-slate-500 gap-1.5 bg-slate-50/50 p-2 rounded-b-lg"
        >
            <Lock className="h-3 w-3 text-emerald-500" />
            <span className="font-medium">Blockchain Verified</span>
        </motion.div>
      </div>
    </DashboardFrame>
  )
}

// --- 3. MAIN COMPONENT ---

const features: FeatureConfig[] = [
  { 
    id: 'multi-event',
    icon: Shield, 
    title: 'Oversee Multiple Events', 
    description: 'Manage multiple sites, venues, or events from one dashboard — with dedicated access levels and live status overview.',
    visual: MultiEventVisual
  },
  { 
    id: 'predict-risks',
    icon: TrendingUp, 
    title: 'Predict Emerging Risks', 
    description: 'AI-powered analytics forecast crowd density and potential bottlenecks before they breach critical safety thresholds.',
    visual: RiskVisual
  },
  { 
    id: 'real-time-alerts',
    icon: Bell, 
    title: 'Real-Time Alerts', 
    description: 'A prioritized live stream of incidents keeps control rooms aligned, ensuring critical issues are addressed immediately.',
    visual: AlertsVisual
  },
  { 
    id: 'staff-assignment',
    icon: MapPin, 
    title: 'Smarter Deployment', 
    description: 'Visual map-based dashboards make it easy to track team locations, manage zone coverage, and reassign staff instantly.',
    visual: StaffVisual
  },
  { 
    id: 'data-decisions',
    icon: Activity, 
    title: 'Data-Driven Decisions', 
    description: 'Utilize dynamic crowd heatmaps and historical benchmarking to make informed operational adjustments on the fly.',
    visual: DataVisual
  },
  { 
    id: 'compliance',
    icon: FileCheck, 
    title: 'Compliance & Audit', 
    description: 'Maintain an immutable, time-stamped audit trail of all system actions, fully aligned with regulatory standards.',
    visual: ComplianceVisual
  },
]

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          
          {/* Left Column: Accordion */}
          <Accordion 
            defaultValue="item-0" 
            className="space-y-4"
            onValueChange={(val) => {
              if (val) setActiveFeature(parseInt(val.split('-')[1]))
            }}
          >
            {features.map(({ title, description, icon: Icon }, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className={cn(
                  "rounded-2xl border px-6 transition-all duration-300 overflow-hidden",
                  activeFeature === index 
                    ? "border-blue-600/30 bg-white shadow-md shadow-blue-900/5 pb-2 ring-1 ring-blue-600/10" 
                    : "border-transparent hover:bg-white/60"
                )}
              >
                <AccordionTrigger className="py-5 text-left hover:no-underline group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                      activeFeature === index 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "bg-white border border-slate-200 text-slate-400 group-hover:border-blue-300 group-hover:text-blue-600"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={cn(
                      "text-xl font-bold transition-colors",
                      activeFeature === index ? "text-slate-900" : "text-slate-600"
                    )}>
                      {title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-[4rem] text-base leading-relaxed text-slate-600 pb-4 pr-4 font-medium">
                  {description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right Column: Animated Visuals */}
          <div className="hidden lg:block relative h-full min-h-[600px] perspective-[2000px]">
            <div className="sticky top-24 w-full aspect-[9/16] max-h-[650px] overflow-hidden rounded-[3rem] bg-slate-900 border-[12px] border-slate-900 shadow-[0_50px_100px_-20px_rgba(50,50,93,0.25),0_30px_60px_-30px_rgba(0,0,0,0.3),inset_0_-2px_6px_rgba(255,255,255,0.2)] ring-1 ring-slate-900/5 transform rotate-y-[-15deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-in-out">
              
              {/* Screen Content */}
              <div className="h-full w-full bg-white relative overflow-hidden rounded-[2.2rem]">
                <AnimatePresence mode="wait">
                  {features.map((feature, index) => (
                    activeFeature === index && (
                      <motion.div 
                        key={feature.id}
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(2px)'}}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 h-full w-full"
                      >
                        <feature.visual />
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Decorative Background Blurs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/30 blur-[120px] -z-10 rounded-full mix-blend-multiply pointer-events-none opacity-70" />
             <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-400/20 blur-[100px] -z-10 rounded-full mix-blend-multiply pointer-events-none opacity-60" />
          </div>
        </div>
      </div>
    </div>
  )
}
