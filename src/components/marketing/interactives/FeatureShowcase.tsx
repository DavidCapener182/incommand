'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Shield, AlertTriangle, Bell, Users, BarChart3, Lock, 
  MapPin, Activity, CheckCircle2, Search, Wifi
} from 'lucide-react'
import { clsx } from 'clsx'

// --- 1. REUSABLE DASHBOARD FRAME ---
const DashboardFrame = ({ children, title, badge }: { children: React.ReactNode; title: string, badge?: string }) => (
  <div className="flex h-full flex-col bg-white text-slate-900 shadow-sm">
    {/* App Header */}
    <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        </div>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <span className="text-xs font-bold tracking-wide text-slate-700 uppercase">{title}</span>
      </div>
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
          {badge}
        </span>
      )}
    </div>
    {/* Content Canvas */}
    <div className="flex-1 overflow-hidden p-6 relative bg-slate-50/50">
      {children}
    </div>
  </div>
)

// --- 2. VISUAL COMPONENTS ---

function MultiEventVisual() {
  return (
    <DashboardFrame title="Global Command" badge="4 Active">
      <div className="grid grid-cols-2 gap-4 h-full">
        {[1, 2, 3, 4].map((i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
               <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
               <div className="h-2 w-20 bg-slate-800 rounded-md opacity-10 group-hover:opacity-20 transition-opacity" />
            </div>

            {/* Map Graphic */}
            <div className="absolute inset-0 rounded-xl overflow-hidden z-0 opacity-0 group-hover:opacity-10 transition-opacity">
               <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:8px_8px]" />
            </div>
          </motion.div>
        ))}
        
        {/* Floating Overlay Button */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-medium shadow-xl flex items-center gap-2"
        >
          <Wifi className="h-3 w-3" />
          <span>Network Stable</span>
        </motion.div>
      </div>
    </DashboardFrame>
  )
}

function RiskVisual() {
  return (
    <DashboardFrame title="Predictive Analysis" badge="AI Active">
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-2xl font-bold text-slate-900">92%</h4>
            <p className="text-xs text-slate-500 font-medium">Safety Score</p>
          </div>
          <div className="h-10 w-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        </div>

        <div className="relative h-40 w-full flex items-end gap-1.5 mt-4">
          {[35, 55, 40, 70, 85, 60, 75, 50, 90, 65].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.5, type: "spring" }}
              className={clsx(
                "w-full rounded-t-sm relative group",
                h > 80 ? "bg-amber-500" : "bg-blue-500"
              )}
            >
              {/* Tooltip line */}
              <div className="absolute bottom-0 left-0 w-full bg-white/20 h-0 group-hover:h-full transition-all duration-300" />
            </motion.div>
          ))}
          {/* Threshold Line */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute top-[20%] left-0 h-px bg-red-400 border-t border-dashed border-red-500 opacity-50"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.8 }}
          className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2"
        >
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-900">Predicted Surge</p>
            <p className="text-[10px] text-red-700">Gate B capacity may exceed limits in 15m.</p>
          </div>
        </motion.div>
      </div>
    </DashboardFrame>
  )
}

function AlertsVisual() {
  return (
    <DashboardFrame title="Live Operations" badge="Real-time">
       <div className="space-y-3">
         {[
           { title: 'Medical Request', loc: 'Section 104', time: 'Just now', color: 'bg-red-50 border-red-200 text-red-700', icon: AlertTriangle },
           { title: 'Capacity Warning', loc: 'North Concourse', time: '2m ago', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Users },
           { title: 'Team Deployed', loc: 'Gate A', time: '5m ago', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: CheckCircle2 },
         ].map((item, i) => (
           <motion.div 
             key={i}
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: i * 0.15 }}
             className={`flex items-center gap-3 p-3 rounded-xl border ${item.color} bg-white shadow-sm`}
           >
             <div className={`p-2 rounded-lg bg-white/50`}>
               <item.icon className="h-4 w-4" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center">
                 <span className="text-sm font-bold truncate">{item.title}</span>
                 <span className="text-[10px] opacity-70 font-mono">{item.time}</span>
               </div>
               <p className="text-xs opacity-80 truncate">{item.loc}</p>
             </div>
           </motion.div>
         ))}
         
         {/* Scanning Animation */}
         <motion.div 
           className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20"
           animate={{ top: ["0%", "100%"] }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
         />
       </div>
    </DashboardFrame>
  )
}

