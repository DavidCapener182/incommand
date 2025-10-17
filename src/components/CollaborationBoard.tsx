import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/Toast';
import EscalationTimer from './EscalationTimer';
import { Plus, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Staff member interface for drag and drop
interface StaffMember {
  id: string;
  name: string;
  availability_status: string;
  active_assignments: number;
  skill_tags: string[];
}

import {
  getIncidentTypeStyle,
  getPriorityBorderClass,
  normalizePriority,
  type Priority,
} from '../utils/incidentStyles'
import { FilterState, filterIncidents } from '../utils/incidentFilters'
import PriorityBadge from './PriorityBadge'
import { getIncidentTypeIcon } from '../utils/incidentIcons'

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
  filters?: FilterState;
}

const STATUS_COLUMNS = [
  { id: 'open', title: 'OPEN', color: 'bg-red-50', border: 'border-red-200', headerColor: 'bg-red-100', countColor: 'text-red-600' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'bg-yellow-50', border: 'border-yellow-200', headerColor: 'bg-yellow-100', countColor: 'text-yellow-600' },
  { id: 'closed', title: 'CLOSED', color: 'bg-gray-50', border: 'border-gray-200', headerColor: 'bg-gray-100', countColor: 'text-gray-600' }
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
  onStaffAssignment,
  filters = { types: [], statuses: [], priorities: [], query: '' }
}) => {
  const [draggedIncident, setDraggedIncident] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [actionText, setActionText] = useState('');
  const [dragOverIncident, setDragOverIncident] = useState<string | null>(null);
  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const { addToast } = useToast();
  const [columnOrder, setColumnOrder] = useState<Record<string, number[]>>({});

  // Suppress react-beautiful-dnd defaultProps warning
  useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = (...args) => {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        (args[0].includes('Support for defaultProps will be removed from memo components') ||
         args[0].includes('Connect(Droppable)'))
      ) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        (args[0].includes('Support for defaultProps will be removed from memo components') ||
         args[0].includes('Connect(Droppable)'))
      ) {
        return; // Suppress this specific error
      }
      originalError.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const isHighPriorityAndOpen = useCallback((incident: Incident) => {
    const status = String(incident.status ?? '').toLowerCase()

    if (
      incident.is_closed ||
      status === 'closed' ||
      status === 'resolved' ||
      status === 'in_progress' ||
      status === 'in progress' ||
      incident.incident_type === 'Sit Rep' ||
      incident.incident_type === 'Attendance'
    ) {
      return false
    }

    const normalizedPriority = normalizePriority(incident.priority as Priority)
    const isHighPriority = normalizedPriority === 'high' || normalizedPriority === 'urgent'
    const isOpenStatus = status === 'open' || status === 'logged' || status === ''

    return isHighPriority && isOpenStatus
  }, [])

  const getIncidentsByStatus = useCallback((status: string) => {
    // Exclude attendance logs and sit reps from board view
    let filteredIncidents = incidents.filter(incident => {
      if (incident.incident_type === 'Attendance' || incident.incident_type === 'Sit Rep') {
        return false;
      }

      const normalizedStatus = String(incident.status ?? '').toLowerCase();

      switch (status) {
        case 'open':
          return (
            !incident.is_closed &&
            (normalizedStatus === 'open' || normalizedStatus === 'logged' || normalizedStatus === '')
          );
        case 'in_progress':
          return !incident.is_closed && (normalizedStatus === 'in_progress' || normalizedStatus === 'in progress');
        case 'closed':
          return incident.is_closed || normalizedStatus === 'closed' || normalizedStatus === 'resolved';
        default:
          return false;
      }
    });
    
    // Apply multi-select filters and search
    filteredIncidents = filterIncidents(filteredIncidents, { ...filters, query: searchQuery });

    // Apply local order if exists (do not mutate state here)
    const order = columnOrder[status];
    if (!order) return filteredIncidents;
    const orderIndex: Record<number, number> = {};
    order.forEach((id, idx) => { orderIndex[id] = idx; });
    return [...filteredIncidents].sort((a, b) => (orderIndex[a.id] ?? 0) - (orderIndex[b.id] ?? 0));
  }, [incidents, searchQuery, filters, columnOrder]);

  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Unified motion configuration
  const cardMotion = {
    layout: true,
    whileHover: { y: -2, scale: 1.01, transition: { duration: 0.15 } },
    whileTap: { scale: 0.98 },
    whileDrag: { scale: 1.03, boxShadow: '0 6px 12px rgba(0,0,0,0.15)' },
  };

  const handleDragStart = (e: React.DragEvent, incidentId: string) => {
    setDraggedIncident(incidentId);
    e.dataTransfer.setData('text/plain', incidentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedIncident(null);
    
    const incidentId = e.dataTransfer.getData('text/plain');
    if (!incidentId) return;

    const incident = incidents.find(inc => inc.id.toString() === incidentId);
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
      if (incident.is_closed && targetColumnId !== 'closed') {
        return false;
      }
      
      // Prevent moving from closed to any other status
      if (incident.is_closed && targetColumnId !== 'closed') {
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
      const updates: any = { status: targetColumnId };
      if (targetColumnId === 'closed') {
        updates.is_closed = true;
      } else {
        updates.is_closed = false;
      }
      
      await updateIncident(incidentId, updates);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d2b90]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-4">
        Error loading incidents: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-180px)] overflow-hidden">
      <div className="flex items-center justify-between px-6 mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Incident Board</h2>
        <Badge variant="outline" className="text-sm">Total: {incidents.length}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 overflow-hidden">
        {STATUS_COLUMNS.map(({ id, title, color, border }) => (
          <motion.div
            key={id}
            layout
            className={`relative flex flex-col h-[calc(100vh-220px)] border rounded-xl transition-all duration-200 ${
              dragOverColumn === id
                ? 'ring-2 ring-[#1d2b90]/20 bg-blue-50/10'
                : 'bg-muted/30 border-border/60'
            }`}
            onDragOver={(e) => handleDragOver(e, id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, id)}
          >
            <CardHeader className="flex items-center justify-between bg-card border-b border-border/40 py-3 px-4 rounded-t-xl">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {title}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{getIncidentsByStatus(id).length}</Badge>
            </CardHeader>

            <CardContent className="p-3 flex-1 overflow-hidden">
              <div className="h-full pr-2 overflow-y-auto">
                <div className={`transition-all duration-300 ${
                  dragOverColumn === id 
                    ? 'ring-2 ring-[#1d2b90]/40 bg-blue-50/50 dark:bg-[#1e2a78]/80 shadow-md' 
                    : ''
                }`}>
                  <AnimatePresence>
                    {getIncidentsByStatus(id).length ? (
                      <motion.div layout className="space-y-3">
                        {getIncidentsByStatus(id).map((incident) => (
                          <motion.div
                            key={incident.id}
                            {...cardMotion}
                            draggable="true"
                            onDragStart={(e: any) => {
                              if (e.dataTransfer) {
                                handleDragStart(e, incident.id.toString());
                              }
                            }}
                            onClick={() => onIncidentSelect?.(incident)}
                            className="
                              relative bg-card border border-border/60 rounded-xl
                              shadow-[0_1px_4px_rgba(0,0,0,0.05)]
                              hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)]
                              hover:ring-1 hover:ring-[#1d2b90]/10
                              transition-all p-4 pt-3 cursor-grab active:cursor-grabbing
                            "
                          >
                            {/* Priority Accent Bar */}
                            <div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-xl ${
                              incident.priority?.toLowerCase() === 'urgent'
                                ? 'bg-red-500'
                                : incident.priority?.toLowerCase() === 'high'
                                ? 'bg-orange-400'
                                : incident.priority?.toLowerCase() === 'medium'
                                ? 'bg-yellow-400'
                                : 'bg-green-500'
                            }`} />

                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex flex-col">
                                <span className="font-mono text-sm text-[#1d2b90] dark:text-blue-300 font-semibold">
                                  Log {incident.log_number.includes('-') ? incident.log_number.split('-')[1] : incident.log_number}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  {incident.priority && (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs font-medium capitalize ${
                                        incident.priority.toLowerCase() === 'urgent'
                                          ? 'border-red-400 text-red-600 bg-red-50'
                                          : incident.priority.toLowerCase() === 'high'
                                          ? 'border-orange-400 text-orange-600 bg-orange-50'
                                          : incident.priority.toLowerCase() === 'medium'
                                          ? 'border-yellow-400 text-yellow-600 bg-yellow-50'
                                          : 'border-green-400 text-green-600 bg-green-50'
                                      }`}
                                    >
                                      {incident.priority}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs text-gray-600">
                                    {incident.incident_type}
                                  </Badge>
                                </div>
                              </div>

                              <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap ml-2">
                                {new Date(incident.timestamp).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Occurrence Description */}
                            <p className="text-sm text-foreground mb-3 line-clamp-3 leading-relaxed">
                              {incident.occurrence}
                            </p>

                            {/* Meta - Callsigns */}
                            <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                              <Badge variant="outline" className="bg-blue-50 text-blue-600">
                                From: {incident.callsign_from}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50 text-green-600">
                                To: {incident.callsign_to}
                              </Badge>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground italic">
                              <span>Action: {incident.action_taken || '—'}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[#1d2b90] hover:text-blue-800 dark:text-blue-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onIncidentSelect?.(incident);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                            </div>
                          </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: dragOverColumn === id ? 0.9 : 0.6 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 h-full"
                          >
                            <Plus className="h-6 w-6 mb-2 opacity-50" />
                            <p className="text-sm font-medium">No incidents yet</p>
                            <p className="text-xs">Drag incidents here or create new ones.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            ))}
          </div>
        </div>
      );
};