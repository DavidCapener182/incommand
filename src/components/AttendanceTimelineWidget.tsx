import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface AttendanceRecord {
  count: number;
  timestamp: string;
}

interface AttendanceTimelineWidgetProps {
  attendanceData: AttendanceRecord[];
}

export default function AttendanceTimelineWidget({ attendanceData }: AttendanceTimelineWidgetProps) {
  if (!attendanceData || attendanceData.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">No attendance data to display.</div>;
  }

  const data = {
    labels: attendanceData.map(rec => new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map(rec => rec.count),
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: '#2563eb',
        pointBackgroundColor: '#2563eb',
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#374151' },
      },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#374151' },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-[200px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
} 