import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Incident {
  id: number;
  log_number: string;
  incident_type: string;
  occurrence: string;
  action_taken: string;
  status: string | null;
  timestamp: string;
}

interface IncidentDependencySelectorProps {
  eventId: string;
  currentIncidentId?: string;
  selectedDependencies: string[];
  onDependenciesChange: (dependencies: string[]) => void;
  className?: string;
}

export default function IncidentDependencySelector({
  eventId,
  currentIncidentId,
  selectedDependencies,
  onDependenciesChange,
  className = ''
}: IncidentDependencySelectorProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [circularDependencyCache, setCircularDependencyCache] = useState<Record<string, boolean>>({});
  const [dependencyChainCache, setDependencyChainCache] = useState<Record<string, Set<string>>>({});
  const MAX_TRAVERSAL_DEPTH = 10; // Prevent infinite loops

  // Fetch open incidents for the event
  const fetchIncidents = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('incident_logs')
        .select(`
          id,
          log_number,
          incident_type,
          occurrence,
          action_taken,
          status,
          timestamp
        `)
        .eq('event_id', eventId)
        .in('status', ['open', 'in_progress'])
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter out current incident if editing
      const filteredData = currentIncidentId 
        ? (data || []).filter(incident => String(incident.id) !== currentIncidentId)
        : (data || []);

      setIncidents(filteredData);
      setFilteredIncidents(filteredData);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [eventId, currentIncidentId]);

  // Filter incidents based on search and filters
  useEffect(() => {
    let filtered = incidents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.log_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.occurrence.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.action_taken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incident_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(incident => incident.incident_type === filterType);
    }

    // Filter by priority - since priority column doesn't exist yet, we'll skip this filter
    // if (filterPriority !== 'all') {
    //   filtered = filtered.filter(incident => incident.priority === filterPriority);
    // }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, filterType]);

  // Load incidents on mount
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Pre-calculate circular dependencies when incidents change
  useEffect(() => {
    const calculateCircularDependencies = async () => {
      if (!currentIncidentId || incidents.length === 0) return;

      const newCache: Record<string, boolean> = {};
      const newChainCache: Record<string, Set<string>> = {};
      
      for (const incident of incidents) {
        try {
          const { hasCircularDependency, dependencyChain } = await checkCircularDependency(incident.id);
          newCache[incident.id] = hasCircularDependency;
          newChainCache[incident.id] = dependencyChain;
        } catch (error) {
          console.error('Error calculating circular dependency for incident:', incident.id, error);
          newCache[incident.id] = false;
          newChainCache[incident.id] = new Set();
        }
      }
      
      setCircularDependencyCache(newCache);
      setDependencyChainCache(newChainCache);
    };

    calculateCircularDependencies();
  }, [incidents, currentIncidentId]);

  // Handle dependency selection
  const handleDependencyToggle = useCallback(async (incidentId: string) => {
    // Check for circular dependency before adding using cached result
    if (!selectedDependencies.includes(incidentId)) {
      const hasCircularDependency = circularDependencyCache[incidentId] || false;
      if (hasCircularDependency) {
        setError('Cannot add dependency: circular dependency detected');
        return;
      }
    }

    const newDependencies = selectedDependencies.includes(incidentId)
      ? selectedDependencies.filter(id => id !== incidentId)
      : [...selectedDependencies, incidentId];

    onDependenciesChange(newDependencies);
    setError(null);
  }, [selectedDependencies, onDependenciesChange, circularDependencyCache]);

  // Remove dependency
  const removeDependency = useCallback((incidentId: string) => {
    const newDependencies = selectedDependencies.filter(id => id !== incidentId);
    onDependenciesChange(newDependencies);
  }, [selectedDependencies, onDependenciesChange]);

  // Get selected incident details
  const getSelectedIncident = useCallback((incidentId: string): Incident | undefined => {
    return incidents.find(incident => String(incident.id) === incidentId);
  }, [incidents]);

  // Check for circular dependencies with optimized traversal and memoization
  const checkCircularDependency = useCallback(async (incidentId: string): Promise<{ hasCircularDependency: boolean; dependencyChain: Set<string> }> => {
    // If we're not editing an existing incident, no circular dependency possible
    if (!currentIncidentId) return { hasCircularDependency: false, dependencyChain: new Set() };

    const selectedIncident = getSelectedIncident(incidentId);
    if (!selectedIncident) return { hasCircularDependency: false, dependencyChain: new Set() };

    // Simple check: prevent selecting the current incident as a dependency of itself
    if (incidentId === currentIncidentId) return { hasCircularDependency: true, dependencyChain: new Set([incidentId]) };

    // Check cache first
    if (dependencyChainCache[incidentId]) {
      const hasCircular = dependencyChainCache[incidentId].has(currentIncidentId);
      return { hasCircularDependency: hasCircular, dependencyChain: dependencyChainCache[incidentId] };
    }

    // Optimized dependency tree traversal using iterative DFS with early termination
    const visited = new Set<string>();
    const dependencyChain = new Set<string>();
    const stack: Array<{ id: string; depth: number; path: string[] }> = [{ id: incidentId, depth: 0, path: [incidentId] }];

    while (stack.length > 0) {
      const { id: currentId, depth, path } = stack.pop()!;
      
      if (visited.has(currentId)) {
        continue; // Skip if already visited
      }
      
      visited.add(currentId);
      dependencyChain.add(currentId);
      
      // If we find the current incident in the dependency chain, it's a circular dependency
      if (currentId === currentIncidentId) {
        return { hasCircularDependency: true, dependencyChain };
      }
      
      // Limit traversal depth to prevent infinite loops
      if (depth >= MAX_TRAVERSAL_DEPTH) {
        console.warn(`Max traversal depth (${MAX_TRAVERSAL_DEPTH}) reached for incident ${currentId}`);
        continue;
      }
      
      try {
        // Fetch the dependencies of the current incident
        const { data: incidentData, error } = await supabase
          .from('incident_logs')
          .select('dependencies')
          .eq('id', currentId)
          .single() as { data: { dependencies?: string[] } | null, error: any };
        
        if (error) {
          console.warn('Error fetching incident dependencies:', error);
          continue;
        }
        
        // Add dependencies to the stack for further traversal
        if (incidentData?.dependencies && Array.isArray(incidentData.dependencies)) {
          for (const depId of incidentData.dependencies) {
            // Early termination: if we find the current incident in the path, it's circular
            if (depId === currentIncidentId) {
              return { hasCircularDependency: true, dependencyChain: new Set([...path, depId]) };
            }
            
            // Only add if not visited and not in current path (prevents cycles)
            if (!visited.has(depId) && !path.includes(depId)) {
              stack.push({ 
                id: depId, 
                depth: depth + 1, 
                path: [...path, depId] 
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking dependencies for incident:', currentId, error);
        continue;
      }
    }
    
    return { hasCircularDependency: false, dependencyChain };
  }, [getSelectedIncident, currentIncidentId, dependencyChainCache]);

  // Get incident type options
  const getIncidentTypes = useCallback(() => {
    const types = new Set(incidents.map(incident => incident.incident_type));
    return Array.from(types).sort();
  }, [incidents]);



  // Get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);



  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Incident Dependencies
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select incidents that this incident depends on. Dependencies help track relationships between incidents.
        </p>
      </div>

      {/* Selected Dependencies */}
      {selectedDependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Dependencies</h4>
          <div className="flex flex-wrap gap-2">
            {selectedDependencies.map(incidentId => {
              const incident = getSelectedIncident(incidentId);
              if (!incident) return null;

              return (
                <div
                  key={incidentId}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <span className="text-sm font-medium text-blue-900">
                    #{incident.log_number}
                  </span>
                  <span className="text-xs text-blue-700">
                    {incident.incident_type}
                  </span>
                  <button
                    onClick={() => removeDependency(incidentId)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dependency Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="block truncate">
            {selectedDependencies.length > 0
              ? `${selectedDependencies.length} dependency${selectedDependencies.length !== 1 ? 's' : ''} selected`
              : 'Select dependencies...'
            }
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Search and Filters */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex space-x-2 mt-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {getIncidentTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                

              </div>
            </div>

            {/* Incident List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading incidents...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  {error}
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No incidents found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredIncidents.map(incident => {
                    const isSelected = selectedDependencies.includes(String(incident.id));
                    const hasCircularDependency = circularDependencyCache[incident.id] || false;

                    return (
                      <div
                        key={incident.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        } ${hasCircularDependency ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={async () => !hasCircularDependency && await handleDependencyToggle(String(incident.id))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={async () => !hasCircularDependency && await handleDependencyToggle(String(incident.id))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  #{incident.log_number}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                                  {incident.status}
                                </span>
                                {/* Priority display removed since priority column doesn't exist yet */}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {incident.incident_type} • {new Date(incident.timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 truncate">
                                {incident.occurrence}
                              </div>
                            </div>
                          </div>
                        </div>
                        {hasCircularDependency && (
                          <div className="text-xs text-red-500 mt-1">
                            ⚠️ Circular dependency detected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p>• Dependencies help track which incidents must be resolved before this one</p>
        <p>• Circular dependencies are automatically prevented</p>
        <p>• Only open and in-progress incidents can be selected as dependencies</p>
      </div>
    </div>
  );
}
