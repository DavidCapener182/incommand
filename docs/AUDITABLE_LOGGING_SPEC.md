# Auditable Event Logging Specification

## Executive Summary

This specification defines the implementation of professional-grade, legally defensible event logging for inCommand, based on emergency services best practices and operational standards (JESIP, JDM, ISO 31000). The system ensures all incident logs are immutable, auditable, and maintain complete chain-of-custody for evidential purposes.

## Core Principles

### 1. "If it ain't written down, it didn't happen"
Every decision and communication must be recorded with complete metadata including who, what, when, where, and why.

### 2. Contemporaneous Logging
Entries must clearly distinguish between real-time logging and retrospective entries, with timestamps capturing both when events occurred and when they were logged.

### 3. Factual, Non-Editorial Recording
Logs must contain verifiable facts only—no opinions, adjectives, or speculation in official records.

### 4. Immutable Audit Trail
No silent edits. All changes create revision records with full attribution and justification.

### 5. Legal Defensibility
Logs are treated as legal documents suitable for licensing reviews, investigations, and court proceedings.

---

## Technical Architecture

### Database Schema

#### Extended incident_logs Table

```sql
-- New columns added to existing incident_logs table
ALTER TABLE incident_logs ADD COLUMN IF NOT EXISTS:
  time_of_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_logged TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entry_type VARCHAR(20) NOT NULL DEFAULT 'contemporaneous',
  retrospective_justification TEXT,
  logged_by_user_id UUID REFERENCES profiles(id),
  logged_by_callsign VARCHAR(50),
  is_amended BOOLEAN DEFAULT FALSE,
  original_entry_id UUID REFERENCES incident_logs(id),
  
-- Constraints
CONSTRAINT entry_type_check CHECK (entry_type IN ('contemporaneous', 'retrospective')),
CONSTRAINT retrospective_requires_justification 
  CHECK (entry_type != 'retrospective' OR retrospective_justification IS NOT NULL)
```

#### New incident_log_revisions Table

```sql
CREATE TABLE incident_log_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_log_id UUID NOT NULL REFERENCES incident_logs(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  field_changed VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by_user_id UUID REFERENCES profiles(id),
  changed_by_callsign VARCHAR(50),
  change_reason TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_type VARCHAR(50) NOT NULL,
  
  CONSTRAINT change_type_check CHECK (change_type IN ('amendment', 'status_change', 'escalation', 'correction')),
  UNIQUE(incident_log_id, revision_number)
);

CREATE INDEX idx_revisions_incident ON incident_log_revisions(incident_log_id);
CREATE INDEX idx_revisions_changed_at ON incident_log_revisions(changed_at DESC);
CREATE INDEX idx_revisions_change_type ON incident_log_revisions(change_type);
```

### Data Flow

#### Creating a New Log Entry

```
User Input → Validation → Entry Type Classification → Immutable Insert → Confirmation
```

1. **Input Capture**: All required fields including entry type, timestamps, and logged_by metadata
2. **Validation**: 
   - Entry type matches time delta
   - Retrospective entries have justification
   - All required fields present
3. **Immutable Insert**: Single INSERT operation, no subsequent UPDATE
4. **Return**: Created log with full metadata

#### Amending an Existing Log

```
Amendment Request → Validation → Create Revision → Mark Original → Audit Trail → Confirmation
```

1. **Amendment Request**: User provides new values and reason for change
2. **Validation**: User has permission, reason provided, changes are substantive
3. **Create Revision**: INSERT into incident_log_revisions with full diff
4. **Mark Original**: Set is_amended=TRUE on original record
5. **Audit Trail**: Complete record of who, what, when, why
6. **Return**: Amendment history

---

## API Specifications

### POST /api/v1/incidents/create-log

Create a new immutable incident log entry.

**Request Body:**
```typescript
{
  occurrence: string;              // What happened (factual description)
  action_taken: string;            // Response actions
  incident_type: string;           // Type from predefined list
  callsign_from: string;           // Reporting callsign
  callsign_to: string;             // Receiving callsign
  time_of_occurrence: string;      // ISO 8601 timestamp - when it happened
  time_logged?: string;            // ISO 8601 - when logged (default: now)
  entry_type: 'contemporaneous' | 'retrospective';
  retrospective_justification?: string; // Required if retrospective
  priority?: string;
  what3words?: string;
  photo_url?: string;
  event_id: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  log: AuditableIncidentLog;
  warnings?: string[];  // e.g., "Entry logged >15 min after occurrence"
}
```

