import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/Toast';
import { useIncidents, Incident } from '@/hooks/useIncidents';

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

interface CollaborationBoardProps {
  eventId: string;
  currentUser: any;
  onIncidentSelect?: (incident: Incident) => void;
  searchQuery?: string;
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
  searchQuery = ''
}) => {
  const [draggedIncident, setDraggedIncident] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [actionText, setActionText] = useState('');
  const { addToast } = useToast();
  
  // Use the useIncidents hook internally
  const { incidents, loading, error, updateIncident } = useIncidents(eventId);

  const getIncidentsByStatus = useCallback((status: string) => {
    // Map incidents to board status based on is_closed and existing status
    let filteredIncidents = incidents.filter(incident => {
      // Exclude attendance logs and sit reps from board view
      if (incident.incident_type === 'Attendance' || incident.incident_type === 'Sit Rep') {
        return false;
      }
      
      // For closed status, show all closed incidents (except attendance and sit reps)
      if (status === 'closed') {
        return incident.is_closed === true;
      }
      
      // For open and in_progress, only show non-closed incidents
      if (incident.is_closed === true) {
        return false;
      }
      
      // If incident has a status field that matches our board columns, use it
      if (incident.status && ['open', 'in_progress'].includes(incident.status)) {
        return incident.status === status;
      }
      
      // Default mapping for incidents without explicit status
      if (status === 'open') {
        return !incident.status || incident.status === 'open';
      } else if (status === 'in_progress') {
        return incident.status === 'in_progress';
      }
      
      return false;
    });
    
    console.log(`Board ${status} column:`, filteredIncidents.length, 'incidents');
    console.log(`All incidents for debugging:`, incidents.map(inc => ({ 
      log_number: inc.log_number, 
      is_closed: inc.is_closed, 
      status: inc.status,
      incident_type: inc.incident_type
    })));
    
    if (status === 'open') {
      console.log('Open incidents:', filteredIncidents.map(inc => ({ 
        log_number: inc.log_number, 
        is_closed: inc.is_closed, 
        status: inc.status 
      })));
    }
    
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

  const handleDragStart = (result: any) => {
    console.log('Drag start:', result);
    setDraggedIncident(result.draggableId);
  };

  const handleDragEnd = async (result: DropResult) => {
    console.log('Drag end:', result);
    setDraggedIncident(null);
    
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    console.log('Updating incident:', draggableId, 'to status:', newStatus);

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
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update incident status'
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
      console.log('Move to Next clicked for incident:', incident);
      console.log('Current status:', incident.status);
      console.log('Current is_closed:', incident.is_closed);
      
      let newStatus = 'open';
      
      // Determine next status based on current status
      if (incident.status === 'open' || !incident.status) {
        newStatus = 'in_progress';
      } else if (incident.status === 'in_progress') {
        newStatus = 'closed';
      }
      
      console.log('New status will be:', newStatus);
      
      const updates: any = { status: newStatus };
      if (newStatus === 'closed') {
        updates.is_closed = true;
      } else {
        updates.is_closed = false;
      }
      
      console.log('Updates to apply:', updates);
      
      await updateIncident(incident.id.toString(), updates);
      console.log('Update completed successfully');
      
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
      {/* Debug info */}
      <div className="mb-2 text-xs text-gray-500">
        Total incidents: {incidents.length} | 
        Open: {getIncidentsByStatus('open').length} | 
        In Progress: {getIncidentsByStatus('in_progress').length} | 
        Closed: {getIncidentsByStatus('closed').length}
      </div>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1" style={{ minHeight: '400px' }}>
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
                    style={{ maxHeight: '600px' }}
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
                              onDragStart={undefined}
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
