'use client'

import React, { useMemo } from 'react'
import { BarChart3, FilterX, MoreHorizontal, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIncidentTypeStyle } from '@/utils/incidentStyles'

export interface TopIncidentTypesCardProps {
  incidents: any[];
  onTypeClick: (type: string) => void;
  selectedType: string | null;
}

// --- Helper Components ---
const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md h-[130px] relative overflow-hidden", className)}>
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action, isFilterActive }: { icon: any; title: string; action?: () => void; isFilterActive?: boolean }) => (
  <div className="flex items-center justify-between mb-2 shrink-0 h-5">
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <Icon className="h-3 w-3" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{title}</span>
    </div>
    {action && isFilterActive && (
      <button 
        onClick={action} 
        className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 hover:border-red-100 hover:bg-red-50"
        title="Clear Filter"
      >
        <FilterX className="h-3 w-3" />
        <span>Clear</span>
      </button>
    )}
    {!isFilterActive && (
      <button className="text-slate-300 cursor-default">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
)

export default function TopIncidentTypesCard({ incidents, onTypeClick, selectedType }: TopIncidentTypesCardProps) {
  
  // Process Data
  const sortedStats = useMemo(() => {
    const safeIncidents = Array.isArray(incidents) ? incidents : [];
    
    const filtered = safeIncidents.filter((i: any) => {
      if (i.type === 'match_log') return false;
      return i && i.incident_type && !['Attendance', 'Sit Rep', 'Artist On/Off Stage', 'Artist On Stage', 'Artist Off Stage', 'Artist off Stage', 'Artist on Stage'].includes(i.incident_type);
    });
    
    const counts = filtered.reduce((acc: Record<string, number>, i: any) => {
      if (i.incident_type) acc[i.incident_type] = (acc[i.incident_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return (Object.entries(counts) as [string, number][]) 
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [incidents]);

  // Handle Type Toggle (Clicking selected type deselects it)
  const handleToggle = (type: string) => {
    if (selectedType === type) {
      onTypeClick(''); // Clear
    } else {
      onTypeClick(type);
    }
  };

  return (
    <CardFrame>
      <CardHeader 
        icon={BarChart3} 
        title="Top Incident Types" 
        action={() => onTypeClick('')}
        isFilterActive={!!selectedType}
      />

      <div className="flex flex-col flex-1 min-h-0 pt-0.5 overflow-hidden">
        {sortedStats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-1">
            <AlertCircle className="h-5 w-5 opacity-20" />
            <span className="text-[10px] font-medium">No data available</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
            {sortedStats.map(([type, count], index) => {
              const isSelected = selectedType === type;
              // Use safe/default styling if helper fails
              let styleClasses = "bg-slate-50 text-slate-600 border-slate-100";
              try {
                styleClasses = getIncidentTypeStyle(type);
              } catch (e) {}

              // Calculate width percentage relative to top item for visual bar effect
              const maxCount = sortedStats[0][1];
              const percent = Math.max((count / maxCount) * 100, 15);

              return (
                <button
                  key={type}
                  onClick={() => handleToggle(type)}
                  className={cn(
                    "group relative flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border",
                    isSelected 
                      ? "ring-1 ring-blue-500 border-blue-500 z-10 shadow-sm" 
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200",
                    !isSelected && styleClasses // Apply color styles
                  )}
                >
                  {/* Content */}
                  <div className="flex items-center gap-2 min-w-0 z-10">
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold opacity-80",
                      isSelected ? "bg-blue-100 text-blue-700" : "bg-white/50"
                    )}>
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{type}</span>
                  </div>
                  
                  <span className={cn(
                    "font-bold z-10", 
                    isSelected ? "text-blue-700" : "opacity-80"
                  )}>
                    {count}
                  </span>
                  
                  {/* Subtle Progress Bar Background */}
                  {/* <div 
                    className="absolute left-0 top-0 bottom-0 bg-current opacity-[0.03] rounded-md transition-all duration-500" 
                    style={{ width: `${percent}%` }}
                  /> */}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </CardFrame>
  )
}