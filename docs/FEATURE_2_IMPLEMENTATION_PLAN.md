# Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine - Implementation Plan

## Overview

The Live Doctrine Assistant provides real-time monitoring of operational conditions and suggests SOP adjustments based on incident patterns, weather conditions, and other factors. It includes a dynamic SOP adjustment workflow where operators can accept, modify, or reject suggested changes.

## Prerequisites

- [x] Feature 1: Real-Time Operational Readiness Index (completed)
- [x] Feature 3: Decision Logging (completed)
- [x] Knowledge Base system exists (`knowledge_base` table)
- [ ] Green Guide integration available (`src/app/api/green-guide-search/`)

## Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1)

#### Step 1.1: Database Schema
- [ ] Create `sops` table for SOP templates and live SOPs
- [ ] Create `sop_adjustments` table for logging changes
- [ ] Create indexes for performance
- [ ] Set up RLS policies for company isolation

**Migration File:** `database/sop_system_migration.sql`

**Table Structure:**
- `sops`: Stores SOP templates and event-specific live SOPs
- `sop_adjustments`: Logs all adjustments with approval workflow

#### Step 1.2: TypeScript Types
- [ ] Create type definitions in `src/types/sops.ts`
- [ ] Export types for use across application

**File:** `src/types/sops.ts` (new)

#### Step 1.3: SOP Management API Routes
- [ ] Create `src/app/api/sops/route.ts` (GET list, POST create)
- [ ] Create `src/app/api/sops/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Create `src/app/api/sops/[id]/adjustments/route.ts` (GET, POST)
- [ ] Create `src/app/api/sops/[id]/apply/route.ts` (POST - apply adjustment)

**Files:**
- `src/app/api/sops/route.ts` (new)
- `src/app/api/sops/[id]/route.ts` (new)
- `src/app/api/sops/[id]/adjustments/route.ts` (new)
- `src/app/api/sops/[id]/apply/route.ts` (new)

#### Step 1.4: Doctrine Assistant Engine
- [ ] Create `src/lib/doctrine/assistant.ts`
- [ ] Implement condition monitoring (incidents, weather, crowd)
- [ ] Implement SOP suggestion logic
- [ ] Integrate with knowledge base search

**File:** `src/lib/doctrine/assistant.ts` (new)

---

### Phase 2: UI Components (Week 2)

#### Step 2.1: DoctrineAssistant Component
- [ ] Create `src/components/doctrine/DoctrineAssistant.tsx`
- [ ] Implement real-time monitoring display
- [ ] Show active SOPs and suggested adjustments
- [ ] Add Accept/Modify/Reject workflow

**File:** `src/components/doctrine/DoctrineAssistant.tsx` (new)

#### Step 2.2: SOP Management Page
- [ ] Create `src/app/settings/sops/page.tsx`
- [ ] Implement SOP template library
- [ ] Add SOP creation/editing forms
- [ ] Add SOP assignment to events

**File:** `src/app/settings/sops/page.tsx` (new)

#### Step 2.3: SOP Adjustment Modal
- [ ] Create `src/components/doctrine/SOPAdjustmentModal.tsx`
- [ ] Show suggested changes
- [ ] Allow modification before approval
- [ ] Add approval workflow

**File:** `src/components/doctrine/SOPAdjustmentModal.tsx` (new)

#### Step 2.4: Dashboard Integration
- [ ] Add DoctrineAssistant widget to Dashboard
- [ ] Show active SOPs and pending adjustments
- [ ] Add alert indicators for critical suggestions

**Files:**
- `src/components/Dashboard.tsx` (modify)

---

### Phase 3: Advanced Features (Week 3)

#### Step 3.1: Knowledge Base Integration
- [ ] Search knowledge base for SOP templates
- [ ] Link SOPs to Purple Guide/JESIP content
- [ ] Auto-suggest SOPs based on event type

#### Step 3.2: Pattern Detection
- [ ] Integrate with incident pattern analysis
- [ ] Trigger SOP suggestions based on patterns
- [ ] Learn from accepted/rejected adjustments

#### Step 3.3: Weather Integration
- [ ] Monitor weather conditions
- [ ] Suggest weather-specific SOP adjustments
- [ ] Alert on severe weather SOP triggers

---

### Phase 4: Testing & Polish (Week 4)

#### Step 4.1: Unit Tests
- [ ] Test SOP creation/editing
- [ ] Test adjustment workflow
- [ ] Test condition monitoring

#### Step 4.2: Integration Tests
- [ ] Test API endpoints
- [ ] Test RLS policies
- [ ] Test knowledge base integration

#### Step 4.3: UI/UX Polish
- [ ] Add loading states
- [ ] Add error states
- [ ] Mobile responsiveness
- [ ] Accessibility improvements

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── sops/
│   │       ├── route.ts                    # GET list, POST create
│   │       └── [id]/
│   │           ├── route.ts                # GET, PUT, DELETE
│   │           ├── adjustments/
│   │           │   └── route.ts            # GET, POST adjustments
│   │           └── apply/
│   │               └── route.ts            # POST apply adjustment
│   └── settings/
│       └── sops/
│           └── page.tsx                    # SOP management page
├── components/
│   └── doctrine/
│       ├── DoctrineAssistant.tsx           # Main assistant component
│       └── SOPAdjustmentModal.tsx          # Adjustment workflow modal
├── lib/
│   └── doctrine/
│       └── assistant.ts                    # Doctrine assistant engine
└── types/
    └── sops.ts                             # TypeScript types

database/
└── sop_system_migration.sql                # Database migration
```

---

## Success Criteria

1. **Functionality**: SOPs can be created, assigned, and adjusted
2. **Real-time**: Assistant monitors conditions and suggests adjustments
3. **Workflow**: Accept/Modify/Reject workflow works correctly
4. **Integration**: Knowledge base search works for SOP templates
5. **Usability**: Operators can quickly review and act on suggestions

