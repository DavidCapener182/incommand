"use client"
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
  TimeScale,
  ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import pattern from 'patternomaly';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FaChevronLeft, FaChevronRight, FaArrowUp, FaArrowDown, FaArrowRight, FaFileExport, FaPrint, FaMapMarkerAlt, FaClock, FaExclamationTriangle, FaUsers, FaCheck, FaLightbulb } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { FiRefreshCw, FiPrinter } from 'react-icons/fi';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  MapPinIcon,
  UsersIcon,
  DocumentChartBarIcon,
  CogIcon,
  LightBulbIcon,
  FireIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import AnalyticsDashboardGrid from '../../components/AnalyticsDashboardGrid';
import KPISummaryWidget from '../../components/KPISummaryWidget';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  annotationPlugin
);

interface DebriefData {
  eventOverview?: string;
  attendanceSummary?: string;
  significantIncidents?: { date: string; type: string; details: string }[];
  learningPoints?: string[];
}
interface AttendanceRecord {
  count: number;
  timestamp: string;
  occurrence?: string;
}
interface IncidentRecord {
  id: string;
  timestamp: string;
  incident_type: string;
  status: string;
  is_closed: boolean;
  priority?: string;
  occurrence?: string;
  created_at?: string;
  updated_at?: string;
}

interface EventRecord {
  id: string;
  doors_open_time: string;
  main_act_start_time: string;
  support_act_times: { time: string, name: string }[];
  event_date: string;
  expected_attendance?: number;
}

// Analytics navigation items
const navigation = [
  { name: 'Overview', icon: ChartBarIcon, id: 'overview' },
  { name: 'Attendance Analytics', icon: UsersIcon, id: 'attendance' },
  { name: 'Incident Analytics', icon: ExclamationTriangleIcon, id: 'incidents' },
  { name: 'Performance Metrics', icon: ClockIcon, id: 'performance' },
  { name: 'Heatmap Analysis', icon: FireIcon, id: 'heatmap' },
  { name: 'Predictive Insights', icon: LightBulbIcon, id: 'predictions' },
  { name: 'AI Insights', icon: ChartPieIcon, id: 'ai-insights' },
  { name: 'Event Debrief', icon: DocumentChartBarIcon, id: 'debrief' },
  { name: 'Reports & Export', icon: DocumentChartBarIcon, id: 'reports' },
  { name: 'Settings', icon: CogIcon, id: 'settings' },
];

const msToTime = (ms: number | null) => {
  if (ms === null || isNaN(ms) || ms < 0) return 'N/A';
  if (ms === 0) return '0s';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Always show seconds if it's the only unit or it's not zero
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }
  
  return parts.join(' ');
};

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

// Helper function to get chart text color based on dark mode
function getChartTextColor() {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return '#fff';
  }
  return '#222';
}

