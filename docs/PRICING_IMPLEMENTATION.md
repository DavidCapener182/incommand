# Pricing Overhaul Implementation Summary

## Overview

This document summarizes the pricing overhaul implementation for InCommand, aligning the platform's pricing structure with market research and competitor analysis.

## Pricing Tiers Summary

Based on competitor analysis (Eventify, Swoogo, Chronosoft, 24/7 Software), the following pricing tiers have been implemented:

| Tier | Monthly Price | Annual Price | Event Limit | Attendee Cap | Staff Users | Key Features |
|------|--------------|--------------|-------------|--------------|-------------|--------------|
| **Starter** | £49 | £490 | 2 events | 500 | 3 users, 5 staff | Event dashboard, basic incident management, staff scheduling, email notifications, mobile app, basic analytics, email support |
| **Operational** | £129 | £1,290 | 10 events | 2,000 | 10 users, 20 staff | Everything in Starter + advanced reporting, SMS alerts, API access, custom branding, priority support, advanced analytics, multi-event management |
| **Command** | £249 | £2,490 | 25 events | 5,000 | 25 users, 50 staff | Everything in Operational + AI-powered insights, advanced analytics suite, custom integrations, on-site tools, real-time dashboards, predictive analytics, custom workflows |
| **Enterprise** | Custom | Custom | Unlimited | Unlimited | Unlimited | Everything in Command + dedicated account manager, SLA guarantee (99.9%), advanced security suite, white-label options, on-premise deployment, custom development, priority 24/7 support |

## Implementation Details

### 1. Centralized Pricing Configuration

**File**: `src/config/PricingConfig.ts`

- Single source of truth for all pricing plans
- Type-safe plan definitions with features and limits
- Helper functions for plan validation and feature checking
- Supports versioning and metadata

**Key Functions**:
- `getPlan(code)` - Get plan by code
- `getPlanFeatures(code)` - Get plan features
- `canCreateEvent(planCode, currentCount)` - Check event creation limits
- `canCreateUser(planCode, currentCount)` - Check user creation limits
- `withinAttendeeLimit(planCode, count)` - Check attendee limits

### 2. Database Schema

**Migration**: `database/pricing_plans_migration.sql`

- Created `subscription_plans` table with versioning support
- Added `plan_features` JSONB column to `companies` table
- Updated CHECK constraints to support new plan codes
- Seeded default plans with market-aligned pricing

**Key Features**:
- Version tracking for pricing changes
- Effective date support for future pricing
- Multi-currency support (GBP, USD, EUR)
- Billing cycle support (monthly, annual)

### 3. Backend Plan Management

**Files**:
- `src/lib/subscriptions.ts` - Extended with plan management functions
- `src/lib/planFeatures.ts` - New file for feature enforcement utilities
- `src/app/api/admin/pricing/route.ts` - Admin API for pricing management
- `src/app/api/billing/plans/route.ts` - Updated to use new pricing structure

**Key Features**:
- Plan code mapping (legacy → new codes)
- Feature enforcement utilities
- Usage metrics tracking
- Secure admin endpoints with audit logging

### 4. Admin Pricing Console

**Files**:
- `src/app/admin/pricing/page.tsx` - Main pricing management page
- `src/components/admin/pricing/PricingPlansManager.tsx` - Plan management component

**Features**:
- View all plans with pricing and features
- Edit plan pricing (monthly/annual)
- Toggle plan active/deprecated status
- View plan version history
- Real-time updates with optimistic UI

### 5. Signup Flow Enhancement

**Files**:
- `src/app/signup/page.tsx` - Updated with plan selection
- `src/app/signup/actions.ts` - Server action for company creation with plan

**Features**:
- Plan selection dropdown during signup
- Automatic company creation with selected plan
- Plan features automatically provisioned
- User assigned as company admin

### 6. Updated Components

**Files Updated**:
- `src/components/admin/companies/CompanyEditDialogButton.tsx` - Uses new plan codes
- `src/components/admin/companies/AddCompanyButton.tsx` - Uses new plan codes
- `src/components/navigation/SuperAdminNav.tsx` - Added pricing link
- `src/data/marketingPlans.ts` - Now derives from PricingConfig
- `src/lib/multi-tenant/organizationManager.ts` - Uses PricingConfig

## Plan Enforcement

Plan limits are enforced through utility functions:

```typescript
// Check if company can create event
const canCreate = await canCompanyCreateEvent(companyId, currentEventCount)

// Check if within attendee limit
const withinLimit = await isCompanyWithinAttendeeLimit(companyId, attendeeCount)

// Check if can create user
const canAddUser = await canCompanyCreateUser(companyId, currentUserCount)
```

## Migration Path

1. **Run Database Migration**: Execute `database/pricing_plans_migration.sql` in Supabase
2. **Update Existing Companies**: Legacy plans (`trial`, `basic`, `premium`) are automatically mapped:
   - `trial`/`basic` → `starter`
   - `premium`/`professional` → `operational`
3. **Verify Plan Features**: Check that `plan_features` JSONB column is populated for existing companies

## Next Steps

1. **Integration Testing**: Add tests for plan enforcement functions
2. **Stripe Integration**: Connect pricing plans to Stripe products/subscriptions
3. **Usage Analytics**: Implement telemetry hooks for plan usage metrics
4. **Plan Upgrade Flow**: Build UI for companies to upgrade/downgrade plans
5. **Billing Automation**: Set up automated billing based on plan pricing

## API Endpoints

### Admin Pricing Management
- `GET /api/admin/pricing` - List all plans (super admin only)
- `PATCH /api/admin/pricing` - Update plan pricing/features (super admin only)

### Billing Plans
- `GET /api/billing/plans` - Get active plans (billing manager+)

## Security

- All pricing updates require `super_admin` role
- Audit logging for all pricing changes
- RLS policies on `subscription_plans` table
- Plan enforcement at application level

## Notes

- Legacy plan codes (`trial`, `basic`, `premium`) are still supported for backward compatibility
- Enterprise plan uses custom pricing (null in database)
- Plan features are stored as JSONB for flexibility
- Versioning allows future pricing changes without breaking existing subscriptions

