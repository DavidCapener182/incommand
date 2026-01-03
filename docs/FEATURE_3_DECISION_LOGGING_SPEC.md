# Feature 3: Golden Thread Decision Logging & Inquiry Pack
## Technical Specification

---

## Overview

The Golden Thread Decision Logging system provides a tamper-evident record of critical operational decisions made during events, formatted for debriefs, insurers, and inquiries. This feature establishes the foundation for audit trails and decision accountability across the InCommand platform.

---

## Objectives

1. **Capture Critical Decisions**: Structured logging of what was decided, why, and on what basis
2. **Tamper-Evident Records**: Lock records to prevent editing after creation
3. **Evidence Linking**: Attach screenshots, transcripts, emails, and other supporting materials
4. **Inquiry Pack Generation**: One-click export of chronological decision timeline with evidence
5. **Integration**: Link decisions to incidents, staff assignments, and operational context

---

## Database Schema

### Table: `decisions`

Stores critical operational decisions with full context and rationale.

```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Decision Context
  trigger_issue TEXT NOT NULL,
  options_considered JSONB NOT NULL, -- Array of options with pros/cons
  information_available JSONB NOT NULL, -- Density, weather, comms, police advice, etc.
  decision_taken TEXT NOT NULL,
  rationale TEXT NOT NULL,
  
  -- Decision Ownership
  decision_owner_id UUID REFERENCES profiles(id),
  decision_owner_callsign VARCHAR(50),
  role_level VARCHAR(20) NOT NULL CHECK (role_level IN ('bronze', 'silver', 'gold', 'platinum', 'other')),
  
  -- Temporal Context
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location VARCHAR(255),
  follow_up_review_time TIMESTAMPTZ,
  
  -- Linking
  linked_incident_ids INTEGER[] DEFAULT '{}', -- Array of incident_logs.id
  linked_staff_assignment_ids UUID[] DEFAULT '{}', -- Array of staff_assignments.id
  
  -- Tamper-Evident Locking
  locked_at TIMESTAMPTZ,
  locked_by_user_id UUID REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES profiles(id),
  
  -- Constraints
  CONSTRAINT decision_owner_required CHECK (
    decision_owner_id IS NOT NULL OR decision_owner_callsign IS NOT NULL
  ),
  CONSTRAINT locked_requires_locker CHECK (
    (is_locked = FALSE) OR (locked_by_user_id IS NOT NULL AND locked_at IS NOT NULL)
  )
);
```

### Table: `decision_evidence`

Links supporting evidence (screenshots, transcripts, emails) to decisions.

```sql
CREATE TABLE decision_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Evidence Details
  evidence_type VARCHAR(50) NOT NULL CHECK (
    evidence_type IN ('screenshot', 'cctv_still', 'radio_transcript', 'email', 
                     'message', 'document', 'audio_recording', 'video', 'other')
  ),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Storage
  file_path TEXT, -- Path in Supabase Storage
  file_url TEXT, -- Public URL if applicable
  external_reference TEXT, -- Reference to external system (e.g., CCTV system ID)
  
  -- Metadata
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_by_user_id UUID REFERENCES profiles(id),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `decision_annotations`

Allows locked decisions to be annotated (but not edited) after locking.

```sql
CREATE TABLE decision_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  annotation_text TEXT NOT NULL,
  annotation_type VARCHAR(50) DEFAULT 'note' CHECK (
    annotation_type IN ('note', 'clarification', 'correction', 'follow_up', 'inquiry_response')
  ),
  
  created_by_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Annotations cannot be edited or deleted (immutable)
  CONSTRAINT annotations_immutable CHECK (true)
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_decisions_event_id ON decisions(event_id);
CREATE INDEX idx_decisions_company_id ON decisions(company_id);
CREATE INDEX idx_decisions_timestamp ON decisions(timestamp DESC);
CREATE INDEX idx_decisions_decision_owner ON decisions(decision_owner_id);
CREATE INDEX idx_decisions_role_level ON decisions(role_level);
CREATE INDEX idx_decisions_locked ON decisions(is_locked) WHERE is_locked = TRUE;
CREATE INDEX idx_decisions_linked_incidents ON decisions USING GIN(linked_incident_ids);

