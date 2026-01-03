# Feature 3: Decision Logging - Implementation Roadmap

## Overview

This document outlines the step-by-step implementation plan for Feature 3: Golden Thread Decision Logging & Inquiry Pack.

## Prerequisites

- [x] Feature Placement Strategy document created
- [x] Technical specification completed
- [x] Database migration script created
- [ ] Database migration tested on development environment
- [ ] Supabase Storage bucket created for evidence files

## Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1)

#### Step 1.1: Database Migration
- [ ] Review migration script (`database/decision_logging_migration.sql`)
- [ ] Test migration on development database
- [ ] Verify RLS policies work correctly
- [ ] Create Supabase Storage bucket: `decision-evidence`
- [ ] Set Storage bucket policies for company isolation

**Files:**
- `database/decision_logging_migration.sql`

**Testing:**
```sql
-- Test RLS policies
-- As user A, create decision for company A
-- As user B (company B), verify cannot see decision
-- As user A, verify can update unlocked decision
-- As user A, lock decision, verify cannot update
-- As user A, add annotation to locked decision
```

#### Step 1.2: TypeScript Types
- [ ] Create type definitions in `src/types/decisions.ts`
- [ ] Export types for use across application

**Files:**
- `src/types/decisions.ts` (new)

**Types needed:**
- `Decision`
- `DecisionEvidence`
- `DecisionAnnotation`
- `DecisionCreateInput`
- `DecisionUpdateInput`
- `InquiryPackOptions`

#### Step 1.3: API Routes - Core Endpoints
- [ ] Create `src/app/api/decisions/route.ts` (GET, POST)
- [ ] Create `src/app/api/decisions/[id]/route.ts` (GET, PUT)
- [ ] Create `src/app/api/decisions/[id]/lock/route.ts` (POST)
- [ ] Test all endpoints with Postman/Thunder Client

**Files:**
- `src/app/api/decisions/route.ts` (new)
- `src/app/api/decisions/[id]/route.ts` (new)
- `src/app/api/decisions/[id]/lock/route.ts` (new)

**Endpoints:**
- `GET /api/decisions?event_id={id}` - List decisions
- `POST /api/decisions` - Create decision
- `GET /api/decisions/[id]` - Get decision details
- `PUT /api/decisions/[id]` - Update decision
- `POST /api/decisions/[id]/lock` - Lock decision

#### Step 1.4: API Routes - Evidence & Annotations
- [ ] Create `src/app/api/decisions/[id]/evidence/route.ts` (POST)
- [ ] Create `src/app/api/decisions/[id]/annotations/route.ts` (POST)
- [ ] Implement file upload handling (Supabase Storage)
- [ ] Test file uploads

**Files:**
- `src/app/api/decisions/[id]/evidence/route.ts` (new)
- `src/app/api/decisions/[id]/annotations/route.ts` (new)

**Endpoints:**
- `POST /api/decisions/[id]/evidence` - Add evidence
- `POST /api/decisions/[id]/annotations` - Add annotation

#### Step 1.5: Inquiry Pack Generator
- [ ] Create `src/lib/reporting/inquiryPack.ts`
- [ ] Implement PDF generation (using PDFKit or similar)
- [ ] Implement JSON export
- [ ] Implement HTML export
- [ ] Create `src/app/api/decisions/[id]/inquiry-pack/route.ts`

**Files:**
- `src/lib/reporting/inquiryPack.ts` (new)
- `src/app/api/decisions/[id]/inquiry-pack/route.ts` (new)

**Dependencies:**
- PDF generation library (e.g., `pdfkit`, `jspdf`, or `puppeteer`)
- Template engine for HTML (optional)

---

### Phase 2: Core UI Components (Week 2)

#### Step 2.1: Decision Logger Component
- [ ] Create `src/components/decisions/DecisionLogger.tsx`
- [ ] Implement form with all fields
- [ ] Add options considered (add/remove with pros/cons)
- [ ] Add information available (dynamic fields)
- [ ] Add evidence upload UI
- [ ] Add incident/staff assignment linking
- [ ] Add validation
- [ ] Add error handling

