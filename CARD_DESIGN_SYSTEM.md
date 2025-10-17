# Card Design System - Centralized Styling

## Overview

All card styling across the inCommand application is now centralized in `src/app/globals.css`. To change the card design system, simply update the CSS utility classes in that file, and all cards will automatically update.

## Available Card Classes

### `.card-depth`
**Primary card styling** - Use for most cards throughout the application.
- Background: White (light mode), #1b203b (dark mode)
- Border: Subtle with transparency
- Shadow: `shadow-2` with `hover:shadow-3`
- Border radius: `rounded-2xl`

**Used in:**
- Dashboard stat cards
- Analytics KPI cards  
- Weather cards
- General content cards
- Base Card component (`src/components/ui/card.tsx`)

### `.card-depth-interactive`
**Interactive cards** - Currently identical to `.card-depth`, kept for semantic clarity.

**Used in:**
- Cards that have click handlers
- Filterable stat cards

### `.card-depth-subtle`
**Nested or less prominent cards** - Lighter shadow for secondary elements.
- Background: White (light mode), #1b203b (dark mode)
- Shadow: `shadow-1` with `hover:shadow-2`
- Border radius: `rounded-xl` (slightly less rounded)

**Used in:**
- Nested cards within other cards
- Status buttons in IncidentSummaryBar
- Secondary information cards

### `.card-table-row`
**Table row cards** - Minimal shadow for dense layouts.
- Background: White (light mode), #23408e (dark mode) - special blue tint
- Shadow: `shadow-1` with `hover:shadow-2`
- Border radius: `rounded-xl`

**Used in:**
- IncidentTable row cards
- List items in table views

### `.card-modal`
**Modal and dialog cards** - Prominent depth for overlays.
- Background: White (light mode), #1b203b (dark mode)
- Shadow: `shadow-3` (no hover change)
- Border radius: `rounded-2xl`

**Used in:**
- GuidedActionsModal
- IncidentDetailsModal dialog panels
- Any modal/dialog content containers

### `.card-skeleton`
**Loading state cards** - Animated pulsing cards.
- Inherits all styles from `.card-depth`
- Adds: `animate-pulse`

**Used in:**
- StatCardSkeleton in Dashboard
- CardSkeleton loading states
- Any skeleton screen card

### `.card-time`
**Time and status cards** - Special colored background for emphasis.
- Background: White (light mode), #23408e (dark mode) - special blue tint
- Shadow: `shadow-2` with `hover:shadow-3`
- Border radius: `rounded-2xl`

**Used in:**
- TimeCard in Dashboard
- TimeCardSkeleton
- Time-sensitive status displays

### `.card-control`
**View toggle and control cards** - For UI controls.
- Background: White (light mode), #1b203b (dark mode)
- Shadow: `shadow-2` (no hover change for controls)
- Border radius: `rounded-lg`

**Used in:**
- View toggle buttons in IncidentTable
- Control panels
- Settings toggles

### `.card-board`
**Board view containers** - Maximum depth for board layouts.
- Background: White (light mode), #1b203b (dark mode)
- Shadow: `shadow-3` (prominent)
- Border radius: `rounded-2xl`

**Used in:**
- CollaborationBoard container
- Kanban board views
- Large container cards

### `.card-alt`
**Alternative cards** - For specialized components with gray-800 dark mode.
- Background: White (light mode), gray-800 (dark mode)
- Shadow: `shadow-sm` with `hover:shadow-md`
- Border radius: `rounded-xl`

**Used in:**
- Specialized components (radio systems, tags, etc.)
- Components with specific gray-800 requirements
- Third-party integrated components

## Color System

### Page Background
- Light mode: `#d1d5db` (darker gray for card contrast)
- Dark mode: `#0f1419` (very dark blue-black)

### Card Backgrounds
- **Primary**: `#ffffff` (white) / `#1b203b` (dark blue)
- **Special (time/table)**: `#ffffff` (white) / `#23408e` (medium blue)
- **Alternative**: `#ffffff` (white) / `gray-800` (standard gray)

