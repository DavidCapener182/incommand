import React, { useState, useCallback, useEffect } from 'react';
import { 
  useStaffAvailability, 
  type StaffSuggestion 
} from '../hooks/useStaffAvailability';
import { 
  type StaffMember,
  type AssignmentScore 
} from '../lib/incidentAssignment';

interface StaffDeploymentCardProps {
  eventId: string;
  onAssignStaff?: (incidentId: string, staffIds: string[]) => void;
  onViewIncident?: (incidentId: string) => void;
}

export default function StaffDeploymentCard({ 
  eventId, 
  onAssignStaff, 
  onViewIncident 
}: StaffDeploymentCardProps) {
  const {
    availableStaff,
    loading,
    error,
    stats,
    suggestions,
    addSuggestion,
    removeSuggestion,
    clearSuggestions,
    getWorkloadDistribution,
    getSkillCoverage,
    isStaffAvailable
  } = useStaffAvailability(eventId);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [showSkillGaps, setShowSkillGaps] = useState(false);
  const [dragOverIncident, setDragOverIncident] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 staff members per page

  // Get filtered staff based on selection
  const getFilteredStaff = useCallback(() => {
    switch (selectedFilter) {
      case 'available':
        return availableStaff.filter(staff => staff.availability_status === 'available');
      case 'busy':
        return availableStaff.filter(staff => staff.availability_status === 'busy');
      case 'offline':
        return availableStaff.filter(staff => staff.availability_status === 'offline');
      default:
        return availableStaff;
    }
  }, [availableStaff, selectedFilter]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  // Get paginated staff
  const getPaginatedStaff = useCallback(() => {
    const filtered = getFilteredStaff();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [getFilteredStaff, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(getFilteredStaff().length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Get workload distribution
  const workloadDistribution = getWorkloadDistribution();
  const skillCoverage = getSkillCoverage();

  // Handle staff assignment using API endpoints
  const handleAssignStaff = useCallback(async (incidentId: string, staffIds: string[]) => {
    try {
      const response = await fetch('/api/staff-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentId,
          staffIds,
          assignmentType: 'manual',
          eventId,
          notes: `Manually assigned ${staffIds.length} staff member(s) via deployment card`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign staff');
      }

      const result = await response.json();
      
      // Call the callback if provided
      if (onAssignStaff) {
        onAssignStaff(incidentId, staffIds);
      }

      return result;
    } catch (error) {
      console.error('Error assigning staff:', error);
      throw error;
    }
  }, [onAssignStaff, eventId]);

  // Handle drag and drop for staff assignment
  const handleDragStart = useCallback((e: React.DragEvent, staffId: string) => {
    e.dataTransfer.setData('staffId', staffId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, incidentId: string) => {
    e.preventDefault();
    setDragOverIncident(incidentId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIncident(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, incidentId: string) => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('staffId');
    
    if (staffId && isStaffAvailable(staffId)) {
      handleAssignStaff(incidentId, [staffId]);
    }
    
    setDragOverIncident(null);
  }, [handleAssignStaff, isStaffAvailable]);

  // Get status color for staff
  const getStatusColor = (status: string, assignments: number) => {
    if (status === 'offline') return 'text-gray-500';
    if (status === 'busy') return 'text-orange-500';
    if (assignments >= 3) return 'text-red-500';
    if (assignments >= 1) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get status icon for staff
  const getStatusIcon = (status: string, assignments: number) => {
    if (status === 'offline') return '🔴';
    if (status === 'busy') return '🟠';
    if (assignments >= 3) return '🔴';
    if (assignments >= 1) return '🟡';
    return '🟢';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Show setup message if there's an error or no staff data (likely tables don't exist)
  if (error || (availableStaff.length === 0 && !loading)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Staff Deployment Setup Required
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error 
              ? `Database setup required: ${error}`
              : 'The staff deployment system requires database tables to be set up.'
            }
            Please contact your system administrator to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Staff Deployment</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSkillGaps(!showSkillGaps)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showSkillGaps ? 'Hide' : 'Show'} Skill Gaps
          </button>
          <button
            onClick={clearSuggestions}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Suggestions
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalStaff}</div>
          <div className="text-xs text-gray-500">Total Staff</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.availableStaff}</div>
          <div className="text-xs text-gray-500">Available</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.assignedStaff}</div>
          <div className="text-xs text-gray-500">Assigned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.averageWorkload.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Avg Workload</div>
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Workload Distribution</h4>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(workloadDistribution).map(([key, count]) => (
            <div key={key} className="text-center">
              <div className="text-lg font-semibold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500">{key}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Gaps Alert */}
      {showSkillGaps && skillCoverage.understaffedSkills.length > 0 && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Skill Gaps Detected</h4>
          <div className="flex flex-wrap gap-2">
            {skillCoverage.understaffedSkills.map(skill => (
              <span
                key={skill}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-4">
        {(['all', 'available', 'busy', 'offline'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-3 py-1 text-xs rounded-full capitalize ${
              selectedFilter === filter
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Staff List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {getPaginatedStaff().map(staff => (
          <div
            key={staff.id}
            draggable={isStaffAvailable(staff.id)}
            onDragStart={(e) => handleDragStart(e, staff.id)}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isStaffAvailable(staff.id)
                ? 'bg-white border-gray-200 hover:border-blue-300 cursor-grab'
                : 'bg-gray-50 border-gray-200 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getStatusIcon(staff.availability_status, staff.active_assignments)}</span>
              <div>
                <div className="font-medium text-gray-900">
                  {staff.full_name}
                  {/* Callsign would be available if we had that data */}
                </div>
                <div className="text-sm text-gray-500">
                  {staff.active_assignments} assignments • {staff.skill_tags?.slice(0, 2).join(', ')}
                </div>
                {staff.skill_tags && staff.skill_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {staff.skill_tags.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {staff.skill_tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{staff.skill_tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={`text-sm font-medium ${getStatusColor(staff.availability_status, staff.active_assignments)}`}>
              {staff.availability_status}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Assignment Suggestions</h4>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-900">
                    {suggestion.incidentType} - {suggestion.priority} Priority
                  </div>
                  <button
                    onClick={() => removeSuggestion(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  {suggestion.suggestions.slice(0, 3).map((suggestionItem, suggestionIndex) => {
                    const staff = availableStaff.find(s => s.id === suggestionItem.staff_id);
                    if (!staff) return null;

                    return (
                      <div
                        key={suggestionItem.staff_id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                        onDragOver={(e) => handleDragOver(e, suggestion.incidentId || '')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, suggestion.incidentId || '')}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{staff.full_name}</span>
                          <span className="text-xs text-gray-500">
                            Score: {(suggestionItem.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleAssignStaff(suggestion.incidentId || '', [staff.id])}
                          disabled={!isStaffAvailable(staff.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            isStaffAvailable(staff.id)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Assign
                        </button>
                      </div>
                    );
                  })}
                </div>
                {suggestion.incidentId && onViewIncident && (
                  <button
                    onClick={() => onViewIncident(suggestion.incidentId!)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Incident Details
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredStaff().length)} of {getFilteredStaff().length} staff
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!hasPrevPage}
              className={`px-3 py-1 text-sm rounded ${
                hasPrevPage
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={!hasNextPage}
              className={`px-3 py-1 text-sm rounded ${
                hasNextPage
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {getFilteredStaff().length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <p>No staff found for the selected filter</p>
        </div>
      )}
    </div>
  );
}
