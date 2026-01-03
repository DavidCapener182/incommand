'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { supabase } from '../lib/supabase';
import { 
  XMarkIcon, 
  UsersIcon, 
  ChartBarIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  annotationPlugin
);

interface AttendanceRecord {
  count: number;
  timestamp: string;
}

interface EventRecord {
  doors_open_time: string;
  main_act_start_time: string;
  event_date: string;
  expected_attendance?: number;
  event_name?: string;
  venue_name?: string;
  curfew_time?: string;
  venue_capacity?: number;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEventId: string | null;
}

// --- Helper Components ---
const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5", className)}>
    {children}
  </div>
)

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: string, icon: any, colorClass: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", colorClass.replace('bg-', 'text-'))}>{value}</p>
    </div>
    <div className={cn("p-2.5 rounded-lg", colorClass.replace('text-', 'bg-').replace('600', '50').replace('500', '50'))}>
      <Icon className={cn("h-6 w-6", colorClass)} />
    </div>
  </div>
)

export default function AttendanceModal({ isOpen, onClose, currentEventId }: AttendanceModalProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [eventDetails, setEventDetails] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (Data fetching logic remains unchanged)
  useEffect(() => {
    if (!isOpen || !currentEventId) return;
    setLoading(true);
    (async () => {
      const { data: event } = await (supabase as any)
        .from('events')
        .select('doors_open_time, main_act_start_time, event_date, expected_attendance, curfew_time, venue_capacity')
        .eq('id', currentEventId)
        .single();
      setEventDetails((event as any) as EventRecord);
      const { data: records } = await (supabase as any)
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', currentEventId)
        .order('timestamp', { ascending: true });
      setAttendanceData((records || []) as AttendanceRecord[]);
      setLoading(false);
    })();
  }, [isOpen, currentEventId]);

  // ... (Chart Logic remains mostly unchanged, just updated colors to match theme)
  const parseEventDateTime = (time?: string | null) => {
    if (!eventDetails?.event_date || !time) return null;
    const parsed = new Date(`${eventDetails.event_date}T${time}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const maxCapacity = (() => {
    if (eventDetails?.venue_capacity && eventDetails.venue_capacity > 0) return eventDetails.venue_capacity;
    if (eventDetails?.expected_attendance && eventDetails.expected_attendance > 0) return eventDetails.expected_attendance;
    const observed = attendanceData.length > 0 ? Math.max(...attendanceData.map(record => record.count)) : 0;
    return Math.max(observed, 25000);
  })();

  const doorsOpenTime = parseEventDateTime(eventDetails?.doors_open_time ?? null);
  const curfewTime = parseEventDateTime(eventDetails?.curfew_time ?? null);
  const firstLogTime = attendanceData.length > 0 ? new Date(attendanceData[0].timestamp) : null;
  const lastLogTime = attendanceData.length > 0 ? new Date(attendanceData[attendanceData.length - 1].timestamp) : null;
  const capacityStart = doorsOpenTime || firstLogTime;
  const capacityEnd = curfewTime || lastLogTime || (capacityStart ? new Date(capacityStart.getTime() + 3 * 60 * 60 * 1000) : null);

  const capacityPoints = capacityStart && capacityEnd ? [
    { x: capacityStart.getTime() - 10 * 60 * 1000, y: 0 },
    { x: capacityStart.getTime(), y: 0 },
    { x: capacityStart.getTime(), y: maxCapacity },
    { x: capacityEnd.getTime(), y: maxCapacity }
  ] : [];

  const attendanceChartData = {
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map((rec) => ({ x: new Date(rec.timestamp).getTime(), y: rec.count })),
        fill: true,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      ...(capacityPoints.length > 0 ? [{
        label: 'Capacity',
        data: capacityPoints,
        borderColor: '#ef4444',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
      }] : [])
    ],
  };

  // Chart Options (Cleaned up)
  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'hour', displayFormats: { hour: 'HH:mm' } },
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 5 }
      }
    }
  };

  // Stats Calculations
  const currentAttendance = attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].count : 0;
  const peakAttendance = attendanceData.length > 0 ? Math.max(...attendanceData.map(rec => rec.count)) : 0;
  const expected = eventDetails?.expected_attendance || 0;
  const percent = expected > 0 ? (currentAttendance / expected) * 100 : 0;

  // Calculate Average
  const averageAttendance = (() => {
    if (attendanceData.length < 2) return attendanceData.length === 1 ? attendanceData[0].count : 0;
    let weightedSum = 0;
    const firstTime = new Date(attendanceData[0].timestamp).getTime();
    const lastTime = new Date(attendanceData[attendanceData.length - 1].timestamp).getTime();
    const totalDuration = lastTime - firstTime;
    if (totalDuration <= 0) return attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].count : 0;
    for (let i = 0; i < attendanceData.length - 1; i++) {
      const duration = new Date(attendanceData[i + 1].timestamp).getTime() - new Date(attendanceData[i].timestamp).getTime();
      weightedSum += attendanceData[i].count * duration;
    }
    return Math.round(weightedSum / totalDuration);
  })();

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-slate-50 text-left shadow-2xl transition-all">
                
                {/* Modern Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <UsersIcon className="h-6 w-6" />
                     </div>
                     <div>
                        <Dialog.Title className="text-lg font-bold text-slate-900">
                          Occupancy Analytics
                        </Dialog.Title>
                        <p className="text-xs text-slate-500">Real-time venue flow and capacity tracking</p>
                     </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* KPI Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <StatCard label="Current" value={currentAttendance.toLocaleString()} icon={UsersIcon} colorClass="text-blue-600" />
                         <StatCard label="Peak" value={peakAttendance.toLocaleString()} icon={ArrowTrendingUpIcon} colorClass="text-emerald-600" />
                         <StatCard label="Average" value={averageAttendance.toLocaleString()} icon={ChartBarIcon} colorClass="text-purple-600" />
                         <StatCard label="Capacity" value={`${Math.round(percent)}%`} icon={ClockIcon} colorClass={percent > 90 ? "text-red-600" : "text-amber-600"} />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Main Chart (2/3 width) */}
                        <div className="lg:col-span-2">
                          <CardFrame className="h-full min-h-[400px]">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-slate-800">Attendance Timeline</h3>
                                <div className="flex gap-4 text-xs">
                                   <div className="flex items-center gap-1.5">
                                      <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" />
                                      <span className="text-slate-500">Actual</span>
                                   </div>
                                   <div className="flex items-center gap-1.5">
                                      <div className="w-3 h-0.5 border-t border-dashed border-red-400" />
                                      <span className="text-slate-500">Capacity Limit</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex-1 h-[320px]">
                                <Line data={attendanceChartData} options={chartOptions} />
                             </div>
                          </CardFrame>
                        </div>

                        {/* Recent Logs (1/3 width) */}
                        <div className="lg:col-span-1">
                           <CardFrame className="h-full min-h-[400px] flex flex-col">
                              <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Entries</h3>
                              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[320px] custom-scrollbar">
                                 {attendanceData.slice(-10).reverse().map((rec, i, arr) => {
                                    const prev = arr[i + 1];
                                    const change = prev ? rec.count - prev.count : 0;
                                    
                                    return (
                                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                         <div>
                                            <p className="text-sm font-bold text-slate-900">{rec.count.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                               {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                         </div>
                                         {change !== 0 && (
                                            <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md", change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                                               {change > 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                                               <span>{Math.abs(change)}</span>
                                            </div>
                                         )}
                                      </div>
                                    )
                                 })}
                              </div>
                           </CardFrame>
                        </div>

                      </div>

                    </div>
                  )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}