CREATE INDEX idx_decision_evidence_decision_id ON decision_evidence(decision_id);
CREATE INDEX idx_decision_evidence_type ON decision_evidence(evidence_type);
CREATE INDEX idx_decision_annotations_decision_id ON decision_annotations(decision_id);
```

---

## Row Level Security (RLS) Policies

### Decisions Table

```sql
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Users can view decisions for their company's events
CREATE POLICY "Users can view decisions for their company events"
  ON decisions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create decisions for their company's events
CREATE POLICY "Users can create decisions for their company events"
  ON decisions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by_user_id = auth.uid()
  );

-- Users can update decisions only if not locked and for their company
CREATE POLICY "Users can update unlocked decisions"
  ON decisions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND is_locked = FALSE
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND is_locked = FALSE
  );

-- Only decision owner or admins can lock decisions
CREATE POLICY "Decision owners and admins can lock decisions"
  ON decisions FOR UPDATE
  USING (
    (decision_owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ))
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    (decision_owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ))
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### Decision Evidence Table

```sql
ALTER TABLE decision_evidence ENABLE ROW LEVEL SECURITY;

-- Users can view evidence for decisions they can access
CREATE POLICY "Users can view evidence for accessible decisions"
  ON decision_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = decision_evidence.decision_id
      AND d.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can add evidence to decisions they can access
CREATE POLICY "Users can add evidence to accessible decisions"
  ON decision_evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = decision_evidence.decision_id
      AND d.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND d.is_locked = FALSE
    )
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### Decision Annotations Table

```sql
ALTER TABLE decision_annotations ENABLE ROW LEVEL SECURITY;

-- Users can view annotations for decisions they can access
CREATE POLICY "Users can view annotations for accessible decisions"
  ON decision_annotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = decision_annotations.decision_id
      AND d.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can add annotations to decisions they can access
CREATE POLICY "Users can add annotations to accessible decisions"
  ON decision_annotations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = decision_annotations.decision_id
      AND d.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

---

## API Endpoints

### POST `/api/decisions`

Create a new decision.

**Request Body:**
```typescript
{
  event_id: number;
  trigger_issue: string;
  options_considered: Array<{
    option: string;
    pros: string[];
    cons: string[];
  }>;
  information_available: {
    density?: number;
    weather?: string;
    comms_status?: string;
    police_advice?: string;
    [key: string]: any;
  };
  decision_taken: string;
  rationale: string;
  decision_owner_id?: string;
  decision_owner_callsign?: string;
  role_level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'other';
  location?: string;
  follow_up_review_time?: string; // ISO timestamp
  linked_incident_ids?: number[];
  linked_staff_assignment_ids?: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  decision: {
    id: string;
    // ... all decision fields
  };
}
```

### GET `/api/decisions?event_id={eventId}`

Get all decisions for an event.

**Query Parameters:**
- `event_id` (required): Event ID
- `locked_only` (optional): Filter to locked decisions only
- `role_level` (optional): Filter by role level
- `from` (optional): Start timestamp (ISO)
- `to` (optional): End timestamp (ISO)

**Response:**
```typescript
{
  success: boolean;
  decisions: Decision[];
  total: number;
}
```

### GET `/api/decisions/{decisionId}`

Get a specific decision with evidence and annotations.

**Response:**
```typescript
{
  success: boolean;
  decision: Decision & {
    evidence: DecisionEvidence[];
    annotations: DecisionAnnotation[];
    linked_incidents: Incident[];
    linked_staff_assignments: StaffAssignment[];
  };
}
```

### PUT `/api/decisions/{decisionId}`

Update a decision (only if not locked).

**Request Body:** Same as POST, but all fields optional.

**Response:**
```typescript
{
  success: boolean;
  decision: Decision;
}
```

### POST `/api/decisions/{decisionId}/lock`

Lock a decision (make it tamper-evident).

**Response:**
```typescript
{
  success: boolean;
  decision: Decision;
  message: string;
}
```

### POST `/api/decisions/{decisionId}/evidence`

Add evidence to a decision.

**Request:** Multipart form data
- `file` (optional): File upload
- `evidence_type`: Type of evidence
- `title`: Evidence title
- `description`: Evidence description
- `external_reference`: External system reference (if applicable)
- `captured_at`: ISO timestamp (defaults to now)

