import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/Toast';
import EscalationTimer from './EscalationTimer';

// Staff member interface for drag and drop
interface StaffMember {
  id: string;
  name: string;
  availability_status: string;
  active_assignments: number;
  skill_tags: string[];
}

// Import the style function from IncidentTable
const getIncidentTypeStyle = (type: string) => {
  switch(type) {
    case 'Ejection':
      return 'bg-red-100 text-red-800'
    case 'Refusal':
      return 'bg-yellow-100 text-yellow-800'
    case 'Code Green':
      return 'bg-green-100 text-green-800'
    case 'Code Purple':
      return 'bg-purple-100 text-purple-800'
    case 'Code White':
      return 'bg-gray-100 text-gray-800'
    case 'Code Black':
      return 'bg-black text-white'
    case 'Code Pink':
      return 'bg-pink-100 text-pink-800'
    case 'Attendance':
      return 'bg-gray-100 text-gray-800'
    case 'Aggressive Behaviour':
      return 'bg-orange-100 text-orange-800'
    case 'Queue Build-Up':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Define the Incident interface to match IncidentTable
interface Incident {
  id: number;
  log_number: string;
  timestamp: string;
  callsign_from: string;
  callsign_to: string;
  occurrence: string;
  incident_type: string;
  action_taken: string;
  is_closed: boolean;
  event_id: string;
  status: string;
  priority?: string;
  escalation_level?: number;
  escalate_at?: string;
  escalated?: boolean;
  assigned_staff_ids?: string[];
  auto_assigned?: boolean;
  dependencies?: string[];
}

interface CollaborationBoardProps {
  eventId: string;
  currentUser: any;
  onIncidentSelect?: (incident: Incident) => void;
  searchQuery?: string;
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  availableStaff?: StaffMember[];
  onStaffAssignment?: (incidentId: string, staffIds: string[]) => Promise<void>;
}

const STATUS_COLUMNS = [
  { id: 'open', title: 'Open', color: 'bg-red-100 border-red-300' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'closed', title: 'Closed', color: 'bg-gray-100 border-gray-300' }
];

export const CollaborationBoard: React.FC<CollaborationBoardProps> = ({
  eventId,
  currentUser,
  onIncidentSelect,
  searchQuery = '',
  incidents,
  loading,
  error,
  updateIncident,
  availableStaff = [],
  onStaffAssignment
}) => {
  const [draggedIncident, setDraggedIncident] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [actionText, setActionText] = useState('');
  const [dragOverIncident, setDragOverIncident] = useState<string | null>(null);
  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const { addToast } = useToast();

  const getIncidentsByStatus = useCallback((status: string) => {
    // Exclude attendance logs and sit reps from board view
    let filteredIncidents = incidents.filter(incident => {
      if (incident.incident_type === 'Attendance' || incident.incident_type === 'Sit Rep') {
        return false;
      }
      
      // Simplified status logic
      switch (status) {
        case 'open':
          return !incident.is_closed && (!incident.status || incident.status === 'open');
        case 'in_progress':
          return !incident.is_closed && incident.status === 'in_progress';
        case 'closed':
          return incident.is_closed || incident.status === 'closed';
        default:
          return false;
      }
    });
    
    // Apply search filter if searchQuery is provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredIncidents = filteredIncidents.filter(incident =>
        incident.incident_type.toLowerCase().includes(query) ||
        incident.callsign_from.toLowerCase().includes(query) ||
        incident.callsign_to.toLowerCase().includes(query) ||
        incident.occurrence.toLowerCase().includes(query) ||
        incident.action_taken.toLowerCase().includes(query) ||
        incident.log_number.toLowerCase().includes(query)
      );
    }
    
    return filteredIncidents;
  }, [incidents, searchQuery]);

  const handleDragStart = (result: DropResult) => {
    setDraggedIncident(result.draggableId);
  };

  const handleDragEnd = async (result: DropResult) => {
    setDraggedIncident(null);
    
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Find the incident being moved
    const incident = incidents.find(inc => inc.id.toString() === draggableId);
    if (!incident) {
      addToast({
        type: 'error',
        title: 'Invalid Incident',
        message: 'Incident not found'
      });
      return;
    }

    // Validate status transitions
    const isValidTransition = () => {
      // Prevent moving closed incidents back to open/in-progress
      if (incident.is_closed && newStatus !== 'closed') {
        return false;
      }
      
      // Prevent moving from closed to any other status
      if (oldStatus === 'closed' && newStatus !== 'closed') {
        return false;
      }
      
      // Allow all other transitions
      return true;
    };

    if (!isValidTransition()) {
      addToast({
        type: 'error',
        title: 'Invalid Move',
        message: 'Cannot move closed incidents back to open status'
      });
      return;
    }

    try {
      // Update both status and is_closed fields
      const updates: any = { status: newStatus };
      if (newStatus === 'closed') {
        updates.is_closed = true;
      } else {
        updates.is_closed = false;
      }
      
      await updateIncident(draggableId, updates);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Incident status updated successfully'
      });
    } catch (error) {
      console.error('Error updating incident:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to update incident status';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'Permission denied. You may not have access to update this incident.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }
      
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleEditAction = (incident: Incident) => {
    setEditingAction(incident.id);
    setActionText(incident.action_taken || '');
  };

  const handleSaveAction = async (incident: Incident) => {
    try {
      await updateIncident(incident.id.toString(), { action_taken: actionText });
      setEditingAction(null);
      setActionText('');
      addToast({
        type: 'success',
        title: 'Action Updated',
        message: 'Action taken has been updated successfully'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update action taken'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingAction(null);
    setActionText('');
  };

  const handleMoveToNext = async (incident: Incident) => {
    try {
      let newStatus = 'open';
      
      // Determine next status based on current status
      if (incident.status === 'open' || !incident.status) {
        newStatus = 'in_progress';
      } else if (incident.status === 'in_progress') {
        newStatus = 'closed';
      }
      
      const updates: any = { status: newStatus };
      if (newStatus === 'closed') {
        updates.is_closed = true;
      } else {
        updates.is_closed = false;
      }
      
      await updateIncident(incident.id.toString(), updates);
      
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Incident moved to ${newStatus.replace('_', ' ')}`
      });
    } catch (error) {
      console.error('Error moving incident:', error);
      addToast({
        type: 'error',
        title: 'Move Failed',
        message: 'Failed to move incident to next status'
      });
    }
  };

  // Drag and drop handlers for staff assignment
  const handleStaffDragStart = useCallback((e: React.DragEvent, staffId: string) => {
    e.dataTransfer.setData('staffId', staffId);
  }, []);

  const handleStaffDragOver = useCallback((e: React.DragEvent, incidentId: string) => {
    e.preventDefault();
    setDragOverIncident(incidentId);
  }, []);

  const handleStaffDragLeave = useCallback(() => {
    setDragOverIncident(null);
  }, []);

  const handleStaffDrop = useCallback(async (e: React.DragEvent, incidentId: string) => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('staffId');
    
    if (staffId && onStaffAssignment) {
      try {
        await onStaffAssignment(incidentId, [staffId]);
        addToast({
          type: 'success',
          title: 'Staff Assigned',
          message: 'Staff member assigned successfully'
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Assignment Failed',
          message: 'Failed to assign staff member'
        });
      }
    }
    
    setDragOverIncident(null);
  }, [onStaffAssignment, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading incidents: {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with staff panel toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500">
          Total incidents: {incidents.length} | 
          Open: {getIncidentsByStatus('open').length} | 
          In Progress: {getIncidentsByStatus('in_progress').length} | 
          Closed: {getIncidentsByStatus('closed').length}
        </div>
        {availableStaff.length > 0 && (
          <button
            onClick={() => setShowStaffPanel(!showStaffPanel)}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            {showStaffPanel ? 'Hide' : 'Show'} Staff Panel
          </button>
        )}
      </div>
              <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={`grid gap-4 flex-1 ${showStaffPanel ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`} style={{ minHeight: '400px' }}>
            {/* Staff Panel */}
            {showStaffPanel && (
              <div className="flex flex-col h-full">
                <div className="p-3 rounded-t-lg border bg-blue-100 border-blue-300">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Available Staff</h3>
                    <span className="bg-white bg-opacity-50 rounded-full px-2 py-1 text-xs font-medium">
                      {availableStaff.filter(s => s.availability_status === 'available').length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-2 bg-gray-50 rounded-b-lg border-t-0 border border-gray-200 overflow-y-auto">
                  <div className="space-y-2">
                    {availableStaff.filter(s => s.availability_status === 'available').map((staff) => (
                      <div
                        key={staff.id}
                        draggable
                        onDragStart={(e) => handleStaffDragStart(e, staff.id)}
                        className="p-2 bg-white rounded border border-gray-200 cursor-grab hover:border-blue-300 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        <div className="text-xs text-gray-500">
                          {staff.active_assignments} assignments • {staff.skill_tags?.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          {STATUS_COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col h-full">
              {/* Column Header */}
              <div className={`p-3 rounded-t-lg border ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{column.title}</h3>
                  <span className="bg-white bg-opacity-50 rounded-full px-2 py-1 text-xs font-medium">
                    {getIncidentsByStatus(column.id).length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 bg-gray-50 rounded-b-lg border-t-0 border ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    } overflow-y-auto`}
                    style={{ maxHeight: '400px' }}
                  >
                    <AnimatePresence>
                      {getIncidentsByStatus(column.id).map((incident, index) => (
                        <Draggable
                          key={incident.id}
                          draggableId={incident.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                              className={`mb-3 ${
                                snapshot.isDragging ? 'rotate-2 shadow-xl' : ''
                              }`}
                            >
                              <div
                                className={`bg-white rounded-lg shadow-sm border p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                  !incident.is_closed && ['Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour', 'Medical'].includes(incident.incident_type) ? 'border-l-4 border-l-red-500' : ''
                                } ${snapshot.isDragging ? 'shadow-xl rotate-2' : ''}`}
                                onClick={() => onIncidentSelect?.(incident)}
                                style={{
                                  ...(snapshot.isDragging && {
                                    transform: 'rotate(5deg) scale(1.05)',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                  })
                                }}
                              >
                                {/* Incident Header */}
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      Log #{incident.log_number}
                                    </span>
                                    {!incident.is_closed && ['Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour', 'Medical'].includes(incident.incident_type) && (
                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(incident.timestamp)}
                                  </span>
                                </div>

                                {/* Incident Type */}
                                <div className="mb-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getIncidentTypeStyle(incident.incident_type)}`}>
                                    {incident.incident_type}
                                  </span>
                                </div>

                                {/* Occurrence */}
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {incident.occurrence}
                                </p>

                                {/* Callsigns */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    From: {incident.callsign_from}
                                  </span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    To: {incident.callsign_to}
                                  </span>
                                </div>

                                {/* Action Taken */}
                                <div className="text-xs text-gray-500">
                                  {editingAction === incident.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={actionText}
                                        onChange={(e) => setActionText(e.target.value)}
                                        placeholder="Enter action taken..."
                                        className="w-full p-2 text-xs border rounded resize-none"
                                        rows={2}
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleSaveAction(incident)}
                                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <span className="line-clamp-1">
                                        {incident.action_taken ? `Action: ${incident.action_taken}` : 'No action taken'}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditAction(incident);
                                        }}
                                        className="ml-2 px-1 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Assignment and Escalation Info */}
                                {(incident.assigned_staff_ids?.length > 0 || incident.escalate_at) && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    {/* Staff Assignment */}
                                    {incident.assigned_staff_ids && incident.assigned_staff_ids.length > 0 && (
                                      <div className="mb-2">
                                        <div className="flex items-center gap-1 mb-1">
                                          <span className="text-xs text-gray-500">Assigned Staff:</span>
                                          {incident.auto_assigned && (
                                            <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Auto</span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {incident.assigned_staff_ids.slice(0, 2).map((staffId, index) => (
                                            <span key={index} className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                              Staff {index + 1}
                                            </span>
                                          ))}
                                          {incident.assigned_staff_ids.length > 2 && (
                                            <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                              +{incident.assigned_staff_ids.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Escalation Timer */}
                                    {incident.escalate_at && !incident.is_closed && (
                                      <div className="mb-2">
                                        <EscalationTimer
                                          incidentId={incident.id.toString()}
                                          escalationLevel={incident.escalation_level || 0}
                                          escalateAt={incident.escalate_at}
                                          escalated={incident.escalated || false}
                                          incidentType={incident.incident_type}
                                          priority={incident.priority || 'medium'}
                                          className="text-xs"
                                        />
                                      </div>
                                    )}

                                    {/* Escalation Status Indicator */}
                                    {incident.escalate_at && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <span className="text-xs text-gray-500">Escalation:</span>
                                        {incident.escalated ? (
                                          <span className="text-xs bg-red-100 text-red-700 px-1 rounded">Escalated</span>
                                        ) : (
                                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">Active</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Dependencies */}
                                    {incident.dependencies && incident.dependencies.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs text-gray-500">Dependencies: </span>
                                        <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                                          {incident.dependencies.length} incident(s)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Drag to move</span>
                                    <div className="flex gap-1">
                                      {!incident.is_closed && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveToNext(incident);
                                          }}
                                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                        >
                                          Move to Next
                                        </button>
                                      )}
                                      {incident.is_closed && (
                                        <span className="text-green-600">✓ Closed</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
