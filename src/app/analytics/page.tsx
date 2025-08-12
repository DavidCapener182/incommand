"use client"
// NOTE: You must install 'react-chartjs-2' and 'chart.js' for this page to work:
// npm install react-chartjs-2 chart.js

import React, { useEffect, useState } from 'react';
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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FaArrowUp, FaArrowDown, FaFileExport, FaPrint, FaMapMarkerAlt, FaClock, FaExclamationTriangle, FaUsers, FaCheck, FaLightbulb } from 'react-icons/fa';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  UsersIcon,
  DocumentChartBarIcon,
  CogIcon,
  LightBulbIcon,
  FireIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import IconSidebar from '../../components/IconSidebar';
import { QuickActionItem } from '../../types/sidebar';
import { 
  ArrowPathIcon, 
  PlusIcon, 
  SunIcon, 
  MoonIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import LiveIncidentStatus from '../../components/LiveIncidentStatus';
import StaffEfficiencyWidget from '../../components/StaffEfficiencyWidget';
import VenueCapacityWidget from '../../components/VenueCapacityWidget';
import EnhancedAIInsights from '../../components/EnhancedAIInsights';
import { 
  getEnhancedChartColors, 
  getResponsiveOptions, 
  getHoverEffects, 
  getAnimationConfig, 
  getGradientFill, 
  createAnimatedDataset, 
  getChartTheme 
} from '../../utils/chartEnhancements';

// Import export functionality only
import { ExportMenu } from '../../components/ExportMenu';
import { exportAnalyticsData } from '../../utils/exportUtils';

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
  { name: 'Dashboard', icon: ChartBarIcon, id: 'overview' },
  { name: 'Attendance', icon: UsersIcon, id: 'attendance' },
  { name: 'Incidents', icon: ExclamationTriangleIcon, id: 'incidents' },
  { name: 'AI Insights', icon: LightBulbIcon, id: 'ai-insights' },
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
  const [predictions, setPredictions] = useState<{ likelyType: string | null; likelyLocation: string | null; likelyHour: string | null }>({ likelyType: null, likelyLocation: null, likelyHour: null });
  const [debrief, setDebrief] = useState<DebriefData>({});
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingDebrief, setLoadingDebrief] = useState(true);
  const [previousEventKpis, setPreviousEventKpis] = useState<any>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState(false);
  const [debriefError, setDebriefError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  
  // New analytics state
  const [exportResult, setExportResult] = useState<any>(null);

  // Ensure eventId is available
  const safeEventId = eventId || '';

  // Section status mapping for sidebar indicators
  const sectionStatus: Record<string, 'loading' | 'ready' | 'error' | 'none'> = {
    overview: loading ? 'loading' : 'ready',
    attendance: loading ? 'loading' : 'ready',
    incidents: loading ? 'loading' : 'ready',
    'ai-insights': loadingPredictions || loadingDebrief ? 'loading' : 'ready',
  };

  // Quick actions for sidebar - will be defined after functions
  let quickActions: QuickActionItem[] = [];



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
        fetchData(`/api/analytics/predictions?eventId=${event.id}`, setPredictions, setLoadingPredictions);
        fetchData(`/api/analytics/debrief-summary?eventId=${event.id}`, setDebrief, setLoadingDebrief);
      }
      
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  // Real-time subscriptions for attendance_records and incident_logs
  useEffect(() => {
    if (!eventId) return;

    // Subscribe to attendance_records changes
    const attendanceSubscription = supabase
      .channel('attendance_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${eventId}`
        },
        async () => {
          // Refetch attendance data when changes occur
          const { data: records } = await supabase
            .from('attendance_records')
            .select('count, timestamp')
            .eq('event_id', eventId)
            .order('timestamp', { ascending: true });
          setAttendanceData((records || []) as AttendanceRecord[]);
        }
      )
      .subscribe();

    // Subscribe to incident_logs changes
    const incidentSubscription = supabase
      .channel('incident_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_logs',
          filter: `event_id=eq.${eventId}`
        },
        async () => {
          // Refetch incident data when changes occur
          const { data: incidents } = await supabase
            .from('incident_logs')
            .select('*')
            .eq('event_id', eventId)
            .order('timestamp', { ascending: true });
          setIncidentData((incidents || []) as IncidentRecord[]);
        }
      )
      .subscribe();

    // Cleanup subscriptions on component unmount
    return () => {
      attendanceSubscription.unsubscribe();
      incidentSubscription.unsubscribe();
    };
  }, [eventId]);

  // Fetch AI insights data
  useEffect(() => {
    if (!eventId) return;

    const fetchAIInsights = async () => {
      try {
        // Try to fetch from AI insights API endpoint
        const response = await fetch(`/api/ai-insights?eventId=${eventId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.insights && Array.isArray(data.insights)) {
            setAiInsights(data.insights);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      }

      // Fallback to mock data if API is not available
      const mockInsights = [
        "Attendance is trending upward with a 15% increase in the last hour. Consider additional staff deployment.",
        "Incident rate is below average for this event type. Current response time is 2.3 minutes.",
        "Peak attendance expected at 22:30 based on current patterns. Prepare for capacity management.",
        "Medical incidents are 20% higher than usual. Review first aid station coverage.",
        "Weather conditions may impact outdoor areas. Monitor crowd flow to indoor spaces."
      ];
      setAiInsights(mockInsights);
    };

    fetchAIInsights();
  }, [eventId]);

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





  // Fetch supplementary analytics data
  useEffect(() => {
    if (eventId) {
      const fetchAllData = async () => {
        setLoadingPredictions(true);
        setLoadingDebrief(true);
        
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

  // Define quick actions after functions are available
  quickActions = [
    {
      id: 'refresh-data',
      label: 'Refresh Data',
      icon: ArrowPathIcon,
      onClick: () => {
        // Trigger data refresh
        window.location.reload();
      },
      variant: 'secondary'
    },
    {
      id: 'new-incident',
      label: 'New Incident',
      icon: PlusIcon,
      onClick: () => {
        // Navigate to incidents page
        window.location.href = '/incidents';
      },
      variant: 'primary'
    },
    {
      id: 'export-pdf',
      label: 'Export PDF',
      icon: DocumentArrowDownIcon,
      onClick: handleExport,
      variant: 'secondary'
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      icon: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? SunIcon : MoonIcon,
      onClick: () => {
        // Toggle dark mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark');
        }
      },
      variant: 'secondary'
    }
  ];

  // Handle export completion
  const handleExportComplete = (result: any) => {
    setExportResult(result);
    if (result.success) {
      // Show success notification
      console.log('Export completed successfully:', result.filename);
    } else {
      // Show error notification
      console.error('Export failed:', result.error);
    }
  };

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
        borderColor: getEnhancedChartColors('light', 1)[0],
        backgroundColor: getEnhancedChartColors('light', 1)[0],
        tension: 0.2,
      },
      // Add dummy datasets for legend
      {
        label: `Doors Open: ${eventDetails?.doors_open_time || 'N/A'}`,
        data: [],
        borderColor: getEnhancedChartColors('light', 3)[1],
        backgroundColor: getEnhancedChartColors('light', 3)[1],
      },
      {
        label: `Main Act: ${eventDetails?.main_act_start_time || 'N/A'}`,
        data: [],
        borderColor: getEnhancedChartColors('light', 3)[2],
        backgroundColor: getEnhancedChartColors('light', 3)[2],
      },
      ...(eventDetails?.support_act_times?.map((act, index) => ({
        label: `${act.name}: ${act.time || 'N/A'}`,
        data: [],
        borderColor: getEnhancedChartColors('light', 5)[3 + index],
        backgroundColor: getEnhancedChartColors('light', 5)[3 + index],
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
  const chartTheme = getChartTheme(isDarkMode);
  const animationConfig = getAnimationConfig('entrance', false);

  const attendanceChartOptions: ChartOptions<'line'> = {
    ...getResponsiveOptions('line'),
    ...getHoverEffects(),
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTheme.textColor,
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        titleColor: chartTheme.textColor,
        bodyColor: chartTheme.textColor,
      },
      title: { display: true, text: 'Attendance Over Time', color: chartTheme.textColor },
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
        title: { display: true, text: 'Time', color: chartTheme.textColor },
        ticks: { color: chartTheme.textColor },
        grid: { color: chartTheme.gridColor },
      },
      y: {
        title: { display: true, text: 'Attendance', color: chartTheme.textColor },
        beginAtZero: true,
        ticks: { color: chartTheme.textColor },
        grid: { color: chartTheme.gridColor },
      },
    },
    animation: {
      duration: animationConfig.duration,
      easing: animationConfig.easing as any,
      delay: animationConfig.delay
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



  const incidentVolumeData = {
    labels: sortedHours.map(h => `${h}:00`),
    datasets: allIncidentTypes.map((type, index) => ({
      label: type,
      data: sortedHours.map(hour => incidentsByHourAndType[hour]?.[type] || 0),
      backgroundColor: getEnhancedChartColors('light', allIncidentTypes.length)[index],
    })),
  };

  const incidentVolumeChartOptions = {
    ...getResponsiveOptions('bar'),
    ...getHoverEffects(),
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: chartTheme.textColor,
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        },
      },
      title: { display: false, color: chartTheme.textColor },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Time of Day',
          font: { weight: 'bold' as 'bold' },
          color: chartTheme.textColor,
        },
        grid: { color: chartTheme.gridColor },
        ticks: { color: chartTheme.textColor },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Number of Incidents',
          font: { weight: 'bold' as 'bold' },
          color: chartTheme.textColor,
        },
        beginAtZero: true,
        ticks: { color: chartTheme.textColor, precision: 0 },
        grid: { color: chartTheme.gridColor },
      },
    },
    animation: {
      duration: animationConfig.duration,
      easing: animationConfig.easing as any,
      delay: animationConfig.delay
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
        backgroundColor: getEnhancedChartColors('light', pieChartLabels.length),
        borderColor: getEnhancedChartColors('light', pieChartLabels.length).map(color => color + '80'),
        borderWidth: 2,
        borderRadius: 4,
        animation: {
          duration: animationConfig.duration,
          easing: animationConfig.easing as any,
          delay: animationConfig.delay
        },
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
        backgroundColor: getEnhancedChartColors('light', Object.keys(statusCounts).length),
        borderColor: getEnhancedChartColors('light', Object.keys(statusCounts).length).map(color => color + '80'),
        borderWidth: 2,
        borderRadius: 4,
        animation: {
          duration: animationConfig.duration,
          easing: animationConfig.easing as any,
          delay: animationConfig.delay
        },
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



  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-blue-950/40 dark:to-indigo-950/30 transition-colors duration-300">
        <IconSidebar
          navigation={navigation}
          activeItem={activeSection}
          onItemClick={setActiveSection}
          title="Analytics"
        />
        
              <main className="flex-1 sidebar-content-transition ml-[var(--sidebar-width)]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 lg:mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black gradient-text tracking-tight">Analytics Dashboard</h1>
              </div>
              <p className="mt-1 text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium">Monitor performance and insights for your events</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-gray-100 shadow-lg rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 card-glow">
                <Skeleton height={20} width="50%" />
                <Skeleton height={40} width="100%" />
              </div>
            ))}
          </div>
        </div>
      </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-blue-950/40 dark:to-indigo-950/30 transition-colors duration-300">
      <IconSidebar
        navigation={navigation}
        activeItem={activeSection}
        onItemClick={setActiveSection}
        title="Analytics"
        sectionStatus={sectionStatus}
        quickActions={quickActions}
        onWidthChange={setSidebarWidth}
      />
      
      <main className="flex-1 sidebar-content-transition ml-[var(--sidebar-width)]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 lg:mb-10 gap-4">
                          <div>
                <div className="flex items-center gap-3">
                  <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black gradient-text tracking-tight">Analytics Dashboard</h1>
                </div>
                <p className="mt-1 text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium">Monitor performance and insights for your events</p>
              </div>
          </div>

        {/* Dashboard Overview - Show all content */}
        {activeSection === 'overview' && (
          <div>
      
            {/* Export Menu */}
            {eventId && (
              <div className="mb-8 flex justify-end">
                <ExportMenu
                  data={{
                    incidents: incidentData,
                    attendance: attendanceData,
                    performance: [],
                    predictions: predictions,
                    comparison: null,
                    filters: null
                  }}
                  eventId={safeEventId}
                  eventName={eventDetails?.event_date || 'Event'}
                  dateRange={undefined}
                  onExportComplete={handleExportComplete}
                />
              </div>
            )}

            {/* Top Analytics Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-10">
              {kpiData.map((kpi, index) => (
                <div key={index} className={`relative backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow animate-fade-in ${index === 0 ? 'animate-delay-100' : index === 1 ? 'animate-delay-200' : index === 2 ? 'animate-delay-300' : index === 3 ? 'animate-delay-400' : index === 4 ? 'animate-delay-500' : 'animate-delay-600'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">{kpi.title}</h3>
                      <div className="text-lg">{getKpiIcon(kpi.title)}</div>
                    </div>
                    {kpi.value ? (
                      <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{kpi.value}</p>
                    ) : (
                      <div className="group relative mt-2">
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-300 dark:text-blue-200/60">—</p>
                        <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs rounded py-1 px-2">Awaiting data</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                    {(() => {
                      let trend;
                      if (previousEventKpis) {
                        if (kpi.title === 'Total Incidents') {
                          trend = calculateTrend(totalIncidentsCountable.length, previousEventKpis.total);
                        } else if (kpi.title === 'Open Incidents') {
                          trend = calculateTrend(openIncidents.length, previousEventKpis.open);
                        } else if (kpi.title === 'Closed Incidents') {
                          trend = calculateTrend(statusCounts['Closed'], previousEventKpis.closed);
                        } else if (kpi.title === 'Peak Attendance') {
                          trend = calculateTrend(peakAttendance, previousEventKpis.peak);
                        }
                      }
 
                      if (trend && trend.percentage !== null) {
                        const color = trend.direction === 'up' ? 'text-green-600' : 'text-red-600';
                        return (
                          <span className={trend.percentage === 0 ? 'text-gray-500' : color}>
                            {trend.percentage > 0 ? '+' : ''}{trend.percentage}% vs last event
                          </span>
                        );
                      }
                      return <span className="text-gray-400">No trend data</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Grid for Charts and Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-8 lg:mb-12">
              {/* Attendance Chart */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-4 sm:p-6 lg:p-8 min-h-[340px] flex flex-col shadow-xl card-glow animate-fade-in animate-delay-100">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Attendance Timeline</h2>
                <div className="flex-grow relative">
                  {attendanceData.length > 0 ? (
                    <Line data={attendanceChartData} options={attendanceChartOptions} />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-white py-10">No attendance data to display.</p>
                  )}
                </div>
              </div>
              {/* Attendance Log */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-4 sm:p-6 lg:p-8 min-h-[340px] flex flex-col shadow-xl card-glow animate-fade-in animate-delay-200">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Attendance Log</h2>
                <div className="flex-grow overflow-y-auto">
                  {attendanceData.length > 0 ? (
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className="font-semibold text-left text-gray-900 dark:text-white p-2">Time</th>
                          <th className="font-semibold text-right text-gray-900 dark:text-white p-2">Count</th>
                          <th className="font-semibold text-right text-gray-900 dark:text-white p-2">Change</th>
                          <th className="font-semibold text-left text-gray-900 dark:text-white p-2 w-36"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {attendanceData.slice(-5).reverse().map((rec, index, arr) => {
                            const prevRec = arr[index + 1];
                            const change = prevRec ? rec.count - prevRec.count : null;
                            const loadWidth = peakAttendance > 0 ? (rec.count / peakAttendance) * 100 : 0;
                            return (
                              <tr key={index}>
                                <td colSpan={4} className="p-0">
                                  <div className="flex w-full hover:bg-gray-50 hover:shadow hover:-translate-y-0.5 transition-all duration-150 rounded-lg">
                                    <div className="p-2 text-sm md:text-base w-1/4 text-gray-900 dark:text-white">{new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="p-2 text-right font-mono text-sm md:text-base w-1/4 text-gray-900 dark:text-white">{rec.count.toLocaleString()}</div>
                                    <div className="p-2 text-right font-mono text-sm md:text-base w-1/4 text-gray-900 dark:text-white">
                                      {change !== null ? (
                                        <span className={`flex items-center justify-end font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {change > 0 ? <FaArrowUp className="mr-1 h-3 w-3" /> : <FaArrowDown className="mr-1 h-3 w-3" />}
                                          {change > 0 ? '+' : '−'}{Math.abs(change).toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </div>
                                    <div className="p-2 align-middle w-1/4 text-gray-900 dark:text-white">
                                      <div className="w-full bg-gray-200 rounded-full h-2" title={`${Math.round(loadWidth)}% capacity`}>
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${loadWidth}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          </tbody>
                        </table>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-white py-10">No attendance data to display.</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                  {eventDetails?.expected_attendance && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-700 dark:text-white">Attendance Progress</h3>
                        <span className="font-extrabold text-gray-900 dark:text-white">{Math.round(attendancePercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                      </div>
                      <p className="text-right text-xs text-gray-500 dark:text-white mt-1">
                        {currentAttendance.toLocaleString()} / {expectedAttendance.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <h3 className="font-semibold mb-2 text-gray-700 dark:text-white">Quick Stats</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-gray-500 dark:text-white">Peak</p>
                      <p className="font-extrabold text-lg text-gray-900 dark:text-white">{peakAttendance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-white">Average</p>
                      <p className="font-extrabold text-lg text-gray-900 dark:text-white">{averageAttendance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-white">Median</p>
                      <p className="font-extrabold text-lg text-gray-900 dark:text-white">{medianAttendance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-white">Peak Time</p>
                      <p className="font-extrabold text-lg text-gray-900 dark:text-white">{timeOfMaxIncrease ? new Date(timeOfMaxIncrease).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Live Incident Status */}
              {eventId && <LiveIncidentStatus eventId={eventId} />}
            </div>

            {/* Second Row: Incident Analysis & Staff Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-8 lg:mb-12">
              {/* Merged Incident Analysis Card */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 shadow-xl p-4 sm:p-6 lg:p-8 min-h-[270px] flex flex-col xl:col-span-1 card-glow animate-fade-in animate-delay-400">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Incident Analysis</h2>
                <div className="flex-grow grid grid-cols-2 gap-4">
                  {/* Incident Volume Chart */}
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg text-center text-gray-800 dark:text-white mb-2">Volume Over Time</h3>
                    <div className="flex-grow relative">
                      {filteredIncidents.length > 0 ? (
                        <Bar data={incidentVolumeData} options={incidentVolumeChartOptions} />
                      ) : (
                        <p className="text-center text-gray-500 dark:text-white py-10">No incident data.</p>
                      )}
                    </div>
                  </div>
                  {/* Incident Types Pie */}
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg text-center text-gray-800 dark:text-white mb-2">Breakdown by Type</h3>
                    <div className="flex-grow relative">
                      {filteredIncidents.length > 0 ? (
                        <div className="h-full w-full flex items-center justify-center">
                          <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 dark:text-white py-10">No incident data.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Efficiency Widget */}
              {eventId && <StaffEfficiencyWidget eventId={eventId} />}

              {/* Venue Capacity Widget */}
              {eventId && <VenueCapacityWidget eventId={eventId} />}
            </div>

            {/* Third Row: AI Insights & Predictive Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-8 lg:mb-12">
              {/* Enhanced AI Insights */}
              <div className="xl:col-span-2">
                <EnhancedAIInsights 
                  insights={aiInsights.map((insight, index) => ({
                    id: `insight-${index}`,
                    content: insight,
                    type: 'analysis' as const,
                    priority: 'medium' as const,
                    timestamp: new Date().toISOString(),
                    confidence: 85
                  }))}
                  cycleInterval={15000}
                />
              </div>

              {/* Predictive Insights */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 shadow-xl p-4 sm:p-6 lg:p-8 min-h-[340px] flex flex-col card-glow animate-fade-in animate-delay-600">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Predictive Insights</h2>
                <div className="flex-grow flex items-center justify-center">
                  {loadingPredictions ? (
                    <Skeleton height={80} />
                  ) : (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <FaExclamationTriangle className="mx-auto text-red-500 h-8 w-8 mb-2" />
                        <p className="font-semibold text-sm">Most Likely Incident</p>
                        <p className="text-lg">{predictions.likelyType || 'N/A'}</p>
                      </div>
                      <div>
                        <FaMapMarkerAlt className="mx-auto text-blue-500 h-8 w-8 mb-2" />
                        <p className="font-semibold text-sm">Most Likely Location</p>
                        <p className="text-lg">{predictions.likelyLocation || 'N/A'}</p>
                      </div>
                      <div>
                        <FaClock className="mx-auto text-green-500 h-8 w-8 mb-2" />
                        <p className="font-semibold text-sm">Most Likely Hour</p>
                        <p className="text-lg">{predictions.likelyHour || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fourth Row: Debrief Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {/* Debrief Summary */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 shadow-xl p-4 sm:p-6 lg:p-8 min-h-[340px] flex flex-col xl:col-span-3 card-glow animate-fade-in animate-delay-600">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center flex-shrink-0 mb-4 gap-2">
                  <h2 className="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight">Debrief Summary</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => eventId && handleGenerateDebrief(eventId)}
                      disabled={isGeneratingDebrief}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow disabled:bg-gray-400 flex items-center"
                    >
                      {isGeneratingDebrief ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        'Generate Debrief'
                      )}
                    </button>
                    <button onClick={handleExport} className="p-2 text-gray-600 hover:text-black disabled:opacity-50" disabled={!debrief.eventOverview && !manualNotes} title="Export as PDF">
                      <FaFileExport />
                    </button>
                    <button onClick={handlePrint} className="p-2 text-gray-600 hover:text-black" title="Print">
                      <FaPrint />
                    </button>
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                  {loadingDebrief ? (
                    <Skeleton height={200} />
                  ) : (
                    <div id="debrief-report" className="p-2">
                      {debriefError && <p className="text-red-500 mb-4">Error: {debriefError}</p>}
                      <section className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Event Overview and Key Statistics</h3>
                        <p className="text-gray-700 mb-2">
                          {debrief.eventOverview}
                        </p>
                        {debrief.attendanceSummary && <p className="text-gray-700 mt-2">{debrief.attendanceSummary}</p>}
                      </section>

                      <section className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Significant Incidents</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border text-sm bg-white dark:bg-[#23408e] text-gray-900 dark:text-white">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-[#23408e] dark:text-white">
                                <th className="border px-3 py-2 text-left">Date</th>
                                <th className="border px-3 py-2 text-left">Type</th>
                                <th className="border px-3 py-2 text-left">Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {debrief.significantIncidents?.map((incident, index) => (
                                <tr key={index}>
                                  <td className="border px-3 py-2">{incident.date}</td>
                                  <td className="border px-3 py-2">{incident.type}</td>
                                  <td className="border px-3 py-2">{incident.details}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Key Learning Points & Recommendations</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {debrief.learningPoints?.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </section>

                      <section className="mb-4">
                        <label htmlFor="supervisor-notes" className="block text-md font-semibold mb-1">Supervisor Notes:</label>
                        <textarea
                          id="supervisor-notes"
                          rows={3}
                          placeholder="Add manual notes here..."
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          className="w-full border rounded p-2 text-gray-700 focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className="mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded shadow disabled:bg-gray-400"
                        >
                          {isSavingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                      </section>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Doors Open Time</label>
                        <div className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100">
                          {eventDetails?.doors_open_time || '-'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Attendance Section - Focus on attendance data */}
        {activeSection === 'attendance' && (
          <div>
            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-10">
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Current Attendance</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{currentAttendance.toLocaleString()}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  {eventDetails?.expected_attendance && (
                    <span>{Math.round(attendancePercentage)}% of expected</span>
                  )}
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Peak Attendance</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{peakAttendance.toLocaleString()}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  {timeOfMaxIncrease && (
                    <span>Peak at {new Date(timeOfMaxIncrease).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Average Attendance</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{averageAttendance.toLocaleString()}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Time-weighted average
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Median Attendance</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{medianAttendance.toLocaleString()}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Middle value
                </div>
              </div>
            </div>

            {/* Attendance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-8 lg:mb-12">
              {/* Attendance Timeline Chart */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-4 sm:p-6 lg:p-8 min-h-[400px] flex flex-col shadow-xl card-glow">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Attendance Timeline</h2>
                <div className="flex-grow relative">
                  {attendanceData.length > 0 ? (
                    <Line data={attendanceChartData} options={attendanceChartOptions} />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-white py-10">No attendance data to display.</p>
                  )}
                </div>
              </div>

              {/* Attendance Log */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-4 sm:p-6 lg:p-8 min-h-[400px] flex flex-col shadow-xl card-glow">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Attendance Log</h2>
                <div className="flex-grow overflow-y-auto">
                  {attendanceData.length > 0 ? (
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className="font-semibold text-left text-gray-900 dark:text-white p-2">Time</th>
                          <th className="font-semibold text-right text-gray-900 dark:text-white p-2">Count</th>
                          <th className="font-semibold text-right text-gray-900 dark:text-white p-2">Change</th>
                          <th className="font-semibold text-left text-gray-900 dark:text-white p-2 w-36"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {attendanceData.slice(-10).reverse().map((rec, index, arr) => {
                          const prevRec = arr[index + 1];
                          const change = prevRec ? rec.count - prevRec.count : null;
                          const loadWidth = peakAttendance > 0 ? (rec.count / peakAttendance) * 100 : 0;
                          return (
                            <tr key={index}>
                              <td colSpan={4} className="p-0">
                                <div className="flex w-full hover:bg-gray-50 hover:shadow hover:-translate-y-0.5 transition-all duration-150 rounded-lg">
                                  <div className="p-2 text-sm md:text-base w-1/4 text-gray-900 dark:text-white">{new Date(rec.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                                  <div className="p-2 text-right font-mono text-sm md:text-base w-1/4 text-gray-900 dark:text-white">{rec.count.toLocaleString()}</div>
                                  <div className="p-2 text-right font-mono text-sm md:text-base w-1/4 text-gray-900 dark:text-white">
                                    {change !== null ? (
                                      <span className={`flex items-center justify-end font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {change > 0 ? <FaArrowUp className="mr-1 h-3 w-3" /> : <FaArrowDown className="mr-1 h-3 w-3" />}
                                        {change > 0 ? '+' : '−'}{Math.abs(change).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                  <div className="p-2 align-middle w-1/4 text-gray-900 dark:text-white">
                                    <div className="w-full bg-gray-200 rounded-full h-2" title={`${Math.round(loadWidth)}% capacity`}>
                                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${loadWidth}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-white py-10">No attendance data to display.</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                  {eventDetails?.expected_attendance && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-700 dark:text-white">Attendance Progress</h3>
                        <span className="font-extrabold text-gray-900 dark:text-white">{Math.round(attendancePercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                      </div>
                      <p className="text-right text-xs text-gray-500 dark:text-white mt-1">
                        {currentAttendance.toLocaleString()} / {expectedAttendance.toLocaleString()}
                      </p>
                    </div>
                  )}
                                 </div>
               </div>
             </div>

             {/* Venue Capacity Widget */}
             {eventId && (
               <div className="mb-8 lg:mb-12">
                 <VenueCapacityWidget eventId={eventId} />
               </div>
             )}
           </div>
         )}

        {/* Incidents Section - Focus on incident data */}
        {activeSection === 'incidents' && (
          <div>
            {/* Incident Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-10">
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Total Incidents</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{totalIncidentsCountable.length}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  All incident types
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Open Incidents</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{openIncidents.length}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Requiring attention
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Closed Incidents</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{statusCounts['Closed']}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Resolved
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Avg Response Time</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{avgResponseTimeDisplay}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Time to resolution
                </div>
              </div>
            </div>

            {/* Incident Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-8 lg:mb-12">
              {/* Incident Volume Chart */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-4 sm:p-6 lg:p-8 min-h-[400px] flex flex-col shadow-xl card-glow">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Incident Volume Over Time</h2>
                <div className="flex-grow relative">
                  {filteredIncidents.length > 0 ? (
                    <Bar data={incidentVolumeData} options={incidentVolumeChartOptions} />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-white py-10">No incident data to display.</p>
                  )}
                </div>
              </div>

              {/* Incident Types Breakdown */}
              <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-4 sm:p-6 lg:p-8 min-h-[400px] flex flex-col shadow-xl card-glow">
                <h2 className="font-extrabold text-xl sm:text-2xl mb-4 text-gray-900 dark:text-white tracking-tight">Incident Types Breakdown</h2>
                <div className="flex-grow relative">
                  {filteredIncidents.length > 0 ? (
                    <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-white py-10">No incident data to display.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Live Incident Status */}
            {eventId && (
              <div className="mb-8 lg:mb-12">
                <LiveIncidentStatus eventId={eventId} />
              </div>
            )}
          </div>
        )}

        {/* AI Insights Section - Focus on AI and predictive data */}
        {activeSection === 'ai-insights' && (
          <div>
            {/* AI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-10">
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Most Likely Incident</h3>
                  <p className="mt-2 text-lg font-black tracking-tight">{predictions.likelyType || 'N/A'}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Predicted type
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Most Likely Location</h3>
                  <p className="mt-2 text-lg font-black tracking-tight">{predictions.likelyLocation || 'N/A'}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Predicted area
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">Most Likely Hour</h3>
                  <p className="mt-2 text-lg font-black tracking-tight">{predictions.likelyHour || 'N/A'}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Predicted time
                </div>
              </div>
              <div className="backdrop-blur-card bg-white/95 dark:bg-[#23408e]/95 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 p-5 sm:p-6 flex flex-col justify-between shadow-lg card-glow">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-600 dark:text-blue-100">AI Insights</h3>
                  <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{aiInsights.length}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-blue-100 mt-2">
                  Active insights
                </div>
              </div>
            </div>

            {/* AI Insights Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-8 lg:mb-12">
              {/* Enhanced AI Insights */}
              <div className="lg:col-span-2">
                <EnhancedAIInsights 
                  insights={aiInsights.map((insight, index) => ({
                    id: `insight-${index}`,
                    content: insight,
                    type: 'analysis' as const,
                    priority: 'medium' as const,
                    timestamp: new Date().toISOString(),
                    confidence: 85
                  }))}
                  cycleInterval={15000}
                />
              </div>
            </div>

            {/* Staff Efficiency Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 sm:gap-8 lg:gap-10">
              {eventId && <StaffEfficiencyWidget eventId={eventId} />}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}



 
 