**Response:**
```typescript
{
  success: boolean;
  evidence: DecisionEvidence;
}
```

### POST `/api/decisions/{decisionId}/annotations`

Add an annotation to a decision (works even if locked).

**Request Body:**
```typescript
{
  annotation_text: string;
  annotation_type?: 'note' | 'clarification' | 'correction' | 'follow_up' | 'inquiry_response';
}
```

**Response:**
```typescript
{
  success: boolean;
  annotation: DecisionAnnotation;
}
```

### GET `/api/decisions/{decisionId}/inquiry-pack`

Generate inquiry pack for a decision (or all decisions for an event).

**Query Parameters:**
- `format` (optional): 'pdf' | 'json' | 'html' (default: 'pdf')
- `include_evidence` (optional): Include evidence files (default: true)
- `event_id` (optional): Generate pack for all decisions in event

**Response:**
- PDF: Binary PDF file
- JSON: JSON structure with all decision data
- HTML: HTML document

---

## Component Architecture

### `src/components/decisions/DecisionLogger.tsx`

Main component for creating and editing decisions.

**Props:**
```typescript
interface DecisionLoggerProps {
  eventId: number;
  isOpen: boolean;
  onClose: () => void;
  onDecisionCreated?: (decision: Decision) => void;
  initialDecision?: Decision; // For editing
  linkedIncidentIds?: number[]; // Pre-fill from incident context
}
```

**Features:**
- Structured form with all decision fields
- Options considered (add/remove options with pros/cons)
- Information available (dynamic fields based on available data)
- Evidence upload (drag & drop)
- Link to incidents and staff assignments
- Lock button (with confirmation)
- Validation and error handling

### `src/components/decisions/DecisionTimeline.tsx`

Chronological timeline view of decisions for an event.

**Props:**
```typescript
interface DecisionTimelineProps {
  eventId: number;
  showLockedOnly?: boolean;
  roleLevelFilter?: string;
}
```

**Features:**
- Chronological list of decisions
- Filter by locked status, role level, time range
- Quick view of decision summary
- Click to view full decision details
- Visual indicators for locked decisions

### `src/components/decisions/DecisionDetails.tsx`

Detailed view of a single decision with evidence and annotations.

**Props:**
```typescript
interface DecisionDetailsProps {
  decisionId: string;
  onClose?: () => void;
}
```

**Features:**
- Full decision information display
- Evidence gallery (images, documents, transcripts)
- Annotations list (chronological)
- Linked incidents and staff assignments
- Lock status indicator
- Add annotation button (if locked, only annotations allowed)
- Inquiry pack download button

### `src/components/decisions/DecisionEvidenceUpload.tsx`

Component for uploading evidence to decisions.

**Props:**
```typescript
interface DecisionEvidenceUploadProps {
  decisionId: string;
  onEvidenceAdded?: (evidence: DecisionEvidence) => void;
}
```

**Features:**
- Drag & drop file upload
- File type validation
- Preview for images
- External reference input (for CCTV, radio systems)
- Progress indicator

### `src/app/admin/decisions/page.tsx`

Admin page for managing decisions.

**Features:**
- List all decisions (filterable by event, company, date range)
- Search functionality
- Bulk operations (export, inquiry pack generation)
- Decision statistics dashboard
- Lock/unlock management (admin only)

### `src/lib/reporting/inquiryPack.ts`

Service for generating inquiry packs.

**Functions:**
```typescript
export async function generateInquiryPack(
  decisionIds: string[],
  options: {
    format: 'pdf' | 'json' | 'html';
    includeEvidence: boolean;
    includeAnnotations: boolean;
  }
): Promise<Buffer | object | string>;

export async function generateEventInquiryPack(
  eventId: number,
  options: InquiryPackOptions
): Promise<Buffer | object | string>;
```

**Features:**
- Chronological decision timeline
- Key metrics at each decision point
- Evidence list with references
- Linked incidents and context
- Professional formatting for inquiries

---

## Integration Points

### Dashboard Integration

Add decision logging widget to Dashboard (`src/components/Dashboard.tsx`):
- Quick "Log Decision" button
- Recent decisions timeline
- Locked decisions count
- Pending follow-up reviews

### Incident Integration

