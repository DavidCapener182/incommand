/**
 * Occurrence templates for incident logging
 * These templates provide standardized, professional language for incident outcomes
 * Users can edit these templates as needed for specific incidents
 */

export const OCCURRENCE_TEMPLATES: Record<string, string> = {
  'Medical': 'Patient assessed and treated on-site. Medical team attended. Patient condition: [stable/unstable]. Further action: [none/ambulance called/transported].',
  'Fight': 'Altercation occurred between parties. Security intervened. Parties separated. Police: [notified/not required]. Ejections: [yes/no].',
  'Ejection': 'Individual removed from venue. Reason: [specify]. Police informed: [yes/no]. Person banned: [yes/no].',
  'Artist On Stage': 'Artist commenced performance at [time]. Stage area secured. No issues reported.',
  'Artist Off Stage': 'Artist completed performance at [time]. Stage cleared. Crowd dispersed safely.',
  'Attendance': 'Current attendance: [number]. Capacity: [percentage]%. No issues reported.',
  'Theft': 'Theft reported at [location]. Item(s): [specify]. Victim details taken. CCTV reviewed. Police: [notified/not notified].',
  'Refusal': 'Entry refused. Reason: [specify]. Individual: [description]. Police required: [yes/no]. Person left site: [yes/no].',
  'Weapon Related': 'Weapon discovered: [type]. Location: [specify]. Item secured. Police notified. Person: [detained/ejected/escaped].',
  'Missing Child/Person': 'Person reported missing. Description: [specify]. Search initiated. Located: [yes/no/ongoing]. Reunited: [yes/no].',
  'Fire': 'Fire alarm activated. Location: [specify]. Evacuation: [yes/no/partial]. Fire service: [notified/attended]. All clear: [yes/no].',
  'Suspicious Behaviour': 'Suspicious activity observed. Individual(s): [description]. Action taken: [monitored/approached/ejected]. Police: [notified/not required].',
  'Lost Property': 'Lost property reported. Item: [description]. Location lost: [specify]. Owner details taken. Item: [found/not found].',
  'Site Issue': 'Site issue identified at [location]. Issue: [description]. Action taken: [specify]. Resolved: [yes/no/ongoing].',
  'Tech Issue': 'Technical issue reported. Equipment: [specify]. Issue: [description]. Action taken: [specify]. Status: [resolved/ongoing].',
  'Environmental': 'Environmental issue identified. Issue: [description]. Location: [specify]. Action taken: [specify]. Status: [resolved/monitoring].',
  'Crowd Management': 'Crowd management required at [location]. Issue: [description]. Action taken: [specify]. Crowd dispersed: [yes/no].',
  'Evacuation': 'Evacuation initiated. Reason: [specify]. Areas evacuated: [specify]. All clear: [yes/no]. Re-entry: [yes/no].',
  'Fire Alarm': 'Fire alarm activated. Location: [specify]. False alarm: [yes/no]. Fire service: [notified/attended]. All clear: [yes/no].',
  'Suspected Fire': 'Suspected fire reported. Location: [specify]. Investigation: [ongoing/complete]. Fire service: [notified/attended]. All clear: [yes/no].',
  'Noise Complaint': 'Noise complaint received. Source: [specify]. Action taken: [specify]. Noise reduced: [yes/no]. Follow-up: [required/none].',
  'Animal Incident': 'Animal incident reported. Animal: [type]. Location: [specify]. Action taken: [specify]. Animal: [contained/removed/escaped].',
  'Alcohol / Drug Related': 'Substance issue identified. Substance: [type]. Individual: [description]. Action taken: [specify]. Police: [notified/not required].',
  'Entry Breach': 'Unauthorized entry attempt. Location: [specify]. Individual: [description]. Action taken: [specify]. Person: [removed/escaped].',
  'Hostile Act': 'Hostile behavior observed. Individual(s): [description]. Action taken: [specify]. Police: [notified/attended]. Person: [detained/ejected].',
  'Counter-Terror Alert': 'Security alert received. Threat level: [specify]. Action taken: [specify]. Police: [notified/attended]. Status: [resolved/monitoring].',
  'Sexual Misconduct': 'Allegation of sexual misconduct. Details: [confidential]. Action taken: [specify]. Police: [notified/attended]. Support: [provided/arranged].',
  'Emergency Show Stop': 'Emergency show stop initiated. Reason: [specify]. Action taken: [specify]. Show: [resumed/cancelled]. Crowd: [dispersed/contained].',
  'Event Timing': 'Event timing update. Change: [specify]. New time: [specify]. Communication: [sent/completed]. Impact: [minimal/significant].',
  'Timings': 'Timing update logged. Event: [specify]. Time: [specify]. Status: [confirmed/changed]. Communication: [sent/pending].',
  'Sit Rep': 'Situation report provided. Summary: [specify]. Status: [ongoing/resolved]. Next update: [time].',
  'Showdown': 'Showdown time reached. Event: [specify]. Status: [on schedule/delayed]. Communication: [sent/pending].',
  'Accreditation': 'Accreditation issue identified. Individual: [description]. Issue: [specify]. Action taken: [specify]. Access: [granted/denied].',
  'Staffing': 'Staffing issue reported. Area: [specify]. Issue: [description]. Action taken: [specify]. Status: [resolved/ongoing].',
  'Accsessablity': 'Accessibility issue identified. Issue: [description]. Location: [specify]. Action taken: [specify]. Status: [resolved/ongoing].',
  'Artist Movement': 'Artist movement logged. From: [location]. To: [location]. Security: [provided/not required]. Status: [completed/scheduled].',
  'Generic': 'Incident logged and monitored. Current status: [ongoing/resolved]. Further action: [specify].'
}

/**
 * Get the occurrence template for a specific incident type
 * Falls back to 'Generic' template if incident type not found
 */
export function getOccurrenceTemplate(incidentType: string): string {
  return OCCURRENCE_TEMPLATES[incidentType] || OCCURRENCE_TEMPLATES['Generic']
}
