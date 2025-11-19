'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Shield, AlertTriangle, Bell, Users, BarChart3, Lock, MapPin, CheckCircle2, Activity } from 'lucide-react'
import { clsx } from 'clsx'

// --- 1. VISUAL MOCKUPS (Light Mode Versions) ---

const DashboardFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="flex h-full flex-col bg-white text-slate-900">
    {/* Fake Browser/App Header */}
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-4 py-3">
      <div className="flex gap-2">
        <div className="h-3 w-3 rounded-full bg-red-400/80 border border-red-500/20" />
        <div className="h-3 w-3 rounded-full bg-amber-400/80 border border-amber-500/20" />
        <div className="h-3 w-3 rounded-full bg-emerald-400/80 border border-emerald-500/20" />
      </div>
      <div className="text-xs font-medium text-slate-500">{title}</div>
      <div className="h-4 w-4 opacity-0" />
    </div>
    {/* Content Area */}
    <div className="flex-1 overflow-hidden p-6 relative bg-slate-50/30">
      {children}
    </div>
  </div>
)

function MultiEventVisual() {
  return (
    <DashboardFrame title="Command Center • Multi-View">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Venue {String.fromCharCode(64+i)}</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="h-16 w-full rounded bg-slate-100 relative overflow-hidden border border-slate-100">
               {/* Fake map lines */}
               <div className="absolute inset-0 border-t border-l border-slate-900/5 opacity-40" style={{ transform: 'rotate(15deg) scale(1.5)' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-6 left-6 right-6 rounded-lg bg-blue-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors cursor-default">
        View Global Map
      </div>
    </DashboardFrame>
  )
}

function RiskVisual() {
  return (
    <DashboardFrame title="AI Risk Analysis">
      <div className="flex items-center justify-between mb-6">
         <div>
           <div className="text-2xl font-bold text-slate-900">High Risk</div>
           <div className="text-xs text-red-600 font-medium">Crowd crush potential detected</div>
         </div>
         <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
           <Activity className="h-5 w-5" />
         </div>
      </div>
      {/* Chart Mockup */}
      <div className="flex h-32 items-end justify-between gap-2">
        {[30, 45, 35, 60, 75, 90, 65, 80].map((h, i) => (
          <div key={i} className="w-full rounded-t bg-slate-100 relative group">
            <div 
              className={clsx("absolute bottom-0 w-full rounded-t transition-all duration-1000", h > 70 ? "bg-red-500" : "bg-blue-500")} 
              style={{ height: `${h}%` }} 
            />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded bg-white p-3 text-xs text-slate-600 border border-slate-200 shadow-sm border-l-4 border-l-red-500">
        <span className="text-slate-900 font-bold">Alert:</span> Sector 4 density exceeding safety threshold by 15%.
      </div>
    </DashboardFrame>
  )
}

function AlertsVisual() {
  return (
    <DashboardFrame title="Live Feed">
       <div className="space-y-3">
         {[
           { title: 'Medical Emergency', loc: 'Gate A', time: 'Now', color: 'text-red-800 border-red-200 bg-red-50' },
           { title: 'Unauthorized Access', loc: 'Backstage', time: '2m', color: 'text-amber-800 border-amber-200 bg-amber-50' },
           { title: 'Staff Check-in', loc: 'Zone B', time: '5m', color: 'text-blue-800 border-blue-200 bg-blue-50' },
         ].map((item, i) => (
           <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 shadow-sm ${item.color}`}>
             <Bell className="h-4 w-4 shrink-0 opacity-75" />
             <div className="min-w-0 flex-1">
               <div className="font-bold text-sm opacity-90">{item.title}</div>
               <div className="text-xs opacity-75 font-medium">{item.loc}</div>
             </div>
             <div className="text-[10px] font-mono opacity-60 font-semibold">{item.time}</div>
           </div>
         ))}
       </div>
    </DashboardFrame>
  )
}

function StaffVisual() {
  return (
    <DashboardFrame title="Roster Management">
      <div className="flex gap-2 mb-4">
        <span className="px-2 py-1 rounded bg-blue-600 text-[10px] font-bold text-white shadow-sm">ALL STAFF</span>
        <span className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500 shadow-sm">AVAILABLE</span>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                 <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="h-2 w-20 rounded bg-slate-200 mb-1" />
                <div className="h-1.5 w-12 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full w-[70%] bg-emerald-500" />
      </div>
      <div className="mt-1 text-[10px] text-right text-emerald-600 font-bold">70% Coverage</div>
    </DashboardFrame>
  )
}

function DataVisual() {
  return (
    <DashboardFrame title="Analytics Export">
       <div className="grid grid-cols-2 gap-4 h-full">
         <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
           <BarChart3 className="h-5 w-5 text-blue-600" />
           <div>
             <div className="text-2xl font-bold text-slate-900">98.2%</div>
             <div className="text-[10px] text-slate-500 font-medium">Uptime</div>
           </div>
         </div>
         <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
             <div className="text-2xl font-bold text-slate-900">14k</div>
             <div className="text-[10px] text-slate-500 font-medium">Attendees</div>
           </div>
         </div>
         <div className="col-span-2 rounded-lg bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="h-24 w-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-xs font-bold text-slate-600">Processing</span>
            </div>
         </div>
       </div>
    </DashboardFrame>
  )
}

function ComplianceVisual() {
  return (
    <DashboardFrame title="Audit Log #2024-X">
      <div className="relative border-l border-slate-200 ml-2 space-y-6 py-2">
        {[
          { user: 'Admin', action: 'Updated Protocol', time: '14:02' },
          { user: 'System', action: 'Auto-Archived', time: '14:00' },
          { user: 'Off. Smith', action: 'Signed Off', time: '13:45' },
        ].map((log, i) => (
          <div key={i} className="relative pl-6">
             <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 ring-1 ring-slate-200 shadow-sm" />
             <div className="text-sm font-medium text-slate-900">{log.action}</div>
             <div className="text-[10px] text-slate-500 font-medium">{log.user} • {log.time}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 shadow-sm">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs font-bold">GDPR Compliant</span>
      </div>
    </DashboardFrame>
  )
}

// --- 2. MAIN COMPONENT ---

const features = [
  { 
    id: 'multi-event',
    icon: Shield, 
    title: 'Oversee Multiple Events Seamlessly', 
    description: 'Manage multiple sites, venues, or events from one dashboard — with dedicated access levels and full team visibility.',
    visual: MultiEventVisual
  },
  { 
    id: 'predict-risks',
    icon: AlertTriangle, 
    title: 'Predict Risks Before They Escalate', 
    description: 'AI-powered analytics highlight emerging trends and potential issues before they affect safety outcomes.',
    visual: RiskVisual
  },
  { 
    id: 'real-time-alerts',
    icon: Bell, 
    title: 'Stay Informed with Real-Time Alerts', 
    description: 'Smart notifications keep control rooms and field teams aligned, ensuring no critical incident goes unseen.',
    visual: AlertsVisual
  },
  { 
    id: 'staff-assignment',
    icon: Users, 
    title: 'Smarter Staff Assignment', 
    description: 'Visual dashboards make it easy to deploy teams, manage skills coverage, and reassign staff instantly.',
    visual: StaffVisual
  },
  { 
    id: 'data-decisions',
    icon: BarChart3, 
    title: 'Turn Data into Safer Decisions', 
    description: 'Analyse incident data, track response times, and benchmark performance using dynamic heatmaps and metrics.',
    visual: DataVisual
  },
  { 
    id: 'compliance',
    icon: Lock, 
    title: 'Built for Compliance and Security', 
    description: 'Maintain a full audit trail of actions, aligned with UK JESIP frameworks and GDPR data standards.',
    visual: ComplianceVisual
  },
]

export const FeatureShowcase = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl py-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-start">
          
          {/* Left Column: Accordion */}
          <Accordion 
            type="single" 
            defaultValue="item-0" 
            className="space-y-3"
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
                  "rounded-xl border px-5 transition-all duration-300",
                  activeFeature === index 
                    ? "border-blue-600 bg-white shadow-md ring-1 ring-blue-100" 
                    : "border-transparent bg-transparent hover:bg-blue-50/50"
                )}
              >
                <AccordionTrigger className="py-4 text-left hover:no-underline group">
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                      activeFeature === index 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-blue-50 text-blue-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={clsx(
                      "text-lg font-medium transition-colors duration-300",
                      activeFeature === index ? "text-blue-900" : "text-slate-600"
                    )}>
                      {title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-[3.5rem] text-base leading-relaxed text-slate-600 pb-4">
                  {description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right Column: Light Mode Mockup */}
          <div className="hidden lg:block relative h-full min-h-[520px]">
            <div className="sticky top-24 w-full overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/50 border border-slate-200 ring-4 ring-slate-50">
              <div className="h-[500px] w-full bg-white relative">
                {features.map((feature, index) => (
                  <div 
                    key={feature.id}
                    className={clsx(
                      "absolute inset-0 h-full w-full transition-all duration-500 transform",
                      activeFeature === index 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                    )}
                  >
                    <feature.visual />
                  </div>
                ))}
              </div>
            </div>
            {/* Decoration blur behind the mockup */}
            <div className="absolute -inset-4 -z-10 bg-blue-100 blur-3xl rounded-full opacity-50" />
          </div>
        </div>
      </div>
    </div>
  )
}