**Validation Rules:**
- If `time_of_occurrence` is >15 minutes in past and `entry_type` is 'contemporaneous', return warning
- If `entry_type` is 'retrospective', `retrospective_justification` must be provided
- Auto-populate `logged_by_user_id` and `logged_by_callsign` from session
- `time_logged` defaults to NOW() if not provided

### POST /api/v1/incidents/[id]/amend

Create an amendment revision for an existing log.

**Request Body:**
```typescript
{
  field_changed: string;           // Field name being amended
  new_value: any;                  // New value
  change_reason: string;           // Required justification
  change_type: 'amendment' | 'correction' | 'clarification';
}
```

**Response:**
```typescript
{
  success: boolean;
  revision: LogRevision;
  incident: AuditableIncidentLog;  // Updated to show is_amended=true
}
```

**Business Logic:**
- Never UPDATE the original incident_logs record directly
- Create new row in incident_log_revisions
- Set is_amended=TRUE on original
- Auto-increment revision_number
- Capture changed_by from session
- Return complete revision history

### GET /api/v1/incidents/[id]/revisions

Retrieve complete revision history for a log.

**Response:**
```typescript
{
  success: boolean;
  revisions: LogRevision[];
  incident: AuditableIncidentLog;
}
```

---

## UI/UX Requirements

### Visual Language

#### Entry Type Indicators
- **Contemporaneous**: Standard styling, no special indicator
- **Retrospective**: 🕓 clock icon, subtle amber/yellow border

#### Amendment Indicators
- **Amended Logs**: Amber "AMENDED" badge in top-right corner
- **Revision Count**: Small badge showing number of amendments (e.g., "3 edits")

#### Timestamp Display
```
Standard Format:
Occurred: 14:32:15 | Logged: 14:32:18

Retrospective Format:
🕓 Occurred: 14:15:00 | Logged: 14:47:23 (Delayed)
```

### Component Specifications

#### Incident Creation Modal

**New Fields:**
1. **Entry Type Radio Buttons**
   - Options: Contemporaneous (default) / Retrospective
   - Tooltip: "Select 'Retrospective' if logging past events"

2. **Time of Occurrence**
   - DateTime picker
   - Defaults to NOW()
   - Shows warning if >15 min in past

3. **Retrospective Justification** (conditional)
   - Multi-line text area
   - Required when entry_type = 'retrospective'
   - Placeholder: "Explain why this entry is being logged retrospectively (e.g., 'Live comms prevented immediate logging')"

4. **Logged By** (read-only)
   - Auto-populated from user session
   - Format: "John Smith (R1)"

**Validation:**
- Warn if time gap >15 min without retrospective selection
- Require justification for retrospective entries
- Show inline tooltip: "Stick to verifiable facts—avoid opinions or adjectives"

#### Incident Details Modal

**Enhanced Display:**
1. **Dual Timestamps Section**
   ```
   📅 Timeline
   Occurred:  14:32:15 on 08/10/2024
   Logged:    14:32:18 on 08/10/2024
   Entry Type: Contemporaneous
   ```

2. **Amendment Indicator** (if is_amended=true)
   ```
   ⚠️ This entry has been amended (3 revisions)
   [View Amendment History]
   ```

3. **Action Buttons**
   - Replace "Edit" with "Amend Entry"
   - Add "View Revision History"

4. **Revision History Section** (collapsible)
   - Chronological list of all amendments
   - Show diff: old_value → new_value
   - Display who, when, why for each change

#### Amendment Modal

**Layout:**
1. **Current Values** (read-only, highlighted)
   - Show all current field values
   - Highlight field being amended

2. **New Value Input**
   - Input field for new value
   - Show old value inline for reference

3. **Amendment Details**
   - Change Type: dropdown (Amendment/Correction/Clarification)
   - Reason for Change: required text area
   - Changed By: auto-populated, read-only

