export const INCIDENT_EXTRACTION_SYSTEM = 'You extract structured security incident data and ALWAYS return strict JSON. If something is missing, use empty string.';

export const buildIncidentExtractionUser = (incidentTypes: string[], input: string) => `Given these allowed incident types: ${incidentTypes.join(', ')}
Extract the following as strict JSON with keys: incidentType, description, callsign, location, priority, confidence, actionTaken.
- incidentType: One of the allowed incident types only. For sexual misconduct, assault, or rape, use "Sexual Misconduct". For fights, use "Fight". For medical emergencies, use "Medical".
- description: Convert to a proper sentence with correct spelling and grammar. For "rape reported in the male toilets by R1sc" write "A rape was reported in the male toilets." Do not include callsigns in description.
- callsign: Extract if present (e.g., A1, R2, Security 1, R1sc). Else empty
- location: Extract ONLY the pure location name (e.g., "male toilets", "main stage", "north gate"). Remove ALL callsigns, "by", "reported in", "in the", or any other text. Just the location name.
- priority: One of urgent|high|medium|low based on severity. Rape, sexual assault, serious violence, medical emergencies, fires are "urgent". Fights, theft, suspicious behavior are "high". Minor incidents are "medium" or "low".
- confidence: 0-1 indicating certainty
- actionTaken: Provide exactly 5 specific actions as a numbered list, plus "Other:" for additional notes. For serious incidents like rape: "1. Secure the area and preserve evidence. 2. Contact police immediately. 3. Provide support to victim. 4. Document all details and witnesses. 5. Coordinate with medical if needed. Other:"

Incident: "${input}"`;