Add decision logging to Incident details (`src/components/IncidentTable.tsx`):
- "Log Decision" button in incident details modal
- Pre-fill linked incident ID
- Show related decisions for incident

### Staff Assignment Integration

Link decisions to staff assignments:
- When assigning staff, option to log decision
- Show decisions related to staff assignments

---

## Workflow

### Creating a Decision

1. User clicks "Log Decision" (from Dashboard, Incident details, or Admin page)
2. `DecisionLogger` modal opens
3. User fills in:
   - Trigger/issue
   - Options considered (add multiple with pros/cons)
   - Information available (density, weather, etc.)
   - Decision taken
   - Rationale
   - Decision owner (self or other)
   - Role level
   - Location
   - Follow-up review time
   - Link to incidents/staff assignments
4. User can upload evidence files
5. User clicks "Save Decision"
6. Decision is created and appears in timeline

### Locking a Decision

1. User views decision details
2. User clicks "Lock Decision" (only owner or admin)
3. Confirmation dialog appears
4. Upon confirmation:
   - `is_locked` set to `TRUE`
   - `locked_at` set to current timestamp
   - `locked_by_user_id` set to current user
   - Decision becomes read-only (except annotations)

### Adding Evidence

1. User views decision details
2. User clicks "Add Evidence"
3. `DecisionEvidenceUpload` component opens
4. User uploads file or provides external reference
5. Evidence is linked to decision

### Adding Annotations (to Locked Decisions)

1. User views locked decision details
2. User clicks "Add Annotation"
3. Annotation form opens
4. User enters annotation text and type
5. Annotation is saved (immutable)

### Generating Inquiry Pack

1. User selects decisions (or entire event)
2. User clicks "Generate Inquiry Pack"
3. User selects format (PDF/JSON/HTML)
4. System generates pack with:
   - Chronological timeline
   - Decision details
   - Evidence references
   - Linked incidents
   - Metrics at decision points
5. Pack is downloaded

---

## Security Considerations

1. **Tamper-Evident Locking**: Once locked, decisions cannot be edited
2. **Company Isolation**: RLS ensures users only see their company's decisions
3. **Role-Based Access**: Only decision owners and admins can lock decisions
4. **Audit Trail**: All actions logged in `audit_logs` table
5. **Evidence Storage**: Files stored in Supabase Storage with access controls
6. **Immutable Annotations**: Annotations cannot be edited or deleted

---

## Testing Requirements

### Unit Tests

- Decision creation validation
- Lock mechanism logic
- Evidence upload handling
- Inquiry pack generation

### Integration Tests

- API endpoint functionality
- RLS policy enforcement
- File upload and storage
- Decision linking to incidents

### E2E Tests

- Complete decision logging workflow
- Locking and annotation workflow
- Inquiry pack generation and download

---

## Performance Considerations

1. **Indexing**: All foreign keys and frequently queried fields indexed
2. **Pagination**: Decision lists paginated (50 per page)
3. **Lazy Loading**: Evidence files loaded on demand
4. **Caching**: Decision timelines cached for dashboard
5. **File Storage**: Evidence files stored in Supabase Storage (not database)

---

## Future Enhancements

1. **Decision Templates**: Pre-defined decision templates for common scenarios
2. **AI-Assisted Rationale**: AI suggestions for decision rationale based on context
3. **Decision Analytics**: Analysis of decision patterns and outcomes
4. **Collaborative Decisions**: Multi-user decision-making workflow
5. **Decision Reminders**: Notifications for follow-up review times
6. **Export Formats**: Additional export formats (Word, Excel)

---

## Migration Path

1. Create database migration script (`database/decision_logging_migration.sql`)
2. Run migration on development database
3. Deploy API endpoints
4. Deploy UI components
5. Add Dashboard integration
6. Add Incident integration
7. User training and documentation
8. Deploy to production

---

## Success Metrics

1. **Adoption**: Number of decisions logged per event
2. **Completeness**: Percentage of critical incidents with linked decisions
3. **Lock Rate**: Percentage of decisions locked within 24 hours
4. **Evidence Attachment**: Average evidence items per decision
5. **Inquiry Pack Usage**: Number of inquiry packs generated
6. **User Satisfaction**: User feedback on decision logging workflow

