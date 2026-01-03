# Upgrade Prompts & Upsell Integration

## Overview

The feature gating system now includes multiple ways to prompt users to upgrade when they encounter locked features:

1. **Upgrade Modal** - Dialog popup (existing)
2. **Upgrade Card** - Inline card component (new)
3. **Upgrade Banner** - Prominent banner (new)
4. **Compact Upgrade** - Minimal inline prompt (new)

## Components

### UpgradeFeatureCard

A reusable component that displays upgrade prompts in different styles:

```typescript
import { UpgradeFeatureCard } from '@/components/ui/UpgradePlanModal'

<UpgradeFeatureCard
  featureName="Custom Dashboards"
  requiredPlan="operational"
  description="Build custom dashboards with drag-and-drop widgets"
  variant="card" // 'card' | 'banner' | 'compact'
  onUpgrade={() => router.push('/pricing')}
/>
```

**Variants:**
- `card` - Full card with header, description, and CTA button (default)
- `banner` - Horizontal banner with icon and upgrade button
- `compact` - Minimal inline prompt with lock icon

### Updated FeatureGate

The `FeatureGate` component now supports showing upgrade cards:

```typescript
<FeatureGate
  feature="custom-dashboards"
  plan={userPlan}
  showUpgradeCard={true}        // Show inline card instead of hiding
  upgradeCardVariant="card"     // 'card' | 'banner' | 'compact'
  upgradeCardDescription="..."  // Custom description
  showUpgradeModal={true}       // Also allow modal on click
  onUpgrade={() => {...}}       // Custom upgrade handler
>
  <CustomDashboardBuilder />
</FeatureGate>
```

## Implementation Examples

### Analytics Page - Custom Dashboards Tab

Shows a full card when the feature is locked:

```typescript
<FeatureGate 
  feature="custom-dashboards" 
  plan={userPlan} 
  showUpgradeCard={true}
  upgradeCardVariant="card"
  upgradeCardDescription="Build custom dashboards with drag-and-drop widgets, save layouts, and share with your team."
>
  <CustomDashboardBuilder />
</FeatureGate>
```

### Command Centre - Banner Style

Shows a prominent banner at the top:

```typescript
<FeatureGate 
  feature="command-centre" 
  plan={userPlan} 
  showUpgradeCard={true}
  upgradeCardVariant="banner"
  upgradeCardDescription="Get a map-based operational overview for multiple venues, real-time staff tracking, and advanced command capabilities."
>
  <StaffCommandCentre />
</FeatureGate>
```

### Multi-Event Dashboard - Banner Style

```typescript
<FeatureGate 
  feature="multi-event-management" 
  plan={userPlan} 
  showUpgradeCard={true}
  upgradeCardVariant="banner"
  upgradeCardDescription="Manage multiple concurrent events, switch between them seamlessly, and get a unified view of all your operations."
>
  <MultiEventDashboard />
</FeatureGate>
```

## Usage Guidelines

### When to Use Each Variant

**Card Variant** (`variant="card"`):
- Use for full-page features or sections
- When you want to provide detailed information
- Best for features that require explanation

**Banner Variant** (`variant="banner"`):
- Use at the top of locked feature pages
- When you want high visibility
- Good for premium features

**Compact Variant** (`variant="compact"`):
- Use in lists or sidebars
- When space is limited
- For quick upgrade prompts

**Modal** (`showUpgradeModal={true}`):
- Use when user clicks on locked content
- For interactive elements
- Can be combined with cards

### Best Practices

1. **Always provide context**: Use `upgradeCardDescription` to explain the value
2. **Make it actionable**: Ensure upgrade buttons are prominent and clear
3. **Don't block navigation**: Cards should inform, not prevent access to other features
4. **Test with different plans**: Verify cards appear correctly for each tier
5. **Track conversions**: Consider adding analytics to upgrade button clicks

## Customization

### Custom Upgrade Handler

```typescript
<FeatureGate
  feature="api-access"
  plan={userPlan}
  showUpgradeCard={true}
  onUpgrade={() => {
    // Track upgrade intent
    analytics.track('upgrade_prompt_clicked', {
      feature: 'api-access',
      currentPlan: userPlan
    })
    // Navigate to pricing
    router.push('/pricing?feature=api-access')
  }}
>
  <APIAccessSettings />
</FeatureGate>
```

### Styling

The upgrade cards use Tailwind classes and can be customized via the `className` prop on `UpgradeFeatureCard`:

```typescript
<UpgradeFeatureCard
  featureName="..."
  requiredPlan="..."
  className="my-custom-class"
/>
```

## Integration Status

✅ **Analytics Page** - Custom Dashboards tab shows upgrade card
✅ **Command Centre** - Shows upgrade banner
✅ **Multi-Event Dashboard** - Shows upgrade banner
⏳ **Dashboard** - Still uses modal (can be updated)
⏳ **Reports Page** - Still uses modal (can be updated)

## Next Steps

Consider adding upgrade cards to:
- Navigation menu items for locked features
- Feature lists/checklists
- Settings pages with premium options
- API documentation pages
- Integration pages


