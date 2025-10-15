import type { NormalizedPriority, Priority } from './incidentStyles'
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

// Mapping for common search terms to incident types
const SEARCH_TERM_MAPPING: Record<string, string[]> = {
  'ejection': ['Ejection', 'eject', 'ejected', 'ejections'],
  'medical': ['Medical', 'medical', 'medic', 'ambulance'],
  'refusal': ['Refusal', 'refuse', 'refused', 'refusals'],
  'theft': ['Theft', 'theft', 'steal', 'stolen', 'thefts'],
  'fight': ['Fight', 'fight', 'fighting', 'violence', 'assault'],
  'fire': ['Fire', 'fire', 'flame', 'smoke', 'fire alarm'],
  'weapon': ['Weapon Related', 'weapon', 'gun', 'knife', 'armed'],
  'missing': ['Missing Child/Person', 'missing', 'lost child', 'lost person'],
  'crowd': ['Crowd Management', 'crowd', 'surge', 'crush', 'queue'],
  'technical': ['Tech Issue', 'technical', 'equipment', 'audio', 'visual'],
  'welfare': ['Welfare', 'welfare', 'distressed', 'unwell'],
  'alcohol': ['Alcohol / Drug Related', 'alcohol', 'drunk', 'intoxicated', 'drugs'],
  'suspicious': ['Suspicious Behaviour', 'suspicious', 'unusual', 'loitering'],
  'environmental': ['Environmental', 'environmental', 'spill', 'weather'],
  'lost property': ['Lost Property', 'lost property', 'found item', 'missing item'],
  'evacuation': ['Evacuation', 'evacuation', 'evacuate', 'clear area'],
  'sexual': ['Sexual Misconduct', 'sexual', 'assault', 'harassment'],
  'terror': ['Counter-Terror Alert', 'terror', 'terrorism', 'threat'],
  'show stop': ['Emergency Show Stop', 'show stop', 'emergency stop', 'halt show'],
}

export function matchesQuery(incident: AnyIncident, query?: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  
  // Check if query matches any mapped terms
  const searchTerms = Object.keys(SEARCH_TERM_MAPPING);
  const matchedTerms = searchTerms.filter(term => q.includes(term));
  
  // If we found mapped terms, check if incident type matches any of them
  if (matchedTerms.length > 0) {
    for (const term of matchedTerms) {
      const mappedTypes = SEARCH_TERM_MAPPING[term];
      if (mappedTypes.some(type => incident.incident_type === type)) {
        return true;
      }
    }
  }
  
  // Fallback to original search logic
  const normalizedQuery = q.replace(/s$/, ''); // Remove trailing 's' for plural forms
  
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
    .some((v) => {
      const value = String(v).toLowerCase();
      // Check both original query and normalized query (without 's')
      return value.includes(q) || value.includes(normalizedQuery);
    });
}

export function filterIncidents<T extends AnyIncident>(incidents: T[], filters: FilterState): T[] {
  const { types, statuses, priorities, query } = filters;
  return incidents.filter((incident) => {
    // Multi-select filters: if arrays are empty, treat as no filter for that field
    const typeOk = types.length === 0 || types.includes(incident.incident_type);
    const statusOk = statuses.length === 0 || statuses.includes(incident.status || (incident.is_closed ? 'closed' : 'open'));
    const normalizedFilters = priorities
      .map((priority) => normalizePriority(priority as Priority))
      .filter(
        (priority): priority is Exclude<NormalizedPriority, 'unknown'> => priority !== 'unknown'
      );

    const incidentPriorityRaw = String(incident.priority ?? '');
    const incidentPriorityNormalized = normalizePriority(incident.priority);

    const rawMatch = priorities.some(
      (priority) => String(priority ?? '').toLowerCase() === incidentPriorityRaw.toLowerCase()
    );

    const normalizedMatch = normalizedFilters.length === 0
      ? false
      : incidentPriorityNormalized !== 'unknown' && normalizedFilters.includes(incidentPriorityNormalized);

    const priorityOk = priorities.length === 0 || rawMatch || normalizedMatch;
    const queryOk = matchesQuery(incident, query);
    return typeOk && statusOk && priorityOk && queryOk;
  });
}
