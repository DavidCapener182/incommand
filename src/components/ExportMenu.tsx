import React, { useState } from 'react';
import { ExportFormat, ExportScope, ExportOptions, exportAnalyticsData, ExportHistory } from '../utils/exportUtils';
import { useDashboardCustomization } from '../hooks/useDashboardCustomization';

interface ExportMenuProps {
  data: any;
  eventId: string;
  eventName: string;
  dateRange?: { from: string; to: string };
  onExportComplete?: (result: { success: boolean; filename?: string; error?: string }) => void;
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  data,
  eventId,
  eventName,
  dateRange,
  onExportComplete,
  className = ''
}) => {
  // Safety check for required props
  if (!eventId || !data) {
    return null;
  }

  const { canExport, getExportPermissions } = useDashboardCustomization();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    scope: 'current',
    includeCharts: true,
    includeBranding: true
  });

  const exportPermissions = getExportPermissions();

  // Handle export format change
  const handleFormatChange = (format: ExportFormat) => {
    setExportOptions(prev => ({ ...prev, format }));
  };

  // Handle export scope change
  const handleScopeChange = (scope: ExportScope) => {
    setExportOptions(prev => ({ ...prev, scope }));
  };

  // Handle export
  const handleExport = async () => {
    if (!canExport) {
      alert('You do not have permission to export data.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare export data
      const exportData = {
        incidents: data.incidents || [],
        attendance: data.attendance || [],
        performance: data.performance || [],
        predictions: data.predictions || [],
        comparison: data.comparison || [],
        metadata: {
          eventId,
          eventName,
          exportDate: new Date().toISOString(),
          dateRange: dateRange ? `${dateRange.from} to ${dateRange.to}` : 'All time',
          filters: data.filters || {}
        }
      };

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${eventName}-analytics-${timestamp}`;

      const result = await exportAnalyticsData(exportData, {
        ...exportOptions,
        filename
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      // Add to export history
      ExportHistory.addToHistory(result);

      // Notify parent component
      if (onExportComplete) {
        onExportComplete(result);
      }

      // Show success/error message
      if (result.success) {
        alert(`Export completed successfully! File: ${result.filename}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (!canExport) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>

      {/* Export Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics</h3>

            {/* Export Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(exportPermissions).map(([format, allowed]) => (
                  <button
                    key={format}
                    onClick={() => handleFormatChange(format as ExportFormat)}
                    disabled={!allowed}
                    className={`p-2 text-sm font-medium rounded-md border transition-colors ${
                      exportOptions.format === format
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : allowed
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {format.toUpperCase()}
                    {!allowed && <span className="text-xs block">Not available</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Scope Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Scope
              </label>
              <select
                value={exportOptions.scope}
                onChange={(e) => handleScopeChange(e.target.value as ExportScope)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="current">Current View Only</option>
                <option value="all">All Data (Including Filtered)</option>
                <option value="comparison">Comparison Data (If Available)</option>
                <option value="summary">Executive Summary</option>
              </select>
            </div>

            {/* Export Options */}
            <div className="mb-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Export Options
              </label>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-charts"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include-charts" className="ml-2 text-sm text-gray-700">
                  Include charts and graphs
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-branding"
                  checked={exportOptions.includeBranding}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeBranding: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include-branding" className="ml-2 text-sm text-gray-700">
                  Include company branding
                </label>
              </div>
            </div>

            {/* Custom Filename */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename (Optional)
              </label>
              <input
                type="text"
                placeholder={`${eventName}-analytics-${new Date().toISOString().split('T')[0]}`}
                onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* Export History Link */}
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  const history = ExportHistory.getHistory();
                  if (history.length > 0) {
                    alert(`Recent exports: ${history.length} files`);
                  } else {
                    alert('No recent exports found');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Export History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
