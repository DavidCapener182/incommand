# Missing Features - Implementation Roadmap

This document lists all features from `FEATURE_MATRIX` that are **not yet fully implemented** and need to be built.

## ❌ Features Requiring Full Implementation (7 features)

### Core Platform

#### 1. **Venue Calendar** (`venue-calendar`)
- **Status**: ❌ Stub only
- **Stub Location**: `src/components/features/venue-calendar/index.tsx`
- **Required Plans**: Starter, Operational, Command, Enterprise
- **Description**: Visual schedule of booked and available venue dates
- **What's Needed**:
  - Calendar UI component (month/week/day views)
  - Integration with `events` table
  - Venue availability checking
  - Booking conflict detection
  - Visual indicators for booked/available dates
  - Filtering by venue, date range
- **Related Tables**: `events` table (has `start_date`, `end_date`, `venue_name`)
- **Priority**: Medium (available on all tiers)

### Incident & Crowd Management

#### 2. **Real-Time Incident Dashboard** (`real-time-incident-dashboard`)
- **Status**: ⚠️ Partial - Real-time updates exist in Dashboard, but dedicated view is stub
- **Stub Location**: `src/components/features/real-time-incident-dashboard/index.tsx`
- **Required Plans**: Operational, Command, Enterprise
- **Description**: Live feed of incidents with geolocation and status tracking
- **What's Needed**:
  - Dedicated real-time dashboard page/component
  - Map view with incident markers
  - Live incident feed with auto-refresh
  - Geolocation visualization
  - Status tracking indicators
  - Filtering and search
- **Existing**: Dashboard has real-time updates via websockets, but no dedicated map-based view
- **Priority**: High (Operational+ feature)

#### 3. **Task Dispatch & Assignment** (`task-dispatch`)
- **Status**: ❌ Stub only
- **Stub Location**: `src/components/features/task-dispatch/index.tsx`
- **Required Plans**: Operational, Command, Enterprise
- **Description**: Allocate and monitor field staff tasks in real time
- **What's Needed**:
  - Task creation UI
  - Task assignment to staff members
  - Real-time task status tracking
  - Task priority management
  - Task completion workflow
  - Task history and audit trail
- **Related**: `src/components/StaffingCentre.tsx` has staff assignment but not task dispatch
- **Related API**: `src/app/api/staff-assignment/route.ts` exists but is for incident assignment
- **Priority**: High (Operational+ feature)

### Mobile & Field Access

#### 4. **Offline Mode** (`offline-mode`)
- **Status**: ⚠️ Partial - Logic exists, UI is stub
- **Stub Location**: `src/components/features/offline-mode/index.tsx`
- **Required Plans**: Command, Enterprise
- **Description**: Allow offline data capture, syncing once reconnected
- **What's Needed**:
  - Offline mode UI/indicator
  - Local storage/IndexedDB for offline data
  - Sync queue management UI
  - Conflict resolution UI
  - Offline status indicator
- **Existing**: `src/hooks/useOffline.ts`, `src/lib/offlineSync.ts`, `src/app/offline/page.tsx`
- **Priority**: Medium (Command+ feature)

### Analytics

#### 5. **Real-Time Analytics** (`real-time-analytics`)
- **Status**: ⚠️ Partial - Components exist but may need dedicated view
- **Stub Location**: `src/components/features/real-time-analytics/index.tsx`
- **Required Plans**: Command, Enterprise
- **Description**: Live occupancy and event trend dashboards
- **What's Needed**:
  - Dedicated real-time analytics page/view
  - Live occupancy tracking
  - Real-time event trend visualization
  - Auto-refreshing charts
  - Live metrics dashboard
- **Existing**: `src/components/analytics/RealtimeAnalyticsDashboard.tsx`, `src/hooks/useRealtimeAnalytics.ts`
- **Priority**: Medium (Command+ feature)

### Integrations

#### 6. **Zapier Integration** (`zapier-integration`)
- **Status**: ❌ Stub only
- **Stub Location**: `src/components/features/zapier-integration/index.tsx`
- **Required Plans**: Command, Enterprise
- **Description**: Connect with Zapier to automate workflows
- **What's Needed**:
  - Zapier app creation/configuration
  - Webhook endpoint for Zapier triggers
  - Zapier action endpoints
  - Integration settings UI
  - Connection management
  - Trigger/action configuration
- **Related**: Webhook system exists (`src/lib/integrations/webhookService.ts`, `database/integrations_migration.sql`)
- **Priority**: Low (Command+ feature, nice-to-have)

### Security