4. **Confirmation Preview**
   - Show before/after comparison
   - Confirm button creates revision

**Example:**
```
Amending: Occurrence Description

Current Value:
"Barrier collapse in Pit B"

New Value:
[Barrier collapse in Pit B section 3]

Change Type: [Clarification ▼]

Reason for Amendment:
[Added specific section number after confirmation with venue ops]

Changed By: John Smith (R1)
           08/10/2024 15:45:12

[Cancel] [Confirm Amendment]
```

#### Incident Table Enhancements

**New Columns/Indicators:**
- Entry Type icon (🕓 for retrospective)
- Amendment badge (if is_amended=true)
- Revision count (small superscript)

**Visual Distinctions:**
- Retrospective entries: subtle amber left border
- Amended entries: amber "AMENDED" badge
- Hover shows dual timestamp tooltip

---

## Operational Procedures

### Logging Standards

#### Good Log Entry Example:
```
Occurrence: Barrier collapse in Pit B section 3 at 14:32. 
Witness reports 2-3 persons potentially injured. 
Area cordoned by security callsign S4.

Action Taken: Dispatched medic callsigns M1 and M2 to scene. 
Notified venue ops (callsign V1) for structural assessment. 
Incident escalated to Silver at 14:35.

Entry Type: Contemporaneous
Logged By: John Smith (R1)
Occurred: 14:32:15 | Logged: 14:32:45
```

#### Poor Log Entry Example (to avoid):
```
Occurrence: Massive barrier failure - chaotic scene
Action Taken: Sent help, hopefully everyone's okay
```
❌ Problems: Emotional language ("massive", "chaotic"), vague actions, no callsigns, speculation ("hopefully")

### When to Use Retrospective Entries

**Valid Reasons:**
- Live communications prevented immediate logging
- Multiple simultaneous incidents requiring triage
- Technical failure of logging system (with explanation)
- Event occurred during shift handover

**Invalid Reasons:**
- Forgot to log
- Too busy (without specific operational reason)
- Backdating for convenience

### Amendment Guidelines

**When to Amend:**
- Factual error discovered (wrong time, location, callsign)
- Additional verified information becomes available
- Clarification needed for legal/investigation purposes

**When NOT to Amend:**
- To hide mistakes or poor decisions
- To match other narratives
- To remove unflattering but factual information

**Amendment must include:**
1. What is being changed
2. Why it is being changed
3. Who authorized/performed the change
4. When the change was made

---

## Data Migration Strategy

### Backfill Existing Logs

```sql
-- Step 1: Add new columns with defaults
ALTER TABLE incident_logs 
  ADD COLUMN time_of_occurrence TIMESTAMPTZ,
  ADD COLUMN time_logged TIMESTAMPTZ,
  ADD COLUMN entry_type VARCHAR(20) DEFAULT 'contemporaneous',
  ADD COLUMN logged_by_user_id UUID,
  ADD COLUMN logged_by_callsign VARCHAR(50),
  ADD COLUMN is_amended BOOLEAN DEFAULT FALSE;

-- Step 2: Backfill timestamps from existing data
UPDATE incident_logs
SET 
  time_of_occurrence = timestamp,
  time_logged = timestamp,
  logged_by_callsign = callsign_from
WHERE time_of_occurrence IS NULL;

-- Step 3: Make columns NOT NULL after backfill
ALTER TABLE incident_logs
  ALTER COLUMN time_of_occurrence SET NOT NULL,
  ALTER COLUMN time_logged SET NOT NULL,
  ALTER COLUMN entry_type SET NOT NULL;
```

### Migration Safety

- Run in transaction
- Create backup before migration
- Validate row counts match
- Test on staging environment first
- Monitor for constraint violations

---

## Compliance & Legal Considerations

### Data Retention

- Incident logs: Retain for **7 years** (UK legal requirement for event safety records)
- Revision history: Permanent retention with logs
- No deletion of logs or revisions (mark as withdrawn instead)

### Audit Requirements

