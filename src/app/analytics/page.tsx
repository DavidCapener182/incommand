'use client'
// NOTE: You must install 'react-chartjs-2' and 'chart.js' for this page to work:
// npm install react-chartjs-2 chart.js

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceRecord {
  count: number;
  timestamp: string;
}
interface IncidentRecord {
  id: string;
  timestamp: string;
  incident_type: string;
  status: string;
  is_closed: boolean;
  priority?: string;
  occurrence?: string;
}

export default function AnalyticsPage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [incidentData, setIncidentData] = useState<IncidentRecord[]>([]);
  const [doorsOpenTime, setDoorsOpenTime] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiInsightIndex, setAiInsightIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      // Get current event
      const { data: event } = await supabase
        .from('events')
        .select('id, doors_open_time, event_date, venue_capacity')
        .eq('is_current', true)
        .single();
      if (!event) {
        setLoading(false);
        return;
      }
      setDoorsOpenTime(event.doors_open_time);
      setEventId(event.id);
      // Fetch attendance records
      const { data: records } = await supabase
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', event.id)
        .order('timestamp', { ascending: true });
      setAttendanceData((records || []) as AttendanceRecord[]);
      // Fetch all columns from incident_logs
      const { data: incidents } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', event.id)
        .order('timestamp', { ascending: true });
      setIncidentData((incidents || []) as IncidentRecord[]);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  // Debug: log incident data to browser console
  useEffect(() => {
    if (incidentData.length) {
      // eslint-disable-next-line no-console
      console.log('INCIDENT DATA:', incidentData);
    }
  }, [incidentData]);

  // Filter out 'Attendance' and 'Sit Rep' incidents for all widgets except attendance timeline
  const filteredIncidents = incidentData.filter((incident) => incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep');

  // Fetch all relevant data and get multiple AI insights from API route
  useEffect(() => {
    const fetchAiInsights = async () => {
      if (!incidentData.length || !attendanceData.length || !eventId) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidents: filteredIncidents,
            attendance: attendanceData,
            event: eventId,
          }),
        });
        const data = await res.json();
        setAiInsights(data.insights || []);
        setAiInsightIndex(0);
      } catch (err: any) {
        setAiError('AI insights failed to load.');
      } finally {
        setAiLoading(false);
      }
    };
    fetchAiInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentData, attendanceData, eventId]);

  // Cycle through insights every 30 seconds
  useEffect(() => {
    if (aiInsights.length > 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setAiInsightIndex((prev) => (prev + 1) % aiInsights.length);
      }, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    // Always return a cleanup function
    return () => {};
  }, [aiInsights]);

  // --- Attendance Timeline (existing, now larger) ---
  const attendanceChartData = {
    labels: attendanceData.map((rec) =>
      new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map((rec) => rec.count),
        fill: false,
        borderColor: '#2A3990',
        backgroundColor: '#2A3990',
        tension: 0.2,
      },
    ],
  };
  const attendanceChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Attendance Over Time (from Doors Open)' },
    },
    scales: {
      x: {
        title: { display: true, text: 'Time' },
      },
      y: {
        title: { display: true, text: 'Attendance' },
        beginAtZero: true,
      },
    },
  };

  // --- Incident Volume Over Time (Line chart, by hour) ---
  const incidentsByHour: { [hour: string]: number } = {};
  filteredIncidents.forEach((incident) => {
    const hour = new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit' });
    incidentsByHour[hour] = (incidentsByHour[hour] || 0) + 1;
  });
  const incidentVolumeLineData = {
    labels: Object.keys(incidentsByHour),
    datasets: [
      {
        label: 'Incidents',
        data: Object.values(incidentsByHour),
        fill: false,
        borderColor: '#E94F37',
        backgroundColor: '#E94F37',
        tension: 0.2,
      },
    ],
  };

  // --- Top 5 Incident Types ---
  const typeCounts: { [type: string]: number } = {};
  filteredIncidents.forEach((incident) => {
    typeCounts[incident.incident_type] = (typeCounts[incident.incident_type] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const topTypes = sortedTypes.slice(0, 5);
  const pieData = {
    labels: topTypes.map(([type]) => type),
    datasets: [
      {
        label: 'Incidents',
        data: topTypes.map(([, count]) => count),
        backgroundColor: [
          '#2A3990', '#F59E42', '#E94F37', '#4F8A8B', '#A23E48',
        ],
      },
    ],
  };

  // --- Incident Status Breakdown ---
  // For Sit Rep and Attendance, always count as 'Logged'. For others, use status or 'Logged' if null/empty.
  const statusCounts: { [status: string]: number } = { Open: 0, Closed: 0, Logged: 0 };
  filteredIncidents.forEach((incident) => {
    if (['Sit Rep', 'Attendance'].includes(incident.incident_type)) {
      statusCounts['Logged'] += 1;
    } else {
      const status = (incident.status || '').toLowerCase();
      if (status === 'open') statusCounts['Open'] += 1;
      else if (status === 'closed') statusCounts['Closed'] += 1;
      else statusCounts['Logged'] += 1;
    }
  });
  const statusPieData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Status',
        data: Object.values(statusCounts),
        backgroundColor: ['#2A3990', '#4F8A8B', '#F59E42'],
      },
    ],
  };

  // --- Incident Severity Breakdown ---
  const severityCounts: { [priority: string]: number } = {};
  filteredIncidents.forEach((incident) => {
    if (incident.priority) {
      severityCounts[incident.priority] = (severityCounts[incident.priority] || 0) + 1;
    }
  });
  const severityPieData = {
    labels: Object.keys(severityCounts),
    datasets: [
      {
        label: 'Severity',
        data: Object.values(severityCounts),
        backgroundColor: ['#E94F37', '#F59E42', '#4F8A8B'],
      },
    ],
  };

  // --- Incident Response Time ---
  const responseTimes: number[] = filteredIncidents
    .filter((i) => i.status === 'Closed' && i.timestamp && (i as any).closed_timestamp)
    .map((i) => {
      // Replace with actual field if available
      // @ts-ignore
      return (new Date(i.closed_timestamp).getTime() - new Date(i.timestamp).getTime()) / 1000 / 60;
    });
  const avgResponse = responseTimes.length ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : null;
  const minResponse = responseTimes.length ? Math.min(...responseTimes).toFixed(1) : null;
  const maxResponse = responseTimes.length ? Math.max(...responseTimes).toFixed(1) : null;

  // --- Ejection/Refusal Patterns (total count by type) ---
  const ejectionRefusalTypeCounts: { [type: string]: number } = { Ejection: 0, Refusal: 0 };
  filteredIncidents.forEach((incident) => {
    if (incident.incident_type === 'Ejection') ejectionRefusalTypeCounts['Ejection'] += 1;
    if (incident.incident_type === 'Refusal') ejectionRefusalTypeCounts['Refusal'] += 1;
  });
  const ejectionRefusalBarData = {
    labels: Object.keys(ejectionRefusalTypeCounts),
    datasets: [
      {
        label: 'Ejections/Refusals',
        data: Object.values(ejectionRefusalTypeCounts),
        backgroundColor: ['#A23E48', '#F59E42'],
      },
    ],
  };

  // --- Hide Severity and Response Time widgets if no data ---
  const showSeverity = Object.keys(severityCounts).length > 0;
  const showResponseTime = responseTimes.length > 0;

  // --- Occupancy Peaks & Surges ---
  let capacity: number | null = null;
  let peaks: { time: string; count: number }[] = [];
  if (attendanceData.length && doorsOpenTime && eventId) {
    // Assume event capacity is available (if not, skip)
    // Replace with actual event.venue_capacity if available
    // capacity = event.venue_capacity;
    // For now, set a placeholder
    capacity = 4000;
    peaks = attendanceData.filter((rec) => capacity !== null && rec.count > 0.9 * capacity).map((rec) => ({
      time: new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      count: rec.count,
    }));
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      {/* AI Insight Card */}
      <div className="mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">AI Insight</h2>
          <div className="flex items-center gap-2 mb-2">
            <button
              aria-label="Previous insight"
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setAiInsightIndex((prev) => (prev - 1 + aiInsights.length) % aiInsights.length)}
              disabled={aiInsights.length <= 1}
            >
              <FaChevronLeft />
            </button>
            <span className="text-xs text-gray-500">
              {aiInsights.length > 0 ? `${aiInsightIndex + 1} / ${aiInsights.length}` : ''}
            </span>
            <button
              aria-label="Next insight"
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setAiInsightIndex((prev) => (prev + 1) % aiInsights.length)}
              disabled={aiInsights.length <= 1}
            >
              <FaChevronRight />
            </button>
          </div>
          {aiLoading && <p>Generating insights...</p>}
          {aiError && <p className="text-red-500">{aiError}</p>}
          {aiInsights.length > 0 && !aiLoading && !aiError && (
            <div>{renderInsight(aiInsights[aiInsightIndex])}</div>
          )}
          {aiInsights.length === 0 && !aiLoading && !aiError && <p>No insights to show yet.</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2 bg-white shadow rounded-lg p-6 flex flex-col justify-center">
          <h2 className="text-lg font-semibold mb-4">Attendance Timeline</h2>
          {loading ? (
            <p>Loading attendance data...</p>
          ) : attendanceData.length === 0 ? (
            <p>No attendance data available for the current event.</p>
          ) : (
            <Line data={attendanceChartData} options={attendanceChartOptions} height={120} />
          )}
          {doorsOpenTime && (
            <p className="mt-2 text-sm text-gray-500">Graph starts from doors open: {doorsOpenTime}</p>
          )}
        </div>
        <div className="bg-white shadow rounded-lg p-6 flex flex-col justify-center">
          <h2 className="text-lg font-semibold mb-4">Incident Volume Over Time</h2>
          {loading ? <p>Loading...</p> : <Line data={incidentVolumeLineData} />}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Top 5 Incident Types</h2>
          {loading ? <p>Loading...</p> : <Pie data={pieData} />}
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Incident Status Breakdown</h2>
          {Object.values(statusCounts).reduce((a, b) => a + b, 0) > 0 ? <Pie data={statusPieData} /> : <p>No status data available.</p>}
        </div>
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-gray-400 text-center flex items-center justify-center">
          More analytics widgets coming soon...
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Ejection/Refusal Patterns */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Ejection/Refusal Patterns</h2>
          {Object.values(ejectionRefusalTypeCounts).reduce((a, b) => a + b, 0) > 0 ? <Bar data={ejectionRefusalBarData} /> : <p>No ejection/refusal data available.</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Severity Breakdown */}
        {showSeverity && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Incident Severity Breakdown</h2>
            <Pie data={severityPieData} />
          </div>
        )}
        {/* Response Time Table */}
        {showResponseTime && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Incident Response Time (min)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr><th>Avg</th><th>Min</th><th>Max</th></tr>
              </thead>
              <tbody>
                <tr><td>{avgResponse}</td><td>{minResponse}</td><td>{maxResponse}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Occupancy Peaks & Surges */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Occupancy Peaks & Surges</h2>
        {peaks.length ? (
          <ul className="list-disc ml-6">
            {peaks.map((peak, i) => (
              <li key={i}>Peak at {peak.time}: {peak.count} attendees</li>
            ))}
          </ul>
        ) : (
          <p>No occupancy peaks detected (over 90% capacity).</p>
        )}
      </div>
    </main>
  );
}