**Files:**
- `src/components/decisions/DecisionLogger.tsx` (new)

**Dependencies:**
- Form library (React Hook Form or similar)
- File upload component
- UI components (from existing design system)

#### Step 2.2: Decision Timeline Component
- [ ] Create `src/components/decisions/DecisionTimeline.tsx`
- [ ] Implement chronological list
- [ ] Add filters (locked, role level, date range)
- [ ] Add search functionality
- [ ] Add pagination
- [ ] Add click-to-view-details

**Files:**
- `src/components/decisions/DecisionTimeline.tsx` (new)

#### Step 2.3: Decision Details Component
- [ ] Create `src/components/decisions/DecisionDetails.tsx`
- [ ] Display full decision information
- [ ] Show evidence gallery
- [ ] Show annotations list
- [ ] Show linked incidents/assignments
- [ ] Add lock button (with confirmation)
- [ ] Add annotation form (for locked decisions)
- [ ] Add inquiry pack download button

**Files:**
- `src/components/decisions/DecisionDetails.tsx` (new)

#### Step 2.4: Evidence Upload Component
- [ ] Create `src/components/decisions/DecisionEvidenceUpload.tsx`
- [ ] Implement drag & drop
- [ ] Add file type validation
- [ ] Add image preview
- [ ] Add external reference input
- [ ] Add progress indicator

**Files:**
- `src/components/decisions/DecisionEvidenceUpload.tsx` (new)

---

### Phase 3: Integration & Admin UI (Week 3)

#### Step 3.1: Dashboard Integration
- [ ] Add decision logging widget to `src/components/Dashboard.tsx`
- [ ] Add "Log Decision" quick button
- [ ] Add recent decisions timeline
- [ ] Add locked decisions count
- [ ] Add pending follow-up reviews

**Files:**
- `src/components/Dashboard.tsx` (modify)

#### Step 3.2: Incident Integration
- [ ] Add "Log Decision" button to incident details modal
- [ ] Pre-fill linked incident ID when opening from incident
- [ ] Show related decisions in incident details
- [ ] Add decision count badge to incident table

**Files:**
- `src/components/IncidentTable.tsx` (modify)
- `src/components/IncidentDetailsModal.tsx` (modify, if exists)

#### Step 3.3: Admin Page
- [ ] Create `src/app/admin/decisions/page.tsx`
- [ ] Implement decision list with filters
- [ ] Add search functionality
- [ ] Add bulk operations (export, inquiry pack)
- [ ] Add decision statistics dashboard
- [ ] Add lock/unlock management (admin only)

**Files:**
- `src/app/admin/decisions/page.tsx` (new)

---

### Phase 4: Testing & Polish (Week 4)

#### Step 4.1: Unit Tests
- [ ] Test decision creation validation
- [ ] Test lock mechanism logic
- [ ] Test evidence upload handling
- [ ] Test inquiry pack generation

**Files:**
- `tests/decisions/` (new directory)

#### Step 4.2: Integration Tests
- [ ] Test API endpoints
- [ ] Test RLS policy enforcement
- [ ] Test file upload and storage
- [ ] Test decision linking to incidents

**Files:**
- `tests/decisions/api.test.ts` (new)
- `tests/decisions/rls.test.ts` (new)

#### Step 4.3: E2E Tests
- [ ] Test complete decision logging workflow
- [ ] Test locking and annotation workflow
- [ ] Test inquiry pack generation and download

**Files:**
- `tests/decisions/e2e.test.ts` (new)

#### Step 4.4: UI/UX Polish
- [ ] Review all components for accessibility
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Add tooltips and help text
- [ ] Mobile responsiveness check

#### Step 4.5: Documentation
- [ ] Update `FEATURE_CATALOGUE.md`
- [ ] Create user guide (`docs/USER_GUIDE_DECISIONS.md`)
- [ ] Update API documentation
- [ ] Add inline code comments