All logs must support:
1. **Chain of Custody**: Complete record of who handled/modified the log
2. **Temporal Accuracy**: Precise timestamps in UTC
3. **Non-Repudiation**: Cryptographic user authentication (via Supabase RLS)
4. **Immutability**: No silent edits or deletions

### Export Requirements

PDF exports must include:
- All original log data
- Complete revision history
- Metadata footer: "Generated from inCommand — Timestamp: [UTC] — Log entries are immutable and auditable"
- Watermark indicating official status

### GDPR Compliance

- User IDs in logs are necessary for legal defensibility (legitimate interest)
- Personal data pseudonymized in exports where possible
- Right to erasure does not apply to legal/statutory records
- Data processing basis: **Legal obligation** and **Public interest**

---

## Testing Requirements

### Unit Tests

- Validate entry type logic
- Test retrospective justification requirement
- Verify immutable insert operations
- Check revision numbering sequence

### Integration Tests

- Full log creation flow
- Amendment creation and retrieval
- Revision history accuracy
- Concurrent amendment handling

### E2E Tests

1. Create contemporaneous log
2. Create retrospective log with justification
3. Amend existing log
4. View revision history
5. Export PDF with amendments
6. Verify timestamps in different timezones

### Performance Tests

- Log creation: <100ms
- Revision retrieval: <200ms
- Table display with 1000+ logs: <1s
- PDF export with 100 revisions: <3s

---

## Security Considerations

### Access Control

- **Create Logs**: All authenticated users
- **Amend Logs**: Users with admin role OR log creator (within 24 hours)
- **View Revisions**: All authenticated users
- **Export Logs**: Admin or authorized roles only

### RLS Policies

```sql
-- Users can create logs for their event
CREATE POLICY incident_logs_insert ON incident_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    event_id IN (SELECT id FROM events WHERE is_current = true)
  );

-- Users can amend logs they created (if <24 hours) OR if admin
CREATE POLICY incident_log_revisions_insert ON incident_log_revisions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_logs
      WHERE id = incident_log_id
      AND (
        logged_by_user_id = auth.uid() AND 
        created_at > NOW() - INTERVAL '24 hours'
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Audit Logging

All operations logged to:
- `incident_log_revisions` for amendments
- `settings_audit_logs` for system changes
- Application logs for access patterns

---

## Success Metrics

### Quantitative

- 100% of new logs capture dual timestamps
- 0% destructive edits after implementation
- <2% retrospective entries in normal operations
- 95% user satisfaction with logging workflow

### Qualitative

- Logs are accepted as evidence in licensing reviews
- Reduction in "logging errors" during post-event debriefs
- Improved clarity and factual content in logs
- Positive feedback from legal/compliance teams

---

## Future Enhancements (Phase 2 & 3)

### Phase 2: Workflow Enhancements
- AI-powered factual language validation
- Structured log templates by incident type
- Real-time WebSocket collaboration on logs
- Voice-to-text with automatic fact extraction

### Phase 3: Operational Features
- Training mode for new loggists
- Interactive logging standards guide
- Commander review reminders (every 30 min)
- Automated log quality scoring
- Integration with body-worn cameras for timestamp correlation

---

## Glossary

**Contemporaneous**: Logged in real-time or very shortly after the event occurred

**Retrospective**: Logged after a significant delay from when the event occurred

**Amendment**: A non-destructive edit that creates a revision record

**Immutable**: Cannot be changed or deleted once created

**Loggist**: Personnel responsible for maintaining the event log (control room role)

**Chain of Custody**: Complete record of who handled evidence and when

**JDM**: Joint Decision Model (UK emergency services framework)

**JESIP**: Joint Emergency Services Interoperability Principles

**RLS**: Row Level Security (Supabase/PostgreSQL security feature)

---

## References

- **JESIP**: [Joint Emergency Services Interoperability Principles](https://www.jesip.org.uk/)
- **ISO 31000**: Risk Management Guidelines
- **UK Event Safety Guide (Purple Guide)**: Crowd management and safety
- **GDPR**: General Data Protection Regulation
- **Supabase Documentation**: [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Document Version**: 1.0  
**Last Updated**: October 8, 2024  
**Owner**: inCommand Development Team  
**Status**: Approved for Implementation

