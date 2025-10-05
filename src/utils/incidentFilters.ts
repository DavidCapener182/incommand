import type { Priority } from './incidentStyles'
import { normalizePriority } from './incidentStyles'

export interface FilterState {
  types: string[];
  statuses: string[];
  priorities: string[];
  query?: string;
}

export interface FilterOptions {
  types: string[];
  statuses: string[];
  priorities: string[];
}

export type AnyIncident = Record<string, any>;

export function getUniqueIncidentTypes(incidents: AnyIncident[]): string[] {
  const set = new Set<string>();
  incidents.forEach(i => { if (i?.incident_type) set.add(i.incident_type); });
  return Array.from(set).sort();
}

export function getUniqueStatuses(incidents: AnyIncident[]): string[] {
  const set = new Set<string>();
  incidents.forEach(i => { if (i?.status) set.add(i.status); });
  // Normalize common statuses
  return Array.from(set).sort();
}

export function getUniquePriorities(incidents: AnyIncident[]): string[] {
  const set = new Set<string>();
  incidents.forEach(i => { if (i?.priority) set.add(String(i.priority)); });
  return Array.from(set).sort();
}

export function matchesQuery(incident: AnyIncident, query?: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    incident.incident_type,
    incident.occurrence,
    incident.action_taken,
    incident.callsign_from,
    incident.callsign_to,
    incident.log_number,
    incident.status,
    incident.priority,
  ]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function filterIncidents<T extends AnyIncident>(incidents: T[], filters: FilterState): T[] {
  const { types, statuses, priorities, query } = filters;
  return incidents.filter((incident) => {
    // Multi-select filters: if arrays are empty, treat as no filter for that field
    const typeOk = types.length === 0 || types.includes(incident.incident_type);
    const statusOk = statuses.length === 0 || statuses.includes(incident.status || (incident.is_closed ? 'closed' : 'open'));
    const normalizedFilters = priorities
      .map((priority) => normalizePriority(priority as Priority))
      .filter((priority) => priority !== 'unknown');

    const incidentPriorityRaw = String(incident.priority ?? '');
    const incidentPriorityNormalized = normalizePriority(incident.priority);

    const rawMatch = priorities.some(
      (priority) => String(priority ?? '').toLowerCase() === incidentPriorityRaw.toLowerCase()
    );

    const normalizedMatch = normalizedFilters.length === 0
      ? false
      : normalizedFilters.includes(incidentPriorityNormalized);

    const priorityOk = priorities.length === 0 || rawMatch || normalizedMatch;
    const queryOk = matchesQuery(incident, query);
    return typeOk && statusOk && priorityOk && queryOk;
  });
}
