import React from 'react';

interface AttendanceRecord {
  count: number;
  timestamp: string;
}

interface AttendanceLogWidgetProps {
  attendanceData: AttendanceRecord[];
  expectedAttendance?: number;
}

function getQuickStats(attendanceData: AttendanceRecord[]) {
  if (!attendanceData.length) return { peak: 0, average: 0, median: 0, timeOfMaxIncrease: null };
  const counts = attendanceData.map(r => r.count);
  const peak = Math.max(...counts);
  const average = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
  const sorted = [...counts].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 ? Math.round((sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2) : sorted[Math.floor(sorted.length/2)];
  let maxIncrease = 0, timeOfMaxIncrease = null;
  for (let i = 1; i < attendanceData.length; i++) {
    const diff = attendanceData[i].count - attendanceData[i-1].count;
    if (diff > maxIncrease) {
      maxIncrease = diff;
      timeOfMaxIncrease = attendanceData[i].timestamp;
    }
  }
  return { peak, average, median, timeOfMaxIncrease };
}

export default function AttendanceLogWidget({ attendanceData, expectedAttendance }: AttendanceLogWidgetProps) {
  const { peak, average, median, timeOfMaxIncrease } = getQuickStats(attendanceData);
  const attendancePercentage = expectedAttendance && peak ? Math.round((peak / expectedAttendance) * 100) : 0;

  if (!attendanceData || attendanceData.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">No attendance data to display.</div>;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
            <tr>
              <th className="font-semibold text-left p-2">Time</th>
              <th className="font-semibold text-right p-2">Count</th>
              <th className="font-semibold text-right p-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {attendanceData.slice(-10).reverse().map((rec, index, arr) => {
              const prevRec = arr[index + 1];
              const change = prevRec ? rec.count - prevRec.count : null;
              return (
                <tr key={index}>
                  <td className="p-2">{new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-2 text-right font-mono">{rec.count.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{change !== null ? (change > 0 ? `+${change}` : change) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs">
        {expectedAttendance && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">Attendance Progress</span>
              <span className="font-bold">{attendancePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
            </div>
            <p className="text-right text-xs text-gray-500 mt-1">
              Peak: {peak.toLocaleString()} / {expectedAttendance.toLocaleString()}
            </p>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-gray-500">Peak</p>
            <p className="font-bold text-base">{peak.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Average</p>
            <p className="font-bold text-base">{average.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Median</p>
            <p className="font-bold text-base">{median.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Peak Time</p>
            <p className="font-bold text-base">{timeOfMaxIncrease ? new Date(timeOfMaxIncrease).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 