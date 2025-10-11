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
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { supabase } from '../lib/supabase';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { 
  XMarkIcon, 
  UsersIcon, 
  ChartBarIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
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

export default function AttendanceModal({ isOpen, onClose, currentEventId }: AttendanceModalProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [eventDetails, setEventDetails] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !currentEventId) return;
    setLoading(true);
    (async () => {
      const { data: event } = await supabase
        .from('events')
        .select('doors_open_time, main_act_start_time, event_date, expected_attendance, curfew_time, venue_capacity')
        .eq('id', currentEventId)
        .single();
      setEventDetails(event as EventRecord);
      const { data: records } = await supabase
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', currentEventId)
        .order('timestamp', { ascending: true });
      setAttendanceData((records || []) as AttendanceRecord[]);
      setLoading(false);
    })();
  }, [isOpen, currentEventId]);

  const parseEventDateTime = (time?: string | null) => {
    if (!eventDetails?.event_date || !time) return null;
    const parsed = new Date(`${eventDetails.event_date}T${time}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const maxCapacity = (() => {
    if (eventDetails?.venue_capacity && eventDetails.venue_capacity > 0) {
      return eventDetails.venue_capacity;
    }
    if (eventDetails?.expected_attendance && eventDetails.expected_attendance > 0) {
      return eventDetails.expected_attendance;
    }
    const observed = attendanceData.length > 0 ? Math.max(...attendanceData.map(record => record.count)) : 0;
    return Math.max(observed, 25000);
  })();

  const doorsOpenTime = parseEventDateTime(eventDetails?.doors_open_time ?? null);
  const curfewTime = parseEventDateTime(eventDetails?.curfew_time ?? null);
  const firstLogTime = attendanceData.length > 0 ? new Date(attendanceData[0].timestamp) : null;
  const lastLogTime = attendanceData.length > 0 ? new Date(attendanceData[attendanceData.length - 1].timestamp) : null;

  const capacityStart = doorsOpenTime || firstLogTime;
  const capacityEnd = curfewTime || lastLogTime || (capacityStart ? new Date(capacityStart.getTime() + 3 * 60 * 60 * 1000) : null);

  const capacityPoints = capacityStart && capacityEnd
    ? [
        { x: capacityStart.getTime() - 10 * 60 * 1000, y: 0 },
        { x: capacityStart.getTime(), y: 0 },
        { x: capacityStart.getTime(), y: maxCapacity },
        { x: capacityEnd.getTime(), y: maxCapacity }
      ]
    : [];

  // Attendance Timeline chart data and options
  const attendanceChartData = {
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map((rec) => ({
          x: new Date(rec.timestamp).getTime(),
          y: rec.count,
        })),
        fill: true,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      ...(capacityPoints.length > 0
        ? [
            {
              label: 'Capacity',
              data: capacityPoints,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderDash: [6, 4],
              borderWidth: 2,
              pointRadius: 0,
              pointHitRadius: 6,
              fill: false,
              tension: 0.1,
            }
          ]
        : [])
    ],
  };

  const annotations: any = {};
  const addAnnotationLine = (time: string | null, label: string, color: string, id: string) => {
    if (!time || !eventDetails?.event_date) return;
    const datePart = eventDetails.event_date;
    const annotationTime = new Date(`${datePart}T${time}`).getTime();
    annotations[id] = {
      type: 'line',
      scaleID: 'x',
      value: annotationTime,
      borderColor: color,
      borderWidth: 2,
      borderDash: [6, 6],
      cursor: 'pointer',
    };
  };
  if (eventDetails) {
    addAnnotationLine(eventDetails.doors_open_time, 'Doors Open', 'green', 'doorsOpenLine');
    addAnnotationLine(eventDetails.main_act_start_time, 'Main Act', 'red', 'mainActLine');
  }
  const attendanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#1f2937',
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return new Date(context[0].parsed.x).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            });
          },
          label: (context: any) => {
            const label = context.dataset?.label || 'Value';
            const value = context.parsed?.y ?? 0;
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      },
      title: { 
        display: false 
      },
      annotation: { 
        annotations 
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: { 
          displayFormats: {
            hour: 'HH:mm',
            minute: 'HH:mm'
          },
          tooltipFormat: 'MMM dd HH:mm'
        },
        title: { 
          display: true, 
          text: 'Time',
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          },
          maxTicksLimit: 8,
          autoSkip: true,
          maxRotation: 45
        }
      },
      y: {
        title: { 
          display: true, 
          text: 'Attendance',
          color: '#6B7280'
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          },
          callback: (value: any) => {
            return value.toLocaleString();
          }
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Attendance Log calculations
  const peakAttendance = attendanceData.length > 0 ? Math.max(...attendanceData.map(rec => rec.count)) : 0;
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
  const medianAttendance = (() => {
    if (!attendanceData.length) return 0;
    const sortedCounts = [...attendanceData.map(r => r.count)].sort((a, b) => a - b);
    const mid = Math.floor(sortedCounts.length / 2);
    if (sortedCounts.length % 2 === 0) {
      return Math.round((sortedCounts[mid - 1] + sortedCounts[mid]) / 2);
    }
    return sortedCounts[mid];
  })();
  let maxIncrease = 0;
  let timeOfMaxIncrease: string | null = null;
  if (attendanceData.length > 1) {
    for (let i = 1; i < attendanceData.length; i++) {
      const increase = attendanceData[i].count - attendanceData[i-1].count;
      if (increase > maxIncrease) {
        maxIncrease = increase;
        timeOfMaxIncrease = attendanceData[i].timestamp;
      }
    }
  }
  const currentAttendance = attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].count : 0;
  const expectedAttendance = eventDetails?.expected_attendance || 0;
  const attendancePercentage = expectedAttendance > 0 ? (currentAttendance / expectedAttendance) * 100 : 0;

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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>
        
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl mx-auto overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UsersIcon className="h-6 w-6" />
                      <div>
                        <Dialog.Title className="text-xl font-bold">
                          Venue Occupancy Dashboard
                        </Dialog.Title>
                        {eventDetails && (
                          <p className="text-blue-100 text-sm">
                            {eventDetails.event_name} • {eventDetails.venue_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 hover:bg-white/10 transition-colors"
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : attendanceData.length === 0 ? (
                    <div className="text-center py-20">
                      <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Attendance Data</h3>
                      <p className="text-gray-500 dark:text-gray-400">Attendance records will appear here once they are logged.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Current</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {currentAttendance.toLocaleString()}
                              </p>
                            </div>
                            <UsersIcon className="h-8 w-8 text-blue-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">Peak</p>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {peakAttendance.toLocaleString()}
                              </p>
                            </div>
                            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Average</p>
                              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {averageAttendance.toLocaleString()}
                              </p>
                            </div>
                            <ChartBarIcon className="h-8 w-8 text-purple-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Median</p>
                              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                {medianAttendance.toLocaleString()}
                              </p>
                            </div>
                            <ClockIcon className="h-8 w-8 text-orange-500" />
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for Expected Attendance */}
                      {eventDetails?.expected_attendance && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Attendance Progress</h3>
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {Math.round(attendancePercentage)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            {currentAttendance.toLocaleString()} of {expectedAttendance.toLocaleString()} expected attendees
                          </p>
                        </div>
                      )}

                      {/* Chart and Table Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Timeline Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
                              Attendance Timeline
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="h-80">
                              <Line data={attendanceChartData} options={attendanceChartOptions} />
                            </div>
                          </div>
                        </div>

                        {/* Recent Attendance Log */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                              <ClockIcon className="h-5 w-5 mr-2 text-green-500" />
                              Recent Activity
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {attendanceData.slice(-8).reverse().map((rec, index, arr) => {
                                const prevRec = arr[index + 1];
                                const change = prevRec ? rec.count - prevRec.count : null;
                                const loadWidth = peakAttendance > 0 ? (rec.count / peakAttendance) * 100 : 0;
                                return (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-center">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(rec.timestamp).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                          {rec.count.toLocaleString()}
                                        </div>
                                        {change !== null && (
                                          <div className={`text-xs font-medium flex items-center ${change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {change > 0 ? <FaArrowUp className="mr-1 h-2 w-2" /> : <FaArrowDown className="mr-1 h-2 w-2" />}
                                            {Math.abs(change).toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div 
                                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${loadWidth}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                                        {Math.round(loadWidth)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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