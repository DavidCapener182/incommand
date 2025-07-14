import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import pattern from 'patternomaly';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function getChartTextColor() {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return '#fff';
  }
  return '#222';
}

// Define a visually distinct color palette
const colorPalette = [
  '#A23E48', // Red
  '#F59E42', // Orange
  '#2A3990', // Blue
  '#4F8A8B', // Teal
  '#FFD166', // Yellow
  '#06D6A0', // Green
  '#118AB2', // Cyan
  '#7E78D2', // Purple
  '#E94F37', // Bright Red
  '#B388FF', // Lavender
  '#FF61A6', // Pink
  '#00B8A9', // Aqua
  '#F67280', // Coral
  '#355C7D', // Navy
  '#C06C84', // Mauve
  '#6C5B7B', // Plum
  '#355C7D', // Slate
  '#F8B195', // Peach
  '#F67280', // Salmon
  '#99B898', // Sage
];

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

interface Props {
  incidentData?: IncidentRecord[];
}

export default function IncidentVolumeWidget({ incidentData }: Props) {
  const safeIncidentData = incidentData || [];
  console.log('INCIDENTS IN WIDGET:', safeIncidentData);
  // Filter out Attendance, Sit Rep, Timings (case-insensitive)
  const filteredIncidents = safeIncidentData.filter(
    (incident) => !['attendance', 'sit rep', 'timings'].includes((incident.incident_type || '').toLowerCase())
  );
  console.log('FILTERED INCIDENTS (for chart):', filteredIncidents);

  // Prepare data
  const incidentsByHourAndType: { [hour: string]: { [type: string]: number } } = {};
  const allIncidentTypes = Array.from(new Set(filteredIncidents.map(i => i.incident_type)));

  // Filter out unwanted types for display
  const excludedTypes = [
    'Staffing',
    'Artist on Stage',
    'Artist off Stage',
  ];
  // Also exclude any type containing 'Event Timing' (case-insensitive)
  const filteredIncidentTypes = allIncidentTypes.filter(type =>
    !excludedTypes.includes(type) &&
    !/event timing/i.test(type)
  );

  // Assign a unique color to each incident type (filtered)
  const typeColorMap: { [key: string]: string } = {};
  filteredIncidentTypes.forEach((type, idx) => {
    typeColorMap[type] = colorPalette[idx % colorPalette.length];
  });

  filteredIncidents.forEach((incident) => {
    const hour = new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit' });
    if (!incidentsByHourAndType[hour]) {
      incidentsByHourAndType[hour] = {};
    }
    incidentsByHourAndType[hour][incident.incident_type] = (incidentsByHourAndType[hour][incident.incident_type] || 0) + 1;
  });

  const sortedHours = Object.keys(incidentsByHourAndType).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const data = {
    labels: sortedHours.map(h => `${h}:00`),
    datasets: filteredIncidentTypes.map(type => ({
      label: type,
      data: sortedHours.map(hour => incidentsByHourAndType[hour]?.[type] || 0),
      backgroundColor: typeColorMap[type],
    })),
  };

  const options = {
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

  const hasData = filteredIncidentTypes.length > 0 && data.labels.length > 0 && data.datasets.some(ds => ds.data.some((v: number) => v > 0));

  return (
    <div className="h-80 w-full flex flex-col">
      {/* No internal heading, let the grid handle it */}
      <div className="flex-1">
        {hasData ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No incident data to display.</div>
        )}
      </div>
    </div>
  );
} 