export default function AnalyticsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [incidentData, setIncidentData] = useState<IncidentRecord[]>([]);
  const [eventDetails, setEventDetails] = useState<EventRecord | null>(null);
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
  const [debrief, setDebrief] = useState<DebriefData>({});
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingDebrief, setLoadingDebrief] = useState(true);
  const [previousEventKpis, setPreviousEventKpis] = useState<any>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
  const [debriefError, setDebriefError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      // Get current event
      const { data: event } = await supabase
        .from('events')
        .select('id, doors_open_time, main_act_start_time, support_act_times, event_date, expected_attendance')
        .eq('is_current', true)
        .single();
      if (!event) {
        setLoading(false);
        return;
      }
      setEventDetails(event as EventRecord);
      setEventId(event.id);

      // Fetch data for the current event
      const { data: records } = await supabase
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', event.id)
        .order('timestamp', { ascending: true });
      setAttendanceData((records || []) as AttendanceRecord[]);
      
      const { data: incidents } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', event.id)
        .order('timestamp', { ascending: true });
      setIncidentData((incidents || []) as IncidentRecord[]);

      // --- Fetch previous event data for trend comparison ---
      const { data: previousEvent } = await supabase
        .from('events')
        .select('id, event_date')
        .eq('is_current', false)
        .order('event_date', { ascending: false })
        .limit(1)
        .single();

      if (previousEvent) {
        // Fetch previous event's incidents
        const { data: prevIncidents } = await supabase
          .from('incident_logs')
          .select('*')
          .eq('event_id', previousEvent.id);
        
        // Fetch previous event's attendance
        const { data: prevAttendance } = await supabase
          .from('attendance_records')
          .select('count')
          .eq('event_id', previousEvent.id);
        
        if (prevIncidents && prevAttendance) {
          // Calculate KPIs for the previous event
          const prevFiltered = prevIncidents.filter(i => !['Attendance', 'Sit Rep', 'Timings'].includes(i.incident_type));
          const prevTotal = prevFiltered.length;
          const prevOpen = prevFiltered.filter(i => !i.is_closed && i.status !== 'Logged').length;
          const prevClosed = prevFiltered.filter(i => i.is_closed).length;
          const prevPeakAttendance = prevAttendance.length > 0 ? Math.max(...prevAttendance.map(r => r.count)) : 0;
          
          // Note: Avg Response Time & Most Likely Type are more complex to calculate historically,
          // so we'll focus on the primary count-based KPIs for now.
          setPreviousEventKpis({
            total: prevTotal,
            open: prevOpen,
            closed: prevClosed,
            peak: prevPeakAttendance
          });
        }
      }
      
      // Fetch additional analytics data
      if (event.id) {
        fetchData(`/api/analytics/incident-heatmap?eventId=${event.id}`, setHeatmapData, setLoadingHeatmap);
        fetchData(`/api/analytics/performance-metrics?eventId=${event.id}`, setMetrics, setLoadingMetrics);
        fetchData(`/api/analytics/predictions?eventId=${event.id}`, setPredictions, setLoadingPredictions);
        fetchData(`/api/analytics/debrief-summary?eventId=${event.id}`, setDebrief, setLoadingDebrief);
      }
      
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
  const filteredIncidents = incidentData.filter(
    (incident) => !['Attendance', 'Sit Rep', 'Timings'].includes(incident.incident_type)
  );

  // --- Calculations for TOP ROW Summary Cards (using ALL incidents for accuracy) ---
  const totalIncidentsAll = incidentData.length;
  const openIncidentsAll = incidentData.filter(i => i.status?.toLowerCase() === 'open').length;
  const closedIncidentsAll = incidentData.filter(i => i.status?.toLowerCase() === 'closed').length;

  // Defensive fetch for AI insights
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
        let data;
        try {
          data = await res.json();
        } catch (err) {
          const text = await res.text();
          console.error('Failed to parse JSON from /api/ai-insights:', text);
          setAiError('AI insights failed to load. Invalid JSON response.');
          setAiLoading(false);
          return;
        }
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

  // Fetch supplementary analytics data
  useEffect(() => {
    if (eventId) {
      const fetchAllData = async () => {
        setLoadingHeatmap(true);
        setLoadingMetrics(true);
        setLoadingPredictions(true);
        setLoadingDebrief(true);
        
        fetchData(`/api/analytics/incident-heatmap?eventId=${eventId}`, setHeatmapData, setLoadingHeatmap);
        fetchData(`/api/analytics/performance-metrics?eventId=${eventId}`, setMetrics, setLoadingMetrics);
        fetchData(`/api/analytics/predictions?eventId=${eventId}`, setPredictions, setLoadingPredictions);
        fetchData(`/api/analytics/debrief-summary?eventId=${eventId}`, (data) => {
          if (data && data.summary) {
              try {
                  const parsedSummary = JSON.parse(data.summary);
                  setDebrief(parsedSummary);
              } catch (e) {
                  console.error("Failed to parse debrief summary JSON:", e);
                  setDebrief({ eventOverview: data.summary, significantIncidents: [], learningPoints: [] });
              }
          } else {
              setDebrief({});
          }
        }, setLoadingDebrief);
      };
      fetchAllData();
    }
  }, [eventId]);

  const fetchData = (url: string, setData: (data: any) => void, setLoading: (loading: boolean) => void) => {
    setLoading(true);
    fetch(url)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setData(data))
      .catch(error => console.error(`Error fetching ${url}:`, error))
      .finally(() => setLoading(false));
  };

  // Trend logic (dummy, replace with real trend calc if you have time series)
  const trend = (arr: number[]) => {
    if (!arr || arr.length < 2) return 0;
    if (arr[arr.length - 1] > arr[0]) return 1;
    if (arr[arr.length - 1] < arr[0]) return -1;
    return 0;
  };

  // Export/print handlers (dummy)
  const handleExport = () => {
    const debriefElement = document.getElementById('debrief-report');
    if (debriefElement) {
        html2canvas(debriefElement, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth - 20; // with margin
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 10, 10, width, height);
            pdf.save(`debrief-summary-${eventDetails?.event_date || 'event'}.pdf`);
        });
    }
  };

  const handlePrint = () => window.print();

  const handleSaveNotes = async () => {
    if (!eventId) {
      alert('Cannot save notes, event ID is missing.');
      return;
    }
    setIsSavingNotes(true);
    try {
      const response = await fetch('/api/analytics/save-debrief-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, notes: manualNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
      
      alert('Notes saved successfully!');

    } catch (error) {
      console.error(error);
      alert('Error saving notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleGenerateDebrief = async (eventId: string) => {
    if (!eventId) return;
    setDebriefError(null);
    setIsGeneratingDebrief(true);
    try {
      // First, trigger the generation
      const genRes = await fetch('/api/analytics/generate-debrief-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!genRes.ok) {
        const errorData = await genRes.json();
        throw new Error(errorData.error || 'Failed to generate debrief.');
      }
      
      const genData = await genRes.json();

      // The generation endpoint now returns the summary directly
      const summaryData = typeof genData.summary === 'string' ? JSON.parse(genData.summary) : genData.summary;
      setDebrief(summaryData || {});

    } catch (error: any) {
      console.error('Debrief generation error:', error);
      setDebriefError(error.message || 'An unknown error occurred.');
      setDebrief({});
    } finally {
      setIsGeneratingDebrief(false);
    }
  };

  // Schematic overlay for heatmap (colored dots)
  function SchematicHeatmap() {
    if (!Array.isArray(heatmapData) || heatmapData.length === 0) {
      return <div className="text-center text-gray-500 py-10">No heatmap data to display.</div>;
    }
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
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map((rec) => ({
          x: new Date(rec.timestamp).getTime(),
          y: rec.count
        })),
        fill: false,
        borderColor: '#2A3990',
        backgroundColor: '#2A3990',
        tension: 0.2,
      },
      // Add dummy datasets for legend
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
      ...(eventDetails?.support_act_times?.map(act => ({
        label: `${act.name}: ${act.time || 'N/A'}`,
        data: [],
        borderColor: 'orange',
        backgroundColor: 'orange',
      })) || [])
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
      onClick: ({ chart, element }: { chart: any, element: any }) => {
        // eslint-disable-next-line no-alert
        alert(`Event: ${label} at ${new Date(element.options.value).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
      },
    };
  };

  if (eventDetails) {
    addAnnotationLine(eventDetails.doors_open_time, 'Doors Open', 'green', 'doorsOpenLine');
    if (eventDetails.support_act_times && eventDetails.support_act_times.length > 0) {
       eventDetails.support_act_times.forEach((act, index) => {
         addAnnotationLine(act.time, act.name || `Support ${index + 1}`, 'orange', `supportLine${index}`);
       });
    }
    addAnnotationLine(eventDetails.main_act_start_time, 'Main Act', 'red', 'mainActLine');
  }

  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const attendanceChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: getChartTextColor(),
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        titleColor: getChartTextColor(),
        bodyColor: getChartTextColor(),
      },
      title: { display: true, text: 'Attendance Over Time', color: getChartTextColor() },
      annotation: {
        annotations: annotations
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          tooltipFormat: 'HH:mm',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        title: { display: true, text: 'Time', color: getChartTextColor() },
        ticks: { color: getChartTextColor() },
        grid: { color: getChartTextColor() === '#fff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
      },
      y: {
        title: { display: true, text: 'Attendance', color: getChartTextColor() },
        beginAtZero: true,
        ticks: { color: getChartTextColor() },
        grid: { color: getChartTextColor() === '#fff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
      },
    },
  };

  // --- Incident Volume Over Time (Stacked Bar, by hour and type) ---
  const incidentsByHourAndType: { [hour: string]: { [type: string]: number } } = {};
  const allIncidentTypes = Array.from(new Set(filteredIncidents.map(i => i.incident_type)));
  
  filteredIncidents.forEach((incident) => {
    const hour = new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit' });
    if (!incidentsByHourAndType[hour]) {
      incidentsByHourAndType[hour] = {};
    }
    incidentsByHourAndType[hour][incident.incident_type] = (incidentsByHourAndType[hour][incident.incident_type] || 0) + 1;
  });

  const sortedHours = Object.keys(incidentsByHourAndType).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const typeColorMap: { [key: string]: string } = {
    'Ejection': '#A23E48',
    'Refusal': '#F59E42',
    'Medical': '#2A3990',
    'Aggressive Behaviour': '#E94F37',
    'Welfare': '#4F8A8B',
    'Lost Property': '#7E78D2',
    'Suspicious Activity': '#FFD166',
    'Technical Issue': '#06D6A0',
    'Queue Build-Up': '#118AB2',
    'Artist On Stage': '#2A3990',
    'Artist Off Stage': '#4F8A8B',
    'Artist Movement': '#7E78D2',
    'Sexual Misconduct': '#FFD166',
  };
  const defaultColor = '#CCCCCC';

  const incidentVolumeData = {
    labels: sortedHours.map(h => `${h}:00`),
    datasets: allIncidentTypes.map(type => ({
      label: type,
      data: sortedHours.map(hour => incidentsByHourAndType[hour]?.[type] || 0),
      backgroundColor: pattern.draw('diagonal-right-left', typeColorMap[type] || defaultColor),
    })),
  };

  const incidentVolumeChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: getChartTextColor(),
        },
      },
      title: { display: false, color: getChartTextColor() },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Time of Day',
          font: { weight: 'bold' as 'bold' },
          color: getChartTextColor(),
        },
        grid: { color: getChartTextColor() === '#fff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
        ticks: { color: getChartTextColor() },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Number of Incidents',
          font: { weight: 'bold' as 'bold' },
          color: getChartTextColor(),
        },
        beginAtZero: true,
        ticks: { color: getChartTextColor(), precision: 0 },
        grid: { color: getChartTextColor() === '#fff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
      },
    },
  };

  // --- Top 5 Incident Types ---
  const typeCounts: { [type: string]: number } = {};
  filteredIncidents.forEach((incident) => {
    typeCounts[incident.incident_type] = (typeCounts[incident.incident_type] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  
  // Group into Top 3 and 'Other'
  const top3Types = sortedTypes.slice(0, 3);
  const otherCount = sortedTypes.slice(3).reduce((acc, [, count]) => acc + count, 0);
  const pieChartLabels = top3Types.map(([type]) => type);
  const pieChartData = top3Types.map(([, count]) => count);

  if (otherCount > 0) {
    pieChartLabels.push('Other');
    pieChartData.push(otherCount);
  }

  const pieData = {
    labels: pieChartLabels,
    datasets: [
      {
        label: 'Incidents',
        data: pieChartData,
        backgroundColor: pieChartLabels.map(label => pattern.draw('dot', typeColorMap[label] || defaultColor)),
      },
    ],
  };

  // --- Incident Status Breakdown ---
  // Replicating logic from IncidentTable.tsx for consistency
  const statusCounts: { [status: string]: number } = { Open: 0, Closed: 0 };
  const totalIncidentsCountable = incidentData.filter(incident => 
    !['Attendance', 'Sit Rep'].includes(incident.incident_type)
  );

  totalIncidentsCountable.forEach((incident) => {
    if (incident.is_closed) {
      statusCounts['Closed'] += 1;
    } else {
      // Per IncidentTable.tsx logic for 'open' filter
      if (incident.status !== 'Logged') {
        statusCounts['Open'] += 1;
      }
    }
  });

  const openIncidents = totalIncidentsCountable.filter(i => !i.is_closed && i.status !== 'Logged');
  const mostRecentOpen = openIncidents.length > 0 
    ? openIncidents.reduce((latest, current) => new Date(latest.timestamp) > new Date(current.timestamp) ? latest : current)
    : null;

  const getPriorityColor = (priority: string | undefined) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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
  const closedLogs = incidentData.filter(
    (log) => log.is_closed && log.created_at && log.updated_at
  );
  const responseTimes = closedLogs.map(
    (log) => (
      new Date(log.updated_at as string).getTime() - new Date(log.created_at as string).getTime()
    )
  );
  const avgResponseTimeMs = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;
  const avgResponseTimeDisplay = avgResponseTimeMs
    ? msToTime(avgResponseTimeMs)
    : "N/A";

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

  const peakAttendance = attendanceData.length > 0 ? Math.max(...attendanceData.map(rec => rec.count)) : 0;
  
  // Calculate time-weighted average attendance
  const averageAttendance = (() => {
    if (attendanceData.length < 2) {
      return attendanceData.length === 1 ? attendanceData[0].count : 0;
    }
    
    let weightedSum = 0;
    const firstTime = new Date(attendanceData[0].timestamp).getTime();
    const lastTime = new Date(attendanceData[attendanceData.length - 1].timestamp).getTime();
    const totalDuration = lastTime - firstTime;

    if (totalDuration <= 0) {
      return attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].count : 0;
    }

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

  // --- Summary Chips Data ---
  const summaryChips = [
    { label: 'Avg response', value: avgResponseTimeDisplay },
    { label: 'Most likely', value: predictions.likelyType || 'N/A' },
    { label: 'Open', value: statusCounts['Open'] },
    { label: 'Closed', value: statusCounts['Closed'] },
  ];

  const prevInsight = useCallback(() => {
    setAiInsightIndex(prev => (prev - 1 + aiInsights.length) % aiInsights.length);
  }, [aiInsights.length]);

  const nextInsight = useCallback(() => {
    setAiInsightIndex(prev => (prev + 1) % aiInsights.length);
  }, [aiInsights.length]);

  const totalIncidents = filteredIncidents.length;
  const summaryCardsData = [
    { title: 'Total Incidents', value: totalIncidentsCountable.length },
    { title: 'Avg Response Time', value: avgResponseTimeDisplay },
    { title: 'Open Incidents', value: statusCounts['Open'] },
    { title: 'Closed Incidents', value: statusCounts['Closed'] },
    { title: 'Most Likely Type', value: predictions.likelyType || 'N/A' },
    { title: 'Peak Attendance', value: peakAttendance > 0 ? peakAttendance.toLocaleString() : 'N/A' },
  ];

  const currentAttendance = attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].count : 0;
  const expectedAttendance = eventDetails?.expected_attendance || 0;
  const attendancePercentage = expectedAttendance > 0 ? (currentAttendance / expectedAttendance) * 100 : 0;

  const kpiData = [
    { title: 'Total Incidents', value: totalIncidentsCountable.length },
    { title: 'Open Incidents', value: openIncidents.length.toLocaleString() },
    { title: 'Closed Incidents', value: statusCounts['Closed'].toLocaleString() },
    { title: 'Avg Response Time', value: avgResponseTimeDisplay },
    { title: 'Most Likely Type', value: predictions.likelyType || null },
    { title: 'Peak Attendance', value: peakAttendance > 0 ? peakAttendance.toLocaleString() : null },
  ];

  const getKpiIcon = (title: string) => {
    switch (title) {
      case 'Total Incidents': return <FaExclamationTriangle className="text-red-500" />;
      case 'Open Incidents': return <FaExclamationTriangle className="text-orange-500" />;
      case 'Closed Incidents': return <FaCheck className="text-green-500" />;
      case 'Avg Response Time': return <FaClock className="text-blue-500" />;
      case 'Most Likely Type': return <FaLightbulb className="text-yellow-500" />;
      case 'Peak Attendance': return <FaUsers className="text-purple-500" />;
      default: return null;
    }
  }

  const calculateTrend = (current: number, previous: number | undefined | null) => {
    if (previous === undefined || previous === null || previous === 0) {
      return { percentage: null, direction: 'flat' as const };
    }
    if (current === previous) {
        return { percentage: 0, direction: 'flat' as const };
    }
    const percentage = Math.round(((current - previous) / previous) * 100);
    const direction = percentage > 0 ? 'up' : 'down';
    return { percentage, direction };
  };

  // Find doors open time from incident logs occurrence
  const doorsOpenLog = incidentData.find(
    (log) =>
      log.occurrence &&
      /doors (open|green|are open|opened)/i.test(log.occurrence)
  );
  const doorsOpenTimeFromLog = doorsOpenLog ? new Date(doorsOpenLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const doorsOpenTimeDisplay = doorsOpenTimeFromLog || (eventDetails?.doors_open_time ? eventDetails.doors_open_time : '-');

  // Build kpiData with icons and trends
  const kpiDataForWidget = kpiData.map(kpi => {
    let trend = null;
    let trendDirection: 'up' | 'down' | 'flat' = 'flat';
    if (previousEventKpis) {
      let prevValue = null;
      switch (kpi.title) {
        case 'Total Incidents': prevValue = previousEventKpis.total; break;
        case 'Open Incidents': prevValue = previousEventKpis.open; break;
        case 'Closed Incidents': prevValue = previousEventKpis.closed; break;
        case 'Peak Attendance': prevValue = previousEventKpis.peak; break;
        default: prevValue = null;
      }
      const trendObj = typeof kpi.value === 'number' ? calculateTrend(kpi.value, prevValue) : { percentage: null, direction: 'flat' as const };
      trend = trendObj.percentage;
      trendDirection = (['up', 'down', 'flat'].includes(trendObj.direction) ? trendObj.direction : 'flat') as 'up' | 'down' | 'flat';
    }
    // Ensure value is string or number (never null)
    let safeValue: string | number = kpi.value === null ? '' : kpi.value;
    return {
      ...kpi,
      value: safeValue,
      icon: getKpiIcon(kpi.title),
      trend,
      trendDirection,
    };
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-[#101c36] transition-colors duration-300">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex flex-col shadow-lg z-10">
          <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</span>
            </div>
          </div>
          <nav className="flex-1 space-y-2 py-4 px-2">
            {navigation.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors w-full text-left bg-gray-100 dark:bg-[#1a2a57] text-gray-400 dark:text-gray-200">
                <item.icon className="h-5 w-5 text-gray-400 dark:text-blue-300" />
                {item.name}
              </div>
            ))}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <Skeleton height={20} width="50%" />
                <Skeleton height={40} width="100%" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="p-4">
      <AnalyticsDashboardGrid attendanceData={attendanceData} expectedAttendance={eventDetails?.expected_attendance} kpiData={kpiDataForWidget} incidentData={incidentData} />
    </div>
  );
}

function renderInsight(text: string) {
  if (!text) return <span className="text-gray-400 dark:text-white">No AI insights available.</span>;

  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return <span className="text-gray-400 dark:text-white">No AI insights available.</span>;

  let summary: string | null = null;
  let listItems: string[] = [];
  let isNumbered = false;

  // Parse lines for summary and list
  for (const line of lines) {
    if (line.match(/^[-*•]/)) {
      listItems.push(line.replace(/^[-*•]\s*/, ''));
    } else if (line.match(/^\d+\./)) {
      listItems.push(line.replace(/^\d+\.\s*/, ''));
      isNumbered = true;
    } else if (!summary) {
      summary = line;
    }
  }

  // Clean up list items
  const cleanListItems = (items: string[]) => items.map((item, i) => <li key={i} className="text-gray-700 dark:text-white">{item}</li>);

  return (
    <div>
      {summary && <p className="mb-2 text-gray-700 dark:text-white">{summary}</p>}
      {listItems.length > 0 && (
        isNumbered ? (
          <ol className="list-decimal list-inside space-y-1">{cleanListItems(listItems)}</ol>
        ) : (
          <ul className="list-disc list-inside space-y-1">{cleanListItems(listItems)}</ul>
        )
      )}
    </div>
  );
}

const TooltipIcon = ({ text }: { text: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { FaQuestionCircle } = require('react-icons/fa');
    return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1 rounded-full hover:bg-gray-200"
      >
        <FaQuestionCircle className="w-4 h-4" />
      </button>
      {showTooltip && (
        <div className="absolute z-10 p-2 bg-gray-800 text-white rounded-lg max-w-xs">
          {text}
        </div>
      )}
    </div>
  );
};

const TrendArrow = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
  const arrow = {
    up: <FaArrowUp className="text-green-500" />,
    down: <FaArrowDown className="text-red-500" />,
    flat: <FaArrowRight className="text-gray-400" />,
  };
  return arrow[trend];
};

const chartOptions = (doorsOpenTime: string | null, label: string) => ({
  responsive: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: `${label} Over Time` },
  },
  scales: {
    x: {
      title: { display: true, text: 'Time' },
    },
    y: {
      title: { display: true, text: label },
      beginAtZero: true,
    },
  },
});

const INCIDENT_TYPES = [
  'Medical',
  'Ejection',
  'Refusal',
  'Lost Property',
  'Technical',
  'Weather',
  'Suspicious',
  'Aggressive',
  'Welfare',
  'Queue',
  'Venue',
  'Audit',
  'Accreditation',
  'Staffing',
  'Accsessablity',
  'Suspected Fire',
  'Fire',
  'Artist On Stage',
  'Artist Off Stage',
  'Artist Movement',
  'Sexual Misconduct',
]; 