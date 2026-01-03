# Feature 1: Real-Time Operational Readiness Index - Implementation Plan

## Overview

The Real-Time Operational Readiness Index provides a live, comprehensive score (0-100) indicating how ready the event operation is to handle current and predicted conditions. It aggregates multiple factors including staffing, incidents, weather, transport, assets, and crowd density.

## Prerequisites

- [x] Feature 3: Decision Logging (completed)
- [ ] Database access to `staff`, `staff_assignments`, `incident_logs`, `events` tables
- [ ] Weather API integration (`src/app/api/weather/`)
- [ ] Transport feed integration (if available)
- [ ] Asset management system (or placeholder)

## Implementation Phases

### Phase 1: Database & Calculation Engine (Week 1)

#### Step 1.1: Database Schema
- [ ] Create `operational_readiness` table for historical scores
- [ ] Create indexes for performance
- [ ] Set up RLS policies for company isolation
- [ ] Create triggers for automatic score updates (optional)

**Migration File:** `database/operational_readiness_migration.sql`

**Table Structure:**
```sql
CREATE TABLE operational_readiness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Overall Score
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Component Scores (0-100 each)
  staffing_score INTEGER NOT NULL,
  incident_pressure_score INTEGER NOT NULL,
  weather_score INTEGER NOT NULL,
  transport_score INTEGER NOT NULL,
  asset_status_score INTEGER NOT NULL,
  crowd_density_score INTEGER NOT NULL,
  
  -- Component Details (JSONB for flexibility)
  staffing_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  incident_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  weather_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  transport_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  asset_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  crowd_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  calculated_by_user_id UUID REFERENCES auth.users(id),
  calculation_version VARCHAR(50) DEFAULT '1.0',
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_operational_readiness_event_id ON operational_readiness(event_id);
CREATE INDEX idx_operational_readiness_timestamp ON operational_readiness(timestamp DESC);
CREATE INDEX idx_operational_readiness_company_id ON operational_readiness(company_id);
CREATE INDEX idx_operational_readiness_score ON operational_readiness(overall_score);

-- RLS Policies
ALTER TABLE operational_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view readiness scores for their company"
  ON operational_readiness FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert readiness scores for their company"
  ON operational_readiness FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_operational_readiness_updated_at
  BEFORE UPDATE ON operational_readiness
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Step 1.2: Readiness Calculation Engine
- [ ] Create `src/lib/analytics/readinessEngine.ts`
- [ ] Implement staffing score calculation
- [ ] Implement incident pressure score calculation
- [ ] Implement weather score calculation
- [ ] Implement transport score calculation
- [ ] Implement asset status score calculation
- [ ] Implement crowd density score calculation
- [ ] Implement overall score aggregation with weights

**File:** `src/lib/analytics/readinessEngine.ts`

**Key Functions:**
- `calculateStaffingScore(eventId, companyId)` - Staff on post vs planned
- `calculateIncidentPressureScore(eventId)` - Current incident load vs capacity
- `calculateWeatherScore(eventId)` - Weather conditions impact
- `calculateTransportScore(eventId)` - Transport/ingress-egress status
- `calculateAssetStatusScore(eventId)` - Infrastructure/assets operational
- `calculateCrowdDensityScore(eventId)` - Current vs capacity
- `calculateOverallReadiness(eventId)` - Weighted aggregation

**Scoring Logic:**
- **Staffing (25% weight):** Based on staff on post vs planned, competency match
- **Incident Pressure (25% weight):** Based on open incidents, response times, escalation levels
- **Weather (15% weight):** Based on current conditions, forecasts, alerts
- **Transport (10% weight):** Based on ingress/egress flow, delays, capacity
- **Assets (10% weight):** Based on critical infrastructure status
- **Crowd Density (15% weight):** Based on current occupancy vs capacity, flow patterns

#### Step 1.3: API Endpoint
- [ ] Create `src/app/api/analytics/readiness-index/route.ts`
- [ ] Implement GET endpoint for current readiness
- [ ] Implement GET endpoint for historical readiness
- [ ] Add caching (5-minute cache)
- [ ] Add error handling

**File:** `src/app/api/analytics/readiness-index/route.ts`

**Endpoints:**
- `GET /api/analytics/readiness-index?event_id={id}` - Current readiness score
- `GET /api/analytics/readiness-index?event_id={id}&historical=true&hours=24` - Historical scores

**Response Format:**
```typescript
{
  success: boolean,
  readiness: {
    overall_score: number,
    component_scores: {
      staffing: number,
      incident_pressure: number,
      weather: number,
      transport: number,
      assets: number,
      crowd_density: number
    },
    component_details: {
      staffing: { on_post: number, planned: number, ... },
      incident_pressure: { open_incidents: number, ... },
      weather: { conditions: string, alerts: [] },
      transport: { ingress_status: string, ... },
      assets: { operational: number, total: number },
      crowd_density: { current: number, capacity: number, percentage: number }
    },
    trend: 'improving' | 'stable' | 'declining',
    alerts: Array<{ type: string, message: string, severity: 'low' | 'medium' | 'high' }>,
    last_calculated: string,
    next_update: string
  }
}
```

---

### Phase 2: UI Components (Week 2)

#### Step 2.1: ReadinessIndexCard Component
- [ ] Create `src/components/analytics/ReadinessIndexCard.tsx`
- [ ] Display overall score with color coding (green/yellow/red)
- [ ] Show component breakdown (expandable)
- [ ] Display trend indicator
- [ ] Show alerts/warnings
- [ ] Add click-to-view-details

**File:** `src/components/analytics/ReadinessIndexCard.tsx`

**Features:**
- Large overall score display (0-100)
- Color-coded status (Green: 80+, Yellow: 60-79, Red: <60)
- Component score breakdown (collapsible)
- Trend arrow (improving/stable/declining)
- Alert badges for critical issues
- Last updated timestamp
- Refresh button

#### Step 2.2: Readiness Details Modal
- [ ] Create `src/components/analytics/ReadinessDetailsModal.tsx`
- [ ] Show detailed breakdown of each component
- [ ] Display historical trend chart
- [ ] Show recommendations for improvement
- [ ] Display contributing factors

**File:** `src/components/analytics/ReadinessDetailsModal.tsx`

**Features:**
- Detailed component scores with explanations
- Historical trend graph (last 24 hours)
- Recommendations for each component
- Contributing factors breakdown
- Export functionality

#### Step 2.3: Dashboard Integration
- [ ] Add ReadinessIndexCard to Dashboard
- [ ] Position in prominent location (top section)
- [ ] Add to event-specific card layouts
- [ ] Ensure responsive design

**Files:**
- `src/components/Dashboard.tsx` (modify)
- `src/components/dashboard/DynamicDashboardCards.tsx` (modify)

**Integration Points:**
- Add to Dashboard header section (alongside CurrentEvent, TimeCard)
- Add to event-specific card grids
- Ensure real-time updates (poll every 30 seconds)

---

### Phase 3: Advanced Features (Week 3)

#### Step 3.1: Alert System
- [ ] Create alert thresholds (configurable)
- [ ] Implement alert generation logic
- [ ] Add alert notifications
- [ ] Create alert history

**Alert Thresholds:**
- Critical: Overall score < 50
- Warning: Overall score < 60
- Component-specific alerts (e.g., staffing < 70%)

#### Step 3.2: Historical Analysis
- [ ] Create readiness history API endpoint
- [ ] Build trend analysis component
- [ ] Add comparison with similar events
- [ ] Generate readiness reports

#### Step 3.3: Predictive Readiness
- [ ] Integrate with predictive analytics
- [ ] Forecast readiness for next 1-4 hours
- [ ] Show predicted component changes
- [ ] Alert on predicted drops

---

### Phase 4: Testing & Polish (Week 4)

#### Step 4.1: Unit Tests
- [ ] Test calculation engine logic
- [ ] Test score aggregation
- [ ] Test component score calculations

#### Step 4.2: Integration Tests
- [ ] Test API endpoints
- [ ] Test RLS policies
- [ ] Test real-time updates

#### Step 4.3: UI/UX Polish
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Mobile responsiveness
- [ ] Accessibility improvements

---

## File Structure

```
src/
├── app/
│   └── api/
│       └── analytics/
│           └── readiness-index/
│               └── route.ts                    # GET current/historical readiness
├── components/
│   ├── analytics/
│   │   ├── ReadinessIndexCard.tsx             # Main card component
│   │   └── ReadinessDetailsModal.tsx          # Detailed view modal
│   └── Dashboard.tsx                          # (modify) Add card
├── lib/
│   └── analytics/
│       └── readinessEngine.ts                  # Calculation engine
└── types/
    └── readiness.ts                            # TypeScript types

database/
└── operational_readiness_migration.sql         # Database migration
```

---

## Dependencies

No new dependencies required - uses existing:
- Supabase client
- React hooks
- Chart.js (for trend graphs, if needed)
- Existing UI components

---

## Success Criteria

1. **Accuracy**: Readiness score reflects actual operational state
2. **Performance**: Calculation completes in < 2 seconds
3. **Real-time**: Updates every 30 seconds during live events
4. **Usability**: Score is immediately understandable
5. **Actionable**: Alerts and recommendations are clear and useful

---

## Next Steps

1. Create database migration
2. Build calculation engine
3. Create API endpoint
4. Build UI components
5. Integrate into Dashboard
6. Test and refine

