import React from 'react';

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
        tabIndex={0}
      >
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
      </button>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg p-2 text-xs z-50">
          {text}
        </div>
      )}
    </span>
  );
}

interface KPI {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number | null;
  trendDirection?: 'up' | 'down' | 'flat';
}

interface KPISummaryWidgetProps {
  kpiData: KPI[];
}

function getTrendColor(direction: 'up' | 'down' | 'flat') {
  if (direction === 'up') return 'text-green-500';
  if (direction === 'down') return 'text-red-500';
  return 'text-gray-500';
}

// Tooltip messages for each KPI
const KPI_TOOLTIPS: { [key: string]: string } = {
  'Avg Response Time': 'From incident log to action.',
  'Peak Attendance': 'Highest recorded attendance during the event.',
  'Open Incidents': 'Incidents currently unresolved.',
  'Closed Incidents': 'Incidents marked as resolved.',
  'Most Likely Type': 'Incident type predicted to occur most frequently.',
  'Total Incidents': 'Total number of incidents logged.',
};

export default function KPISummaryWidget({ kpiData }: KPISummaryWidgetProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiData.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-white shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative"
        >
          {/* Tooltip in top right */}
          {KPI_TOOLTIPS[kpi.title] && (
            <div className="absolute top-3 right-3 z-10">
              <TooltipIcon text={KPI_TOOLTIPS[kpi.title]} />
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500 dark:text-white flex items-center">
              {kpi.title}
            </span>
            <span className="text-lg">{kpi.icon}</span>
          </div>
          <div className="flex items-end justify-between flex-1">
            <span className="text-2xl font-bold dark:text-white">{kpi.value}</span>
            {kpi.trend !== undefined && kpi.trendDirection && (
              <span className={`ml-2 text-xs font-semibold flex items-center ${getTrendColor(kpi.trendDirection)}`}>
                {kpi.trendDirection === 'up' && <span className="mr-1">▲</span>}
                {kpi.trendDirection === 'down' && <span className="mr-1">▼</span>}
                {kpi.trend !== null ? `${kpi.trend > 0 ? '+' : ''}${kpi.trend}%` : ''}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 