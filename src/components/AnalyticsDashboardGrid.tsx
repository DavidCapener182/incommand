import React from 'react';
import AttendanceTimelineWidget from './AttendanceTimelineWidget';
import AttendanceLogWidget from './AttendanceLogWidget';
import KPISummaryWidget from './KPISummaryWidget';
import IncidentVolumeWidget from './IncidentVolumeWidget';

// 1. Import new widget components or create placeholders
import LiveAttendanceCounterWidget from './LiveAttendanceCounterWidget';
import EntryExitTimelineWidget from './EntryExitTimelineWidget';
import GateBottlenecksWidget from './GateBottlenecksWidget';
import OccupancyThresholdAlertWidget from './OccupancyThresholdAlertWidget';
import IncidentFeedWidget from './IncidentFeedWidget';
import IncidentMapWidget from './IncidentMapWidget';
import IncidentTypeBreakdownWidget from './IncidentTypeBreakdownWidget';
import SeverityTrendWidget from './SeverityTrendWidget';
import OnDutyStaffWidget from './OnDutyStaffWidget';
import UnassignedCallsignsWidget from './UnassignedCallsignsWidget';
import RadioSignOutWidget from './RadioSignOutWidget';
import AnnouncementsWidget from './AnnouncementsWidget';
import TasksActionsWidget from './TasksActionsWidget';
import WeatherWidget from './WeatherWidget';
import TransportUpdateWidget from './TransportUpdateWidget';
import LostFoundWidget from './LostFoundWidget';
import FeedbackPulseWidget from './FeedbackPulseWidget';

// Snap size presets
const SIZE_PRESETS = {
  small: { w: 1, h: 1, px: 250, py: 200 },
  medium: { w: 2, h: 1, px: 500, py: 200 },
  large: { w: 2, h: 2, px: 500, py: 420 },
};
const SIZE_KEYS = ['small', 'medium', 'large'];

// 2. Add all widgets to the WIDGETS array
const WIDGETS = [
  {
    key: 'incident-log',
    label: 'Attendance Log',
    component: AttendanceLogWidget,
    defaultSize: 'medium',
  },
  {
    key: 'attendance-timeline',
    label: 'Attendance Timeline',
    component: AttendanceTimelineWidget,
    defaultSize: 'large',
  },
  {
    key: 'incident-volume',
    label: 'Incident Volume Over Time',
    component: IncidentVolumeWidget,
    defaultSize: 'large',
  },
  { key: 'live-attendance-counter', label: 'Live Attendance Counter', component: LiveAttendanceCounterWidget, defaultSize: 'small' },
  { key: 'entry-exit-timeline', label: 'Entry/Exit Timeline', component: EntryExitTimelineWidget, defaultSize: 'medium' },
  { key: 'gate-bottlenecks', label: 'Gate Bottlenecks', component: GateBottlenecksWidget, defaultSize: 'small' },
  { key: 'occupancy-threshold-alert', label: 'Occupancy Threshold Alert', component: OccupancyThresholdAlertWidget, defaultSize: 'small' },
  { key: 'incident-feed', label: 'Incident Feed', component: IncidentFeedWidget, defaultSize: 'medium' },
  { key: 'incident-map', label: 'Incident Map', component: IncidentMapWidget, defaultSize: 'medium' },
  { key: 'incident-type-breakdown', label: 'Incident Type Breakdown', component: IncidentTypeBreakdownWidget, defaultSize: 'small' },
  { key: 'severity-trend', label: 'Severity Trend', component: SeverityTrendWidget, defaultSize: 'small' },
  { key: 'on-duty-staff', label: 'On-Duty Staff by Area', component: OnDutyStaffWidget, defaultSize: 'small' },
  { key: 'unassigned-callsigns', label: 'Unassigned Callsigns Alert', component: UnassignedCallsignsWidget, defaultSize: 'small' },
  { key: 'radio-sign-out', label: 'Radio Sign-Out Widget', component: RadioSignOutWidget, defaultSize: 'small' },
  { key: 'announcements', label: 'Announcements Widget', component: AnnouncementsWidget, defaultSize: 'small' },
  { key: 'tasks-actions', label: 'Tasks & Actions', component: TasksActionsWidget, defaultSize: 'small' },
  { key: 'weather', label: 'Weather Widget', component: WeatherWidget, defaultSize: 'small' },
  { key: 'transport-update', label: 'Transport/Traffic Update', component: TransportUpdateWidget, defaultSize: 'small' },
  { key: 'lost-found', label: 'Lost & Found', component: LostFoundWidget, defaultSize: 'small' },
  { key: 'feedback-pulse', label: 'Feedback/Pulse', component: FeedbackPulseWidget, defaultSize: 'small' },
];

