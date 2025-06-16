'use client'
// NOTE: You must install 'react-chartjs-2' and 'chart.js' for this page to work:
// npm install react-chartjs-2 chart.js

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { FaChevronLeft, FaChevronRight, FaArrowUp, FaArrowDown, FaArrowRight, FaFileExport, FaPrint, FaMapMarkerAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';

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

function msToTime(duration: number | null) {
  if (duration === null) return 'N/A';
  let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  return `${hours ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
}

// Loading skeleton component
function Skeleton({ height = 24, width = '100%' }) {
  return <div style={{ height, width }} className="bg-gray-200 animate-pulse rounded" />;
}

// Confidence bar
function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
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
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{ avgResponseTimeMs: number | null; avgResolutionTimeMs: number | null }>({ avgResponseTimeMs: null, avgResolutionTimeMs: null });
  const [predictions, setPredictions] = useState<{ likelyType: string | null; likelyLocation: string | null; likelyHour: string | null }>({ likelyType: null, likelyLocation: null, likelyHour: null });
  const [debrief, setDebrief] = useState<{ summary: string; learningPoints: string[]; callsignSheet: any[] }>({ summary: '', learningPoints: [], callsignSheet: [] });
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingDebrief, setLoadingDebrief] = useState(true);

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

  useEffect(() => {
    setLoadingHeatmap(true);
    fetch('/api/analytics/incident-heatmap').then(r => r.json()).then(d => { setHeatmapData(d); setLoadingHeatmap(false); });
    setLoadingMetrics(true);
    fetch('/api/analytics/performance-metrics').then(r => r.json()).then(d => { setMetrics(d); setLoadingMetrics(false); });
    setLoadingPredictions(true);
    fetch('/api/analytics/predictions').then(r => r.json()).then(d => { setPredictions(d); setLoadingPredictions(false); });
    setLoadingDebrief(true);
    fetch('/api/analytics/debrief-summary').then(r => r.json()).then(d => { setDebrief(d); setLoadingDebrief(false); });
  }, []);

  // Trend logic (dummy, replace with real trend calc if you have time series)
  const trend = (arr: number[]) => {
    if (arr.length < 2) return 'flat';
    if (arr[arr.length - 1] > arr[0]) return 'up';
    if (arr[arr.length - 1] < arr[0]) return 'down';
    return 'flat';
  };

  // Export/print handlers (dummy)
  const handleExport = () => {
    // TODO: Implement PDF export using html2pdf.js or similar
    // html2pdf(document.getElementById('debrief-report'));
    alert('PDF export coming soon!');
  };
  const handlePrint = () => window.print();

  // Schematic overlay for heatmap (colored dots)
  function SchematicHeatmap() {
    const locations = Array.from(new Set(heatmapData.map((d: any) => d.location)));
    return (
      <div className="relative w-full h-64 bg-gray-100 rounded">
        {locations.map((loc, i) => (
          <div key={loc} className="absolute left-[10%] top-[10%]" style={{ left: `${10 + i * 10}%`, top: `${10 + (i % 3) * 20}%` }}>
            <span className="inline-block w-6 h-6 rounded-full bg-red-500 opacity-70 border-2 border-white shadow-lg" title={loc} />
            <span className="absolute left-8 top-1 text-xs text-gray-700">{loc}</span>
          </div>
        ))}
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 mt-8">
        {/* Incident Heatmap Widget */}
        <div className="bg-white rounded shadow p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Incident Heatmap</h2>
            <FaMapMarkerAlt className="text-blue-500" />
          </div>
          {loadingHeatmap ? <Skeleton height={256} /> : <SchematicHeatmap />}
        </div>
        {/* Performance Metrics Widget */}
        <div className="bg-white rounded shadow p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Performance Metrics</h2>
            <FaClock className="text-blue-500" />
          </div>
          {loadingMetrics ? (
            <Skeleton height={48} />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">Average Response Time: <span className="font-mono text-gray-900">{msToTime(metrics.avgResponseTimeMs)}</span>
                {trend([metrics.avgResponseTimeMs || 0, (metrics.avgResponseTimeMs || 0) + 1000]) === 'up' && <FaArrowUp className="text-red-500" />}
                {trend([metrics.avgResponseTimeMs || 0, (metrics.avgResponseTimeMs || 0) - 1000]) === 'down' && <FaArrowDown className="text-green-500" />}
                {trend([metrics.avgResponseTimeMs || 0, metrics.avgResponseTimeMs || 0]) === 'flat' && <FaArrowRight className="text-gray-400" />}
              </div>
              <div className="flex items-center gap-2">Average Resolution Time: <span className="font-mono text-gray-900">{msToTime(metrics.avgResolutionTimeMs)}</span>
                {trend([metrics.avgResolutionTimeMs || 0, (metrics.avgResolutionTimeMs || 0) + 1000]) === 'up' && <FaArrowUp className="text-red-500" />}
                {trend([metrics.avgResolutionTimeMs || 0, (metrics.avgResolutionTimeMs || 0) - 1000]) === 'down' && <FaArrowDown className="text-green-500" />}
                {trend([metrics.avgResolutionTimeMs || 0, metrics.avgResolutionTimeMs || 0]) === 'flat' && <FaArrowRight className="text-gray-400" />}
              </div>
            </div>
          )}
        </div>
        {/* Trends & Predictive AI Widget */}
        <div className="bg-white rounded shadow p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Trends & Predictive AI</h2>
            <FaExclamationTriangle className="text-yellow-500" />
          </div>
          {loadingPredictions ? (
            <Skeleton height={48} />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">Most Likely Next Incident Type: <span className="font-mono text-gray-900">{predictions.likelyType || 'N/A'}</span>
                <ConfidenceBar value={0.8} />
              </div>
              <div className="flex items-center gap-2">Most Likely Location: <span className="font-mono text-gray-900">{predictions.likelyLocation || 'N/A'}</span></div>
              <div className="flex items-center gap-2">Most Likely Hour: <span className="font-mono text-gray-900">{predictions.likelyHour || 'N/A'}</span></div>
            </div>
          )}
        </div>
        {/* Debrief Summary Widget */}
        <div className="bg-white rounded shadow p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Debrief Summary</h2>
            <div className="flex gap-2">
              <button onClick={handleExport} className="p-1 text-blue-500 hover:text-blue-700" aria-label="Export"><FaFileExport /></button>
              <button onClick={handlePrint} className="p-1 text-blue-500 hover:text-blue-700" aria-label="Print"><FaPrint /></button>
            </div>
          </div>
          <div id="debrief-report">
            <div className="mb-2 text-gray-900">{debrief.summary}</div>
            <ul className="list-disc ml-6 mb-4">
              {(debrief.learningPoints || []).map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
            {(debrief.callsignSheet || []).length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="font-semibold mb-2">Final Callsign/Radio Assignment Sheet</h3>
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Callsign</th>
                      <th className="border px-2 py-1">Position</th>
                      <th className="border px-2 py-1">Assigned Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(debrief.callsignSheet || []).map((row: any, i: number) => (
                      <tr key={i}>
                        <td className="border px-2 py-1 font-mono">{row.callsign}</td>
                        <td className="border px-2 py-1">{row.position}</td>
                        <td className="border px-2 py-1">{row.assigned_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
    </div>
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