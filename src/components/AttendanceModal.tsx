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
        .select('doors_open_time, main_act_start_time, event_date, expected_attendance')
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

  // Attendance Timeline chart data and options
  const attendanceChartData = {
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map((rec) => ({
          x: new Date(rec.timestamp).getTime(),
          y: rec.count,
        })),
        fill: false,
        borderColor: '#2A3990',
        backgroundColor: '#2A3990',
        tension: 0.2,
      },
      {
        label: `Doors Open: ${eventDetails?.doors_open_time || 'N/A'}`,
        data: [],
        borderColor: 'green',
        backgroundColor: 'green',
      },
      {
        label: `Main Act: ${eventDetails?.main_act_start_time || 'N/A'}`,
        data: [],
        borderColor: 'red',
        backgroundColor: 'red',
      },
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
      legend: { position: 'top' as const },
      tooltip: { enabled: true, mode: 'index' as const, intersect: false },
      title: { display: true, text: 'Attendance Over Time' },
      annotation: { annotations },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: { unit: 'minute' as const, tooltipFormat: 'HH:mm', displayFormats: { minute: 'HH:mm' } },
        title: { display: true, text: 'Time' },
      },
      y: {
        title: { display: true, text: 'Attendance' },
        beginAtZero: true,
      },
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
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
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
              <Dialog.Panel className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-6">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Attendance Timeline */}
                  <div className="bg-white rounded-xl shadow p-6 min-h-[340px] flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <h2 className="font-bold text-2xl mb-4 text-gray-900">Attendance Timeline</h2>
                    <div className="flex-grow relative min-h-[220px]">
                      {loading ? (
                        <div className="text-center text-gray-500 py-10">Loading...</div>
                      ) : attendanceData.length > 0 ? (
                        <Line data={attendanceChartData} options={attendanceChartOptions} />
                      ) : (
                        <p className="text-center text-gray-500 py-10">No attendance data to display.</p>
                      )}
                    </div>
                  </div>
                  {/* Attendance Log */}
                  <div className="bg-white rounded-xl shadow p-6 min-h-[340px] flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <h2 className="font-bold text-2xl mb-4 text-gray-900">Attendance Log</h2>
                    <div className="flex-grow overflow-y-auto">
                      {loading ? (
                        <div className="text-center text-gray-500 py-10">Loading...</div>
                      ) : attendanceData.length > 0 ? (
                        <table className="w-full">
                          <thead className="sticky top-0 bg-white z-10">
                            <tr>
                              <th className="font-semibold text-left text-gray-500 p-2">Time</th>
                              <th className="font-semibold text-right text-gray-500 p-2">Count</th>
                              <th className="font-semibold text-right text-gray-500 p-2">Change</th>
                              <th className="font-semibold text-left text-gray-500 p-2 w-28"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {attendanceData.slice(-5).reverse().map((rec, index, arr) => {
                              const prevRec = arr[index + 1];
                              const change = prevRec ? rec.count - prevRec.count : null;
                              const loadWidth = peakAttendance > 0 ? (rec.count / peakAttendance) * 100 : 0;
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="p-2 text-base">{new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                                  <td className="p-2 text-right font-mono text-base">{rec.count.toLocaleString()}</td>
                                  <td className="p-2 text-right font-mono text-base">
                                    {change !== null ? (
                                      <span className={`flex items-center justify-end ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {change > 0 ? <FaArrowUp className="mr-1 h-2.5 w-2.5" /> : <FaArrowDown className="mr-1 h-2.5 w-2.5" />}
                                        {Math.abs(change).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="p-2 align-middle">
                                    <div className="w-full bg-gray-200 rounded-full h-2" title={`${Math.round(loadWidth)}% capacity`}>
                                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${loadWidth}%` }} />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-center text-gray-500 py-10">No attendance data to display.</p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                      {eventDetails?.expected_attendance && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-gray-700">Attendance Progress</h3>
                            <span className="font-bold text-gray-900">{Math.round(attendancePercentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                          </div>
                          <p className="text-right text-xs text-gray-500 mt-1">
                            {currentAttendance.toLocaleString()} / {expectedAttendance.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <h3 className="font-semibold mb-2 text-gray-700">Quick Stats</h3>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-gray-500">Peak</p>
                          <p className="font-bold text-lg">{peakAttendance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Average</p>
                          <p className="font-bold text-lg">{averageAttendance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Median</p>
                          <p className="font-bold text-lg">{medianAttendance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Peak Time</p>
                          <p className="font-bold text-lg">{timeOfMaxIncrease ? new Date(timeOfMaxIncrease).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 