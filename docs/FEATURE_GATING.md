# Feature Gating System

This document describes the tier-based feature gating system implemented in InCommand.

## Overview

The feature gating system allows you to restrict access to platform features based on subscription tiers (Starter, Operational, Command, Enterprise). Features are defined in a central matrix and can be checked throughout the application.

## Core Components

### 1. Feature Matrix (`src/config/FeatureMatrix.ts`)

Central catalog of all platform features with their tier access levels.

```typescript
import { FEATURE_MATRIX, FeatureKey } from '@/config/FeatureMatrix'

// Check if a feature exists
const feature = FEATURE_MATRIX['real-time-analytics']
// Returns: { name, description, tiers, category }
```

### 2. Feature Access Utilities (`src/lib/featureAccess.ts`)

Core utilities for checking feature availability.

```typescript
import { isFeatureEnabled, checkFeatureAccess } from '@/lib/featureAccess'
import { PlanCode } from '@/config/PricingConfig'

// Simple check
const enabled = isFeatureEnabled('operational', 'real-time-analytics')

// Detailed check with upgrade info
const access = checkFeatureAccess('starter', 'real-time-analytics')
// Returns: { enabled: false, requiredPlan: 'command', featureName: 'Real-Time Analytics' }
```

### 3. Feature Gate Component (`src/components/FeatureGate.tsx`)

React component wrapper for conditional feature rendering.

```typescript
import { FeatureGate } from '@/components/FeatureGate'

<FeatureGate 
  feature="real-time-analytics" 
  plan={userPlan}
  showUpgradeModal={true}
  fallback={<div>Feature locked</div>}
>
  <RealTimeAnalytics />
</FeatureGate>
```

### 4. Feature Gate Hook (`src/hooks/useFeatureGate.tsx`)

React hook for programmatic feature checking with upgrade modal support.

```typescript
import { useFeatureGate } from '@/hooks/useFeatureGate'

function MyComponent() {
  const { checkAccess, requireFeature, UpgradeModal } = useFeatureGate()
  
  const handleClick = () => {
    if (!requireFeature('real-time-analytics')) {
      // Upgrade modal will show automatically
      return
    }
    // Proceed with feature
  }
  
  return (
    <>
      {checkAccess('real-time-analytics') && <RealTimeAnalytics />}
      {UpgradeModal}
    </>
  )
}
```

### 5. Upgrade Plan Modal (`src/components/ui/UpgradePlanModal.tsx`)

Reusable modal component for prompting users to upgrade.

```typescript
import { UpgradePlanModal } from '@/components/ui/UpgradePlanModal'

<UpgradePlanModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  featureName="Real-Time Analytics"
  requiredPlan="command"
  onUpgrade={() => router.push('/pricing')}
/>
```

## Usage Examples

### Example 1: Conditional Rendering

```typescript
import { FeatureGate } from '@/components/FeatureGate'
import { useAuth } from '@/contexts/AuthContext'
import { getPlanCodeFromCompany } from '@/lib/planFeatures'

function Dashboard() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<PlanCode>('starter')
  
  useEffect(() => {
    async function loadPlan() {
      if (user?.id) {
        const profile = await getProfile(user.id)
        if (profile?.company_id) {
          const planCode = await getPlanCodeFromCompany(profile.company_id)
          setPlan(planCode || 'starter')
        }
      }
    }
    loadPlan()
  }, [user])
  
  return (
    <div>
      <FeatureGate feature="event-dashboard" plan={plan}>
        <EventDashboard />
      </FeatureGate>
      
      <FeatureGate 
        feature="real-time-analytics" 
        plan={plan}
        showUpgradeModal={true}
      >
        <RealTimeAnalytics />
      </FeatureGate>
    </div>
  )
}
```

### Example 2: Backend API Route

```typescript
import { isFeatureEnabled } from '@/lib/featureAccess'
import { getPlanCodeFromCompany } from '@/lib/planFeatures'

export async function GET(request: Request) {
  const companyId = request.headers.get('x-company-id')
  if (!companyId) return new Response('Unauthorized', { status: 401 })
  
  const plan = await getPlanCodeFromCompany(companyId)
  if (!isFeatureEnabled(plan || 'starter', 'api-access')) {
    return new Response('Feature not available on your plan', { status: 403 })
  }
  
  // Proceed with API logic
}
```

### Example 3: Navigation Menu

```typescript
import { isFeatureEnabled } from '@/lib/featureAccess'

const menuItems = [
  { key: 'dashboard', feature: 'event-dashboard' as FeatureKey },
  { key: 'analytics', feature: 'real-time-analytics' as FeatureKey },
  { key: 'command', feature: 'command-centre' as FeatureKey },
].filter(item => isFeatureEnabled(userPlan, item.feature))
```

## Admin Console

The admin pricing console (`/admin/pricing`) includes a Feature Availability Grid that shows which features are available in each tier. This helps administrators understand the feature matrix at a glance.

## Supabase Sync

To sync the feature matrix to your Supabase database:

```bash
# Set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_KEY=your_service_key

# Run sync script
npx tsx scripts/syncFeatureMatrix.ts
```

This updates the `plan_features` JSON column in the `subscription_plans` table for each tier.

## Adding New Features

1. Add the feature to `src/config/FeatureMatrix.ts`:
```typescript
'new-feature': {
  name: 'New Feature',
  description: 'Description of the feature',
  tiers: ['command', 'enterprise'],
  category: 'Category Name',
}
```

2. Create a stub component (if needed) in `src/components/features/new-feature/index.tsx`

3. Use the feature gate in your components:
```typescript
<FeatureGate feature="new-feature" plan={userPlan}>
  <NewFeatureComponent />
</FeatureGate>
```

4. Run the sync script to update the database

## Best Practices

1. **Always check features on both frontend and backend** - Frontend checks improve UX, backend checks ensure security
2. **Use FeatureGate for UI components** - Provides consistent UX and upgrade prompts
3. **Use isFeatureEnabled for conditional logic** - Simple boolean checks for programmatic access
4. **Show upgrade modals for locked features** - Helps convert users to higher tiers
5. **Keep feature matrix in sync** - Run sync script after adding/modifying features

## Troubleshooting

### Feature not showing up
- Check that the feature key matches exactly (case-sensitive)
- Verify the user's plan is correct
- Check browser console for errors

### Upgrade modal not appearing
- Ensure `showUpgradeModal={true}` is set on FeatureGate
- Check that the feature is actually locked for the user's plan
- Verify UpgradePlanModal is rendered in the component tree

### Backend checks failing
- Verify `getPlanCodeFromCompany` is working correctly
- Check that the plan code matches one of the valid tiers
- Ensure feature key is correctly typed as `FeatureKey`