// Helper: List of placeholder widget keys
const PLACEHOLDER_WIDGET_KEYS = [
  'live-attendance-counter',
  'entry-exit-timeline',
  'gate-bottlenecks',
  'occupancy-threshold-alert',
  'incident-feed',
  'incident-map',
  'incident-type-breakdown',
  'severity-trend',
  'on-duty-staff',
  'unassigned-callsigns',
  'radio-sign-out',
  'announcements',
  'tasks-actions',
  'weather',
  'transport-update',
  'lost-found',
  'feedback-pulse',
];

// 3. Add localStorage persistence for widget state
const DASHBOARD_STATE_KEY = 'analyticsDashboardStateV1';

interface AttendanceRecord {
  count: number;
  timestamp: string;
}

interface KPI {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number | null;
  trendDirection?: 'up' | 'down' | 'flat';
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

interface AnalyticsDashboardGridProps {
  attendanceData: AttendanceRecord[];
  expectedAttendance?: number;
  kpiData: KPI[];
  incidentData: IncidentRecord[];
  onRefresh?: () => void; // Optional prop for triggering a refresh
}

type WidgetSize = 'small' | 'medium' | 'large';

interface WidgetState {
  key: string;
  size: WidgetSize;
  locked?: boolean;
}

function getPresetForSize(size: WidgetSize) {
  return SIZE_PRESETS[size];
}

// TooltipIcon for info tooltips
function TooltipIcon({ text }: { text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        className="text-blue-500 hover:text-blue-700 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label="Info"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
      </button>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg p-2 text-xs z-50">
          {text}
        </div>
      )}
    </span>
  );
}

// Empty state message component
function EmptyState({ message = "No data available. Check back soon!" }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
      <svg width="48" height="48" fill="none" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" stroke="#cbd5e1" strokeWidth="4" fill="#f1f5f9"/><text x="24" y="30" textAnchor="middle" fontSize="18" fill="#94a3b8">:)</text></svg>
      <div className="mt-2 text-base">{message}</div>
    </div>
  );
}