#### 7. **SSO Integration** (`sso-integration`)
- **Status**: ❌ Stub only
- **Stub Location**: `src/components/features/sso-integration/index.tsx`
- **Required Plans**: Command, Enterprise
- **Description**: Authenticate via AzureAD or Okta
- **What's Needed**:
  - SSO provider configuration UI
  - Supabase SSO setup (Supabase supports SAML/OAuth)
  - Azure AD integration
  - Okta integration
  - SSO login flow
  - User provisioning from SSO
- **Related**: Supabase Auth supports SSO/SAML
- **Priority**: Medium (Command+ feature, enterprise requirement)

### Branding

#### 8. **Custom Domain** (`custom-domain`)
- **Status**: ❌ Stub only
- **Stub Location**: `src/components/features/custom-domain/index.tsx`
- **Required Plans**: Command, Enterprise
- **Description**: Serve the app under client-specific domain and SSL
- **What's Needed**:
  - Domain configuration UI
  - DNS verification flow
  - SSL certificate management
  - Domain mapping to companies/organizations
  - Custom domain routing logic
- **Related**: Admin settings page has domain section (`src/app/admin/settings/page.tsx`)
- **Priority**: Low (Command+ feature, infrastructure-heavy)

## ⚠️ Features Needing Enhancement/Integration (3 features)

### Core Platform

#### 9. **Multi-Event Management** (`multi-event-management`)
- **Status**: ⚠️ Partial - Component exists but uses mock data
- **Component**: `src/components/MultiEventDashboard.tsx`
- **Required Plans**: Command, Enterprise
- **What's Needed**:
  - Backend integration with real events data
  - Event switching functionality
  - Multi-event filtering and search
  - Event comparison views
  - Cross-event analytics
- **Priority**: Medium

### Mobile & Field Access

#### 10. **Mobile Access** (`mobile-access`)
- **Status**: ⚠️ Partial - Mobile shell exists but needs refinement
- **Location**: `src/app/mobile/`
- **Required Plans**: Operational, Command, Enterprise
- **What's Needed**:
  - Complete mobile UI/UX refinement
  - Mobile-optimized navigation
  - Touch-friendly interactions
  - Mobile-specific features
  - PWA enhancements
- **Priority**: Medium

### Branding

#### 11. **White-Labelling** (`white-labelling`)
- **Status**: ⚠️ Partial - Theming system exists, needs dedicated UI
- **Related**: `src/lib/branding/themingSystem.ts`
- **Required Plans**: Command, Enterprise
- **What's Needed**:
  - White-label configuration UI
  - Logo upload and management
  - Color scheme customization
  - Branding preview
  - Remove InCommand branding option
- **Priority**: Low

## 📊 Summary

### By Status
- **❌ Stub Only (Need Full Build)**: 7 features
- **⚠️ Partial (Need Integration/Enhancement)**: 3 features
- **✅ Fully Implemented**: 15 features

### By Priority

**High Priority** (Operational+ features, core functionality):
1. Real-Time Incident Dashboard
2. Task Dispatch & Assignment

**Medium Priority** (Available on multiple tiers or important features):
3. Venue Calendar
4. Offline Mode
5. Real-Time Analytics
6. SSO Integration
7. Multi-Event Management (backend integration)
8. Mobile Access (refinement)

**Low Priority** (Command+ features, nice-to-have):
9. Zapier Integration
10. Custom Domain
11. White-Labelling

### By Category

**Core Platform**: 2 features (Venue Calendar, Multi-Event Management)
**Crowd Management**: 2 features (Real-Time Incident Dashboard, Task Dispatch)
**Field Access**: 2 features (Offline Mode, Mobile Access)
**Analytics**: 1 feature (Real-Time Analytics)
**Integrations**: 1 feature (Zapier)
**Security**: 1 feature (SSO)
**Branding**: 2 features (Custom Domain, White-Labelling)

## Implementation Recommendations

### Phase 1: High-Priority Features
1. **Task Dispatch & Assignment** - Core operational feature
2. **Real-Time Incident Dashboard** - High-value Operational+ feature

### Phase 2: Medium-Priority Features
3. **Venue Calendar** - Available on all tiers, good UX improvement
4. **Offline Mode** - Complete the existing implementation
5. **Real-Time Analytics** - Enhance existing components
6. **Multi-Event Management** - Backend integration

### Phase 3: Enterprise Features
7. **SSO Integration** - Enterprise requirement
8. **Custom Domain** - Enterprise branding
9. **White-Labelling** - Enterprise branding
10. **Zapier Integration** - Nice-to-have automation

### Phase 4: Polish
11. **Mobile Access** - Refinement and optimization


