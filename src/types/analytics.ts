// Analytics TypeScript interfaces

// Filter interfaces
export interface DateRange {
  from: string; // ISO date string
  to: string; // ISO date string
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  compareMode: 'none' | 'previousEvent' | 'customPeriod' | 'customEvent';
  compareEventId?: string;
  compareDateRange?: DateRange;
  eventId: string;
}

export interface FilterPreset {
  id: string;
  label: string;
  getDateRange: () => DateRange;
}

export interface FilterErrors {
  dateRange?: string;
  comparison?: string;
}

// Comparison data interfaces
export interface ComparisonMetric {
  current: number;
  comparison: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ComparisonData {
  incidents: ComparisonMetric;
  attendance: ComparisonMetric;
  responseTime: ComparisonMetric;
  staffEfficiency: ComparisonMetric;
  crowdDensity: ComparisonMetric;
  weatherRisk: ComparisonMetric;
  resolutionRate: ComparisonMetric;
}

// Export interfaces
export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json';
export type ExportScope = 'current' | 'all' | 'comparison' | 'summary' | 'custom';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  filename?: string;
  includeCharts: boolean;
  includeBranding: boolean;
  dateRange?: DateRange;
  customSections?: string[];
}

export interface ExportData {
  incidents: any[];
  attendance: any[];
  performance: any[];
  predictions: any[];
  comparison?: any[];
  metadata: {
    eventId: string;
    eventName: string;
    exportDate: string;
    dateRange: string;
    filters: any;
  };
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

// Dashboard customization interfaces
export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type WidgetType = 'incidents' | 'attendance' | 'performance' | 'predictions' | 'staff' | 'weather' | 'social' | 'ai-insights';

export interface DashboardPreferences {
  visibleWidgets: WidgetType[];
  layout: 'compact' | 'expanded';
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
}

export interface WidgetConfig {
  type: WidgetType;
  label: string;
  description: string;
  required: boolean;
  roles: UserRole[];
  defaultVisible: boolean;
}

// API response interfaces
export interface FilteredDataResponse {
  current: AnalyticsData;
  comparison: AnalyticsData | null;
  metrics: ComparisonData | null;
  metadata: {
    eventId: string;
    dateRange: {
      from: string | null;
      to: string | null;
    };
    comparisonRange: {
      from: string | null;
      to: string | null;
      eventId: string | null;
    };
    includeComparison: boolean;
    timestamp: string;
  };
}

export interface AnalyticsData {
  incidents: IncidentData[];
  attendance: AttendanceData[];
  performance: PerformanceData[];
  kpis: KPIData;
}

export interface IncidentData {
  id: string;
  type: string;
  status: string;
  severity: string;
  location: string;
  timestamp: string;
  description: string;
  assigned_staff?: string;
  response_time?: number;
  resolution_time?: number;
  event_id: string;
}

export interface AttendanceData {
  id: string;
  timestamp: string;
  count: number;
  location: string;
  density: number;
  trend: string;
  event_id: string;
}

export interface PerformanceData {
  id: string;
  timestamp: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  status: string;
  efficiency_score?: number;
  event_id: string;
}

export interface KPIData {
  totalIncidents: number;
  resolvedIncidents: number;
  resolutionRate: number;
  avgResponseTime: number;
  peakAttendance: number;
  avgStaffEfficiency: number;
  dataPoints: {
    incidents: number;
    attendance: number;
    performance: number;
  };
}

// Chart configuration interfaces
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar';
  data: any;
  options: any;
  plugins?: any[];
}

export interface ComparisonChartConfig extends ChartConfig {
  comparisonData: any;
  showComparison: boolean;
}

// Event interfaces
export interface EventData {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  organizer_id: string;
  venue: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// User interfaces
export interface UserData {
  id: string;
  email: string;
  user_metadata?: {
    role?: UserRole;
    name?: string;
    organization?: string;
  };
  app_metadata?: {
    role?: UserRole;
  };
}

// Permission interfaces
export interface ExportPermissions {
  pdf: boolean;
  csv: boolean;
  excel: boolean;
  json: boolean;
}

export interface DataAccessLevel {
  level: 'all' | 'assigned' | 'own';
  description: string;
}

// Widget visibility interfaces
export type WidgetVisibilityState = {
  [key in WidgetType]: boolean;
}

// Theme interfaces
export interface ThemeConfig {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

// Notification interfaces
export interface ExportNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  filename?: string;
  timestamp: string;
}

// History interfaces
export interface ExportHistoryEntry {
  id: string;
  timestamp: string;
  success: boolean;
  filename?: string;
  error?: string;
  format: ExportFormat;
  scope: ExportScope;
}

// Error interfaces
export interface AnalyticsError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Loading state interfaces
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

// Filter state interfaces
export interface FilterState {
  filters: AnalyticsFilters;
  isValid: boolean;
  errors: FilterErrors;
  isDirty: boolean;
}

// Comparison state interfaces
export interface ComparisonState {
  isEnabled: boolean;
  mode: AnalyticsFilters['compareMode'];
  data: ComparisonData | null;
  isLoading: boolean;
  error?: string;
}

// Export state interfaces
export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentFormat: ExportFormat;
  queue: ExportQueueItem[];
  history: ExportHistoryEntry[];
}

export interface ExportQueueItem {
  id: string;
  data: ExportData;
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: ExportResult;
}

// Utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for making properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Utility type for API responses
export interface APIResponse<T> {
  data: T;
  error?: string;
  success: boolean;
  timestamp: string;
}

// Utility type for paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Utility type for real-time updates
export interface RealtimeUpdate<T> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: T;
  timestamp: string;
}