export default function AnalyticsDashboardGrid({ attendanceData, expectedAttendance, kpiData, incidentData, onRefresh }: AnalyticsDashboardGridProps) {
  // Replace initial state with localStorage restore
  const [widgets, setWidgets] = React.useState<WidgetState[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(DASHBOARD_STATE_KEY);
      if (saved) {
        try {
          // Remove placeholder widgets from saved state
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed)
            ? parsed.filter((w: WidgetState) => !PLACEHOLDER_WIDGET_KEYS.includes(w.key))
            : [];
        } catch {}
      }
    }
    // Only show non-placeholder widgets by default
    return WIDGETS.filter(w => !PLACEHOLDER_WIDGET_KEYS.includes(w.key)).map(w => ({ key: w.key, size: w.defaultSize as WidgetSize }));
  });

  // Save to localStorage on any change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(widgets));
    }
  }, [widgets]);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  // Auto-refresh effect
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      } else {
        // fallback: reload the page
        window.location.reload();
      }
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState<{ key: string, open: boolean }>({ key: '', open: false });

  // Add widget
  const handleAddWidget = (key: string) => {
    setWidgets(prev => prev.some(w => w.key === key) ? prev : [...prev, { key, size: (WIDGETS.find(w => w.key === key)?.defaultSize as WidgetSize) || 'medium' }]);
    setDropdownOpen(false);
  };

  // Remove widget (after confirmation)
  const handleRemoveWidget = (key: string) => {
    setWidgets(prev => prev.filter(w => w.key !== key));
    setConfirmClose({ key: '', open: false });
  };

  // Resize widget
  const handleResize = (key: string, newSize: WidgetSize) => {
    setWidgets(prev => prev.map(w => w.key === key ? { ...w, size: newSize } : w));
  };

  // For dropdown: hidden widgets (including placeholders not currently visible)
  const hiddenWidgets = WIDGETS.filter(w => !widgets.some(v => v.key === w.key));

  // Responsive: stack on mobile
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <div className="w-full h-full min-h-[60vh]">
      {/* Auto-Refresh Toggle and Add Widget Button */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold">Custom Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          {/* Auto-Refresh Toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-3 py-1 text-sm text-gray-700 shadow-sm">
            <span>Auto-Refresh</span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="accent-blue-600"
            />
          </div>
          {/* + Add Widget Button */}
          <div className="relative">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => setDropdownOpen(d => !d)}
              disabled={hiddenWidgets.length === 0}
            >
              + Add Widget
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                {hiddenWidgets.length === 0 ? (
                  <div className="px-4 py-2 text-gray-400">No widgets to add</div>
                ) : (
                  hiddenWidgets.map(w => (
                    <button
                      key={w.key}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                      onClick={() => handleAddWidget(w.key)}
                    >
                      {w.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* KPI summary always at the top, outside the grid */}
      <div className="mb-6">
        <KPISummaryWidget kpiData={kpiData} />
      </div>
      {/* Drag-and-drop placeholder */}
      {/* TODO: Implement drag-and-drop for widgets */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        {widgets.map(w => {
          const widgetMeta = WIDGETS.find(meta => meta.key === w.key);
          if (!widgetMeta) return null;
          const WidgetComponent = widgetMeta.component;
          const preset = getPresetForSize(w.size);
          // For mobile, always full width
          const colSpan = isMobile ? 'col-span-1' : w.size === 'small' ? 'col-span-4' : w.size === 'medium' ? 'col-span-6' : 'col-span-12';
          return (
            <div
              key={w.key}
              className={`relative bg-white dark:bg-[#23408e] text-gray-900 dark:text-white shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full h-full ${colSpan} p-6`}
              style={{ minWidth: isMobile ? '100%' : preset.px, minHeight: preset.py, gridColumn: isMobile ? undefined : `span ${w.size === 'small' ? 4 : w.size === 'medium' ? 6 : 12}` }}
            >
              <div className="flex items-center justify-between mb-2 widget-header">
                <span className="font-semibold text-lg">{widgetMeta.label}</span>
                <div className="flex items-center gap-2">
                  {/* Size toggle (small/medium/large) */}
                  {!w.locked && (
                    <ResizeHandle
                      currentSize={w.size}
                      onResize={size => handleResize(w.key, size)}
                    />
                  )}
                  <button
                    className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
                    onClick={() => setConfirmClose({ key: w.key, open: true })}
                    aria-label="Close widget"
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Confirmation dialog */}
              {confirmClose.open && confirmClose.key === w.key && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
                  <div className="bg-white rounded shadow-lg p-6 flex flex-col items-center">
                    <p className="mb-4 text-gray-800">Are you sure you want to remove this widget?</p>
                    <div className="flex gap-4">
                      <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => handleRemoveWidget(w.key)}>Yes, remove</button>
                      <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setConfirmClose({ key: '', open: false })}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Widget content */}
              <div className="flex-1 w-full h-full">
                <WidgetComponent
                  attendanceData={attendanceData}
                  expectedAttendance={expectedAttendance}
                  incidentData={incidentData}
                />
              </div>
              {/* Remove bottom-right resize handle */}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Resize handle component
function ResizeHandle({ currentSize, onResize }: { currentSize: WidgetSize; onResize: (size: WidgetSize) => void }) {
  // Show all sizes except current
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 shadow border border-gray-300 dark:border-gray-600">
      {SIZE_KEYS.filter(s => s !== currentSize).map(size => (
        <button
          key={size}
          className="text-xs px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => onResize(size as WidgetSize)}
        >
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </button>
      ))}
    </div>
  );
} 