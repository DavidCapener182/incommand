# Incident Dashboard Logic

## Purpose
Central hub for tracking, creating, and managing incidents in real time.

## Main Components
- `IncidentTable`: Lists all incidents, supports filtering, status toggling, and details modal
- `IncidentCreationModal`: Form/modal for creating new incidents, with type detection and AI assistance
- `IncidentDetailsModal`: Shows full details and timeline for a selected incident

## Key Behaviors
- Incidents can be filtered by type/status
- New incidents are parsed for type and details (AI/regex)
- Attendance, medical, ejection, refusal, and other types have custom parsing logic
- Incidents are stored in `incident_logs` (and related tables)
- Details modal shows timeline, attachments, and status updates

## UI
- Responsive, table/grid layout
- Modals for creation and details
- Floating action button for new incident (mobile)

## Incident Creation Modal: Detailed Logic

### 1. Incident Type Selection
- At the top of the modal, display a horizontal grid of "Incident Type" buttons, each with a prominent icon.
- When a user clicks a button:
  - The incident type is set.
  - The button is visually highlighted.
  - The "Incident Type" field is auto-filled.
- Supported types (examples):
  Ejection, Refusal, Medical, Welfare, Drug Related, Weapon Related, Artist Movement, Sexual Misconduct, Site Issue, Attendance, Event Timing, Lost Property, Suspicious Behaviour, Aggressive Behaviour, Queue Build-Up, Technical Issue, Weather Disruption, Other, Sit Rep, Missing Child/Person, Stabbing/Hostile Act, Fire/Fire Alarm, Crowd Density/Overcrowding, Slip/Trip/Fall, Noise Complaint, VIP/Celebrity Movement, Power Failure, Local Traffic Issue, Evacuation, Unattended Bag, Counter-Terrorism Alert, Structural Issue, Entry Breach/Fence Jump, Cash Handling/Theft, Alcohol Related, Self-Harm/Mental Health, Emergency Show Stop, Animal Incident, Environmental Hazard.
- **Usage-Based Sorting:** The grid now sorts incident type buttons by usage count (tracked in localStorage), so the most-used types appear at the top left for easier access. The grid always maintains its shape, and a "More" button is available.

### 2. Quick Input Field
- Below the incident type buttons, a quick input field appears.
- Placeholder: "Enter details (e.g. location, persons involved, brief summary)...".
- As the user types, their input is appended to the Occurrence field (live preview).
- For "Attendance" incidents, the quick input is pre-filled with "Current Attendance: ".

### 3. Auto-Fill Occurrence Logic
- When an incident type is chosen, the Occurrence field is auto-filled with the incident type as a prefix (e.g., "Ejection: ").
- As the user types in the quick input, their input is appended to the Occurrence (live preview).
- If the user enters a location, callsign, or What3Words address, these are parsed and slotted into the Occurrence.
- Additional fields (location, persons, reason, etc.) are conditionally rendered based on the incident type.
- When the user edits "Additional Information," those fields are appended to the Occurrence (auto or on Save).
- On "Create Incident," the full Occurrence string is sent to ChatGPT (or backend) for grammar/spelling correction only (no embellishment or expansion).

### 4. Predefined Actions for 'Action Taken'
- Below "Action Taken," show a list of checkboxes or clickable action chips (from your INCIDENT_ACTIONS list).
- User can click multiple; each click appends the text to the Action Taken field (can be deleted/edited inline).
- Also provide a text box for additional notes.
- Live preview updates as user clicks actions.
- For "Attendance Update" incidents, the quick actions row above "Action Taken" is hidden to prevent user changes.

### 5. Photo Attachment
- Allow drag & drop or file picker (JPEG/iPhone, <5MB).
- Show a thumbnail preview if attached.

### 6. Create Incident
- On submit, check all required fields are filled.
- "Occurrence" and "Action Taken" are saved as composed from above.
- Callsign, What3Words, type, etc. are parsed and included.
- Show a spinner/loading while saving, and a success or error toast.
- Clicking X or Cancel now fully resets the form.

### 7. Log Table Improvements
- On mobile, the "Type" column is always centered, including for multi-line types like "Missing Child/Person".
- On desktop, the Occurrence and Action columns are truncated with ellipsis and show the full text on hover, ensuring the Status column is always visible without horizontal scrolling.
- The log table is responsive and visually consistent across screen sizes.

---

## Recent Improvements (June 2024)
- Usage-based incident type sorting and persistent grid layout in the Incident Creation Modal
- Attendance quick input and context-aware quick actions
- Strict grammar/spell-checking only (no AI embellishment)
- Log table truncation and type/status alignment improvements
- Full form reset on modal close
- Responsive and visually consistent UI across devices

**INCIDENT_ACTIONS**
A mapping of incident types to suggested actions (see code for full details). 