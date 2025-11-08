# Missing Features - Quick Reference

## 🚨 High Priority (Build First)

### 1. Task Dispatch & Assignment
- **Feature Key**: `task-dispatch`
- **Plans**: Operational, Command, Enterprise
- **Status**: ❌ Stub only
- **Location**: `src/components/features/task-dispatch/index.tsx`
- **What to Build**: Task creation, assignment to staff, real-time tracking, completion workflow

### 2. Real-Time Incident Dashboard
- **Feature Key**: `real-time-incident-dashboard`
- **Plans**: Operational, Command, Enterprise
- **Status**: ⚠️ Partial (real-time exists in Dashboard, need dedicated map view)
- **Location**: `src/components/features/real-time-incident-dashboard/index.tsx`
- **What to Build**: Map-based dashboard with live incident markers, geolocation visualization

## 📅 Medium Priority

### 3. Venue Calendar
- **Feature Key**: `venue-calendar`
- **Plans**: All tiers (Starter+)
- **Status**: ❌ Stub only
- **Location**: `src/components/features/venue-calendar/index.tsx`
- **What to Build**: Calendar UI, venue availability, booking management

### 4. Offline Mode
- **Feature Key**: `offline-mode`
- **Plans**: Command, Enterprise
- **Status**: ⚠️ Partial (logic exists, needs UI)
- **Location**: `src/components/features/offline-mode/index.tsx`
- **What to Build**: Offline UI, sync queue management, conflict resolution

### 5. Real-Time Analytics
- **Feature Key**: `real-time-analytics`
- **Plans**: Command, Enterprise
- **Status**: ⚠️ Partial (components exist, needs dedicated view)
- **Location**: `src/components/features/real-time-analytics/index.tsx`
- **What to Build**: Dedicated real-time analytics page with live charts

### 6. SSO Integration
- **Feature Key**: `sso-integration`
- **Plans**: Command, Enterprise
- **Status**: ❌ Stub only
- **Location**: `src/components/features/sso-integration/index.tsx`
- **What to Build**: Azure AD/Okta configuration UI, SSO login flow

## 🔧 Enhancement Needed

### 7. Multi-Event Management
- **Feature Key**: `multi-event-management`
- **Plans**: Command, Enterprise
- **Status**: ⚠️ Partial (component exists, uses mock data)
- **Location**: `src/components/MultiEventDashboard.tsx`
- **What to Build**: Backend integration, real data fetching

### 8. Mobile Access
- **Feature Key**: `mobile-access`
- **Plans**: Operational, Command, Enterprise
- **Status**: ⚠️ Partial (shell exists, needs refinement)
- **Location**: `src/app/mobile/`
- **What to Build**: Mobile UI/UX refinement, touch optimizations

## 💼 Enterprise Features (Lower Priority)

### 9. Zapier Integration
- **Feature Key**: `zapier-integration`
- **Plans**: Command, Enterprise
- **Status**: ❌ Stub only
- **Location**: `src/components/features/zapier-integration/index.tsx`

### 10. Custom Domain
- **Feature Key**: `custom-domain`
- **Plans**: Command, Enterprise
- **Status**: ❌ Stub only
- **Location**: `src/components/features/custom-domain/index.tsx`

### 11. White-Labelling
- **Feature Key**: `white-labelling`
- **Plans**: Command, Enterprise
- **Status**: ⚠️ Partial (theming exists, needs UI)
- **Location**: Theming system exists, needs config UI

## 📋 Implementation Checklist

- [ ] Task Dispatch & Assignment (High Priority)
- [ ] Real-Time Incident Dashboard (High Priority)
- [ ] Venue Calendar (Medium Priority)
- [ ] Offline Mode UI (Medium Priority)
- [ ] Real-Time Analytics Page (Medium Priority)
- [ ] SSO Integration (Medium Priority)
- [ ] Multi-Event Management Backend (Enhancement)
- [ ] Mobile Access Refinement (Enhancement)
- [ ] Zapier Integration (Low Priority)
- [ ] Custom Domain (Low Priority)
- [ ] White-Labelling UI (Low Priority)

## Next Steps

1. **Start with Task Dispatch** - Core operational feature, high value
2. **Then Real-Time Incident Dashboard** - High-value Operational+ feature
3. **Venue Calendar** - Available on all tiers, good UX improvement
4. **Complete partial implementations** - Offline Mode, Real-Time Analytics
5. **Enterprise features** - SSO, Custom Domain, White-Labelling

See `docs/MISSING_FEATURES.md` for detailed implementation requirements for each feature.