function renderInsight(text: string) {
  // Detect numbered list (e.g., 1. ... 2. ... 3. ...)
  const numberedList = text.match(/^(\d+\. .+)(\n\d+\. .+)+/m);
  if (numberedList) {
    // Split on numbered items
    const items = text.split(/\n?\d+\. /).filter(Boolean);
    // If the first item is a summary (doesn't look like a list item), show it as a paragraph
    let summary = null;
    let listItems = items;
    if (items.length > 1 && items[0].endsWith(':')) {
      summary = items[0];
      listItems = items.slice(1);
    }
    return (
      <div>
        {summary && <p className="mb-2">{summary}</p>}
        <ol className="list-decimal ml-6">
          {listItems.map((item, i) => (
            <li key={i}>{item.trim()}</li>
          ))}
        </ol>
      </div>
    );
  }
  // Detect bullet list (e.g., - ... or * ...)
  const bulletList = text.match(/^(\-|\*) .+(\n(\-|\*) .+)+/m);
  if (bulletList) {
    const items = text.split(/\n(?:\-|\*) /).filter(Boolean);
    return (
      <ul className="list-disc ml-6">
        {items.map((item, i) => (
          <li key={i}>{item.trim()}</li>
        ))}
      </ul>
    );
  }
  // Otherwise, return as paragraph
  return <p>{text}</p>;
} 