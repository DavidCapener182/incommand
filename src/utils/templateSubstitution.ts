/**
 * Template substitution utility for guided actions generation
 * Replaces {{placeholder}} syntax with actual values from context
 */

export interface SubstitutionContext {
  location?: string;
  callsign?: string;
  responders?: string;
  persons?: string;
  time?: string;
  priority?: string;
  reason?: string;
  symptoms?: string;
  // User answer fields
  [key: string]: any;
}

/**
 * Substitute template placeholders with context values
 * @param template - Template string with {{placeholder}} syntax
 * @param context - Object containing values to substitute
 * @returns Processed template string with substituted values
 */
export function substituteTemplate(
  template: string,
  context: SubstitutionContext
): string {
  if (!template) return '';

  let result = template;

  // Replace {{placeholder}} with context values
  Object.keys(context).forEach(key => {
    const value = context[key];
    if (value !== undefined && value !== null && value !== '') {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, String(value));
    }
  });

  // Clean up unreplaced placeholders (remove them)
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  // Clean up extra spaces and punctuation
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\.\s*\./g, '.');
  result = result.replace(/\s+\./g, '.');
  result = result.replace(/\s+,/g, ',');
  
  // Remove sentences that are just empty after placeholder removal
  result = result.replace(/\.\s*\./g, '.');
  
  // Ensure proper capitalization at start
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Ensure ends with proper punctuation
  if (result && !/[.!?]$/.test(result)) {
    result += '.';
  }

  return result;
}

/**
 * Convert boolean answers to human-readable text
 * @param value - Boolean value from user answer
 * @param trueText - Text to use for true value
 * @param falseText - Text to use for false value
 * @returns Human-readable text
 */
export function booleanToText(
  value: boolean | undefined,
  trueText: string,
  falseText: string = ''
): string {
  if (value === true) return trueText;
  if (value === false) return falseText;
  return '';
}

/**
 * Process user answers from guided questions into context-ready format
 * @param answers - Raw user answers from form
 * @param incidentType - Type of incident for context
 * @returns Processed context object
 */
export function processUserAnswers(
  answers: Record<string, any>,
  incidentType: string
): Record<string, string> {
  const processed: Record<string, string> = {};

  Object.entries(answers).forEach(([key, value]) => {
    // Handle boolean values
    if (typeof value === 'boolean') {
      // Convert boolean to status text based on common patterns
      if (key.includes('police')) {
        processed[key.replace('_involved', '_status').replace('_notified', '_status').replace('_informed', '_status')] = 
          value ? 'Police notified' : 'Police not required';
      } else if (key.includes('medical')) {
        processed[key.replace('_required', '_status').replace('_attended', '_status')] = 
          value ? 'Medical attended' : 'No medical required';
      } else if (key.includes('ambulance')) {
        processed[key.replace('_required', '_status')] = 
          value ? 'Ambulance called' : 'No ambulance required';
      } else if (key.includes('transported')) {
        processed['transport_outcome'] = 
          value ? 'Patient transported off-site' : 'Patient remained on-site';
      } else if (key.includes('treatment_refused')) {
        processed['treatment_provided'] = 
          value ? 'Treatment refused by patient' : 'Treatment provided';
      } else if (key.includes('pa_')) {
        processed[key.replace('_made', '_announcement').replace('_issued', '_status')] = 
          value ? 'PA announcement made' : 'No PA announcement';
      } else if (key.includes('found') || key.includes('located')) {
        processed['search_outcome'] = 
          value ? 'Person located' : 'Search ongoing';
      } else if (key.includes('cctv')) {
        processed['cctv_status'] = 
          value ? 'CCTV reviewed' : 'CCTV not available';
      } else if (key.includes('item_recovered')) {
        processed['item_recovery'] = 
          value ? 'Item recovered' : 'Item not recovered';
      } else if (key.includes('false_alarm')) {
        processed['cause_identified'] = 
          value ? 'False alarm confirmed' : 'Genuine activation';
      } else if (key.includes('reentry')) {
        processed[key.replace('_refused', '_status').replace('_allowed', '_status')] = 
          value ? 'Re-entry refused' : 'Re-entry permitted';
      } else if (key.includes('banned')) {
        processed['ban_status'] = 
          value ? 'Individual banned from future events' : 'No ban issued';
      } else if (key.includes('crowd_dispersed')) {
        processed['crowd_dispersed_status'] = 
          value ? 'Crowd successfully dispersed' : 'Crowd management ongoing';
        processed['area_clear_status'] = 
          value ? 'Area clear and stable' : 'Area monitoring continues';
      } else {
        // Generic boolean handling
        processed[key] = value ? 'Yes' : 'No';
      }
    } else if (typeof value === 'string' && value.trim()) {
      // Handle text and select values
      processed[key] = value;
    } else if (typeof value === 'number') {
      // Handle number values
      processed[key] = value.toString();
    } else if (Array.isArray(value) && value.length > 0) {
      // Handle multiselect values (arrays)
      processed[key] = value.join(', ');
    }
  });

  // Special handling for Artist On Stage and Artist Off Stage - always set location to "Stage"
  if (incidentType === 'Artist On Stage' || incidentType === 'Artist Off Stage') {
    processed['location'] = 'Stage';
  }

  // Process specific Artist Off Stage fields
  if (incidentType === 'Artist Off Stage') {
    // Convert crowdsurfers count to descriptive text
    if (answers.crowdsurfers_count) {
      processed['crowdsurfers_managed'] = `${answers.crowdsurfers_count} crowdsurfers managed during exit`;
    }
    
    // Convert medical incidents count to descriptive text
    if (answers.medical_incidents_count) {
      processed['medical_incidents_handled'] = `${answers.medical_incidents_count} minor incidents handled during dispersal`;
    }
  }

  // Process specific Artist On Stage fields
  if (incidentType === 'Artist On Stage') {
    // Convert artist information received to descriptive text
    if (answers.artist_information_received && Array.isArray(answers.artist_information_received)) {
      const infoItems = answers.artist_information_received;
      if (infoItems.length > 0) {
        processed['artist_information_received'] = `Artist information received: ${infoItems.join(', ')}`;
      }
    }
  }

  return processed;
}