**Files:**
- `docs/USER_GUIDE_DECISIONS.md` (new)

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── decisions/
│   │       ├── route.ts                    # GET list, POST create
│   │       └── [id]/
│   │           ├── route.ts                # GET details, PUT update
│   │           ├── lock/
│   │           │   └── route.ts            # POST lock
│   │           ├── evidence/
│   │           │   └── route.ts            # POST add evidence
│   │           ├── annotations/
│   │           │   └── route.ts           # POST add annotation
│   │           └── inquiry-pack/
│   │               └── route.ts           # GET generate pack
│   └── admin/
│       └── decisions/
│           └── page.tsx                    # Admin decisions page
├── components/
│   └── decisions/
│       ├── DecisionLogger.tsx             # Create/edit decision modal
│       ├── DecisionTimeline.tsx            # Chronological timeline
│       ├── DecisionDetails.tsx             # Detailed view
│       └── DecisionEvidenceUpload.tsx      # Evidence upload component
├── lib/
│   └── reporting/
│       └── inquiryPack.ts                  # Inquiry pack generator
└── types/
    └── decisions.ts                         # TypeScript types

database/
└── decision_logging_migration.sql           # Database migration

docs/
├── FEATURE_3_DECISION_LOGGING_SPEC.md      # Technical spec
├── FEATURE_3_IMPLEMENTATION_ROADMAP.md     # This file
└── USER_GUIDE_DECISIONS.md                  # User guide (to be created)
```

---

## Dependencies to Install

```bash
# PDF generation (choose one)
npm install pdfkit @types/pdfkit
# OR
npm install jspdf
# OR
npm install puppeteer

# File upload handling (if not already installed)
npm install react-dropzone

# Form handling (if not already installed)
npm install react-hook-form @hookform/resolvers zod
```

---

## Testing Checklist

### Database
- [ ] Migration runs successfully
- [ ] RLS policies enforce company isolation
- [ ] Constraints prevent invalid data
- [ ] Indexes improve query performance
- [ ] Triggers update `updated_at` correctly

### API Endpoints
- [ ] GET `/api/decisions` returns correct data
- [ ] POST `/api/decisions` creates decision
- [ ] PUT `/api/decisions/[id]` updates unlocked decision
- [ ] PUT `/api/decisions/[id]` rejects locked decision update
- [ ] POST `/api/decisions/[id]/lock` locks decision
- [ ] POST `/api/decisions/[id]/evidence` uploads file
- [ ] POST `/api/decisions/[id]/annotations` adds annotation
- [ ] GET `/api/decisions/[id]/inquiry-pack` generates pack

### UI Components
- [ ] DecisionLogger form validates correctly
- [ ] DecisionTimeline displays decisions chronologically
- [ ] DecisionDetails shows all information
- [ ] Evidence upload works with drag & drop
- [ ] Lock confirmation dialog appears
- [ ] Annotations can be added to locked decisions

### Integration
- [ ] Dashboard widget displays correctly
- [ ] Incident details link to decisions
- [ ] Admin page filters work correctly

---

## Success Criteria

1. **Functionality**: All features from spec implemented and working
2. **Security**: RLS policies enforce company isolation
3. **Tamper-Evident**: Locked decisions cannot be edited
4. **Performance**: Decision lists load in < 1 second
5. **Usability**: Users can log a decision in < 2 minutes
6. **Reliability**: File uploads handle errors gracefully
7. **Documentation**: User guide and API docs complete

---

## Next Steps After Completion

1. **User Training**: Create training materials and conduct sessions
2. **Monitoring**: Set up analytics for decision logging usage
3. **Feedback Collection**: Gather user feedback for improvements
4. **Enhancements**: Plan future enhancements (templates, AI assistance, etc.)
5. **Integration**: Integrate with other features (Feature 1: Readiness Index, Feature 2: Doctrine Assistant)

---

## Notes

- This implementation establishes the foundation for other features that depend on decision logging
- The inquiry pack generator can be enhanced later with more formatting options
- Consider adding decision templates in a future iteration
- AI-assisted rationale generation could be added as an enhancement