### Shadows (Tailwind Extended)
- `shadow-0`: None
- `shadow-1`: Subtle (`0 1px 2px rgba(0, 0, 0, 0.05)`)
- `shadow-2`: Default (`0 4px 6px rgba(0, 0, 0, 0.08)`)
- `shadow-3`: Prominent (`0 8px 12px rgba(0, 0, 0, 0.12)`)
- `shadow-neumorphic`: Soft inset/outset effect
- `shadow-neumorphic-dark`: Dark mode neumorphic

## Components Updated

### ✅ Fully Converted to CSS Classes

1. **src/components/ui/card.tsx** - Base Card component
2. **src/components/Dashboard.tsx** - All cards and skeletons
3. **src/components/IncidentSummaryBar.tsx** - Summary card
4. **src/components/IncidentTable.tsx** - Table rows, controls, board view
5. **src/components/CurrentEvent.tsx** - Event card
6. **src/components/GuidedActionsModal.tsx** - Dialog content
7. **src/components/IncidentDetailsModal.tsx** - Modal panel
8. **src/components/StaffingCentre.tsx** - Header card

### ✅ Using Card Component (Auto-inherits styling)

- WeatherCard.tsx
- AnalyticsKPICards.tsx  
- IncidentTypeCategories.tsx
- EventMessagesPanel.tsx
- What3WordsSearchCard.tsx
- VenueOccupancy.tsx

### ❌ Excluded (User Request)

- **IncidentCreationModal.tsx** - Excluded per user request

### 📝 Specialized (Custom Styling Retained)

- HelpCenterModal.tsx - Uses transparent/blur effects
- CommunityChat.tsx - Chat-specific styling
- CommandHierarchy.tsx - Hierarchy-specific colors
- RadioSignOutSystem.tsx - System-specific styling

## How to Update the Design System

### To change ALL cards at once:

1. Open `src/app/globals.css`
2. Find the card class you want to modify (e.g., `.card-depth`)
3. Update the Tailwind utilities:

```css
.card-depth {
  @apply bg-white dark:bg-[#1b203b] rounded-2xl border border-gray-200/40 dark:border-gray-700/30;
  @apply shadow-2 hover:shadow-3 transition-shadow duration-300;
}
```

### Example: Change shadow depth

```css
/* Make all primary cards have more shadow */
.card-depth {
  @apply bg-white dark:bg-[#1b203b] rounded-2xl border border-gray-200/40 dark:border-gray-700/30;
  @apply shadow-3 hover:shadow-[0_20px_25px_-5px_rgb(0,0,0,0.1)] transition-shadow duration-300;
}
```

### Example: Change card background

```css
/* Make cards slightly off-white */
.card-depth {
  @apply bg-gray-50 dark:bg-[#1b203b] rounded-2xl border border-gray-200/40 dark:border-gray-700/30;
  @apply shadow-2 hover:shadow-3 transition-shadow duration-300;
}
```

### Example: Change border radius

```css
/* Make cards more squared */
.card-depth {
  @apply bg-white dark:bg-[#1b203b] rounded-lg border border-gray-200/40 dark:border-gray-700/30;
  @apply shadow-2 hover:shadow-3 transition-shadow duration-300;
}
```

## Shadow System (tailwind.config.js)

The shadow system is defined in `tailwind.config.js`:

```javascript
boxShadow: {
  '0': 'none',
  '1': '0 1px 2px rgba(0, 0, 0, 0.05)',
  '2': '0 4px 6px rgba(0, 0, 0, 0.08)',
  '3': '0 8px 12px rgba(0, 0, 0, 0.12)',
  '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
  'neumorphic': '5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.7)',
  'neumorphic-dark': '5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.05)'
}
```

## Benefits

✅ **Single source of truth** - All card styling in one place  
✅ **Easy maintenance** - Update design system in seconds  
✅ **Consistency** - All cards automatically match  
✅ **Performance** - CSS classes are more efficient than inline styles  
✅ **Flexibility** - Create new card variants easily  
✅ **Type safety** - Component code is cleaner and more readable  

## Migration Complete

All major card components now use centralized CSS classes. The design system is production-ready and easy to maintain!

**Last Updated:** $(date)  
**Version:** 1.0.0