function StaffVisual() {
  return (
    <DashboardFrame title="Resource Allocation">
      <div className="space-y-5 mt-2">
        {[
          { label: 'Security', val: 92, color: 'bg-blue-600' },
          { label: 'Medical', val: 100, color: 'bg-emerald-500' },
          { label: 'Stewards', val: 78, color: 'bg-amber-500' }
        ].map((role, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>{role.label}</span>
              <span>{role.val}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${role.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${role.val}%` }}
                transition={{ duration: 1, delay: 0.2 + (i * 0.2), ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-slate-900 rounded-xl text-white flex justify-between items-center"
      >
        <div>
          <p className="text-[10px] text-slate-400 uppercase">Total Staff</p>
          <p className="text-xl font-bold">142 / 150</p>
        </div>
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
      </motion.div>
    </DashboardFrame>
  )
}

function DataVisual() {
  return (
    <DashboardFrame title="Live Analytics">
       <div className="grid grid-cols-2 gap-3 h-full">
         <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="col-span-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg"
         >
           <div className="flex justify-between items-start mb-4">
             <Activity className="h-5 w-5 text-blue-400" />
             <span className="text-xs font-mono text-slate-400">LIVE</span>
           </div>
           <div className="text-3xl font-bold mb-1">14,205</div>
           <div className="text-xs text-slate-400">Current Attendance</div>
         </motion.div>

         <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-center items-center"
         >
            <div className="text-2xl font-bold text-emerald-600">Low</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Risk Level</div>
         </motion.div>

         <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-center items-center"
         >
            <div className="text-2xl font-bold text-blue-600">98%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Uptime</div>
         </motion.div>
       </div>
    </DashboardFrame>
  )
}

function ComplianceVisual() {
  return (
    <DashboardFrame title="Audit Trail" badge="Secure">
      <div className="relative pl-4 space-y-6 mt-2">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200" />
        
        {[
          { user: 'System', action: 'Protocol Alpha Initiated', time: '10:42 AM', color: 'bg-blue-500' },
          { user: 'Admin', action: 'Zone C Lockdown', time: '10:45 AM', color: 'bg-amber-500' },
          { user: 'Officer 42', action: 'Incident Report Filed', time: '10:58 AM', color: 'bg-emerald-500' },
        ].map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="relative"
          >
            <div className={`absolute -left-[15px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${log.color}`} />
            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-800">{log.action}</div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-medium text-slate-500">{log.user}</span>
                <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardFrame>
  )
}

// --- 3. MAIN COMPONENT ---

const features = [
  { 
    id: 'multi-event',
    icon: Shield, 
    title: 'Oversee Multiple Events', 
    description: 'Manage multiple sites, venues, or events from one dashboard — with dedicated access levels.',
    visual: MultiEventVisual
  },
  { 
    id: 'predict-risks',
    icon: AlertTriangle, 
    title: 'Predict Emerging Risks', 
    description: 'AI-powered analytics highlight emerging trends and potential issues before they affect safety.',
    visual: RiskVisual
  },
  { 
    id: 'real-time-alerts',
    icon: Bell, 
    title: 'Real-Time Alerts', 
    description: 'Smart notifications keep control rooms and field teams aligned, ensuring no critical incident goes unseen.',
    visual: AlertsVisual
  },
  { 
    id: 'staff-assignment',
    icon: Users, 
    title: 'Smarter Deployment', 
    description: 'Visual dashboards make it easy to deploy teams, manage skills coverage, and reassign staff instantly.',
    visual: StaffVisual
  },
  { 
    id: 'data-decisions',
    icon: BarChart3, 
    title: 'Data-Driven Decisions', 
    description: 'Analyse incident data, track response times, and benchmark performance using dynamic heatmaps.',
    visual: DataVisual
  },
  { 
    id: 'compliance',
    icon: Lock, 
    title: 'Compliance & Audit', 
    description: 'Maintain a full audit trail of actions, aligned with UK JESIP frameworks and GDPR standards.',
    visual: ComplianceVisual
  },
]

export const FeatureShowcase = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Header */}
      <div className="w-full max-w-6xl py-6">
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-16 items-start">
          
          {/* Left Column: Accordion */}
          <Accordion 
            type="single" 
            defaultValue="item-0" 
            className="space-y-4"
            onValueChange={(val) => {
              if (val) {
                const index = parseInt(val.split('-')[1])
                setActiveFeature(index)
              }
            }}
          >
            {features.map(({ title, description, icon: Icon }, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className={clsx(
                  "rounded-2xl border px-6 transition-all duration-300",
                  activeFeature === index 
                    ? "border-blue-200 bg-blue-50/50 shadow-sm pb-2" 
                    : "border-transparent hover:bg-slate-50"
                )}
              >
                <AccordionTrigger className="py-5 text-left hover:no-underline group">
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                      activeFeature === index 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                        : "bg-white border border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-600"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={clsx(
                      "text-xl font-semibold transition-colors",
                      activeFeature === index ? "text-blue-900" : "text-slate-600"
                    )}>
                      {title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-[4rem] text-base leading-relaxed text-slate-600">
                  {description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right Column: Animated Visuals */}
          <div className="hidden lg:block relative h-full min-h-[580px]">
            <div className="sticky top-24 w-full aspect-[4/5] max-h-[600px] overflow-hidden rounded-[2.5rem] bg-slate-100 border-[8px] border-slate-900 shadow-2xl ring-1 ring-slate-900/5">
              
              {/* Screen Content */}
              <div className="h-full w-full bg-white relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {features.map((feature, index) => (
                    activeFeature === index && (
                      <motion.div 
                        key={feature.id}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 h-full w-full"
                      >
                        <feature.visual />
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>

              {/* Phone Notch / UI element */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-2xl z-20" />
            </div>
            
            {/* Decorative Background Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-blue-600/20 blur-[100px] -z-10 rounded-full pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}