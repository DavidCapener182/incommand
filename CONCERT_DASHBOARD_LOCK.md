# 🚨 CONCERT DASHBOARD - PERMANENT LOCK 🚨

## ⚠️ CRITICAL: DO NOT MODIFY CONCERT DASHBOARD ⚠️

The concert dashboard in `src/components/Dashboard.tsx` is **PERMANENTLY LOCKED** and must **NEVER CHANGE**.

### What This Means:
- Concert events will **ALWAYS** show the exact same 4 cards
- The layout, styling, animations, and functionality are **FROZEN**
- No dynamic card system should ever affect concert events
- No future changes should modify the concert dashboard

### The 4 Permanent Concert Cards:

1. **VenueOccupancy** (Card 1)
   - Wrapped in Card component
   - Clickable (opens modal)
   - Shows venue occupancy data

2. **WeatherCard** (Card 2)
   - No Card wrapper (direct component)
   - Only shows if `currentEvent?.venue_address` exists
   - Shows weather data with venue-specific props

3. **What3WordsSearchCard** (Card 3)
   - Wrapped in Card component
   - Specific props: `lat`, `lon`, `venueAddress`, `singleCard`, `largeLogo={false}`

4. **TopIncidentTypesCard** (Card 4)
   - No Card wrapper (direct component)
   - Handles incident filtering
   - Shows top incident types

### Animation Delays (FIXED):
- Card 1: 0.2s delay
- Card 2: 0.3s delay  
- Card 3: 0.4s delay
- Card 4: 0.5s delay

### Styling (FIXED):
- All cards: `h-[130px]` height
- Hover effects: `y: -4, scale: 1.02`
- Transitions: `duration: 0.5`
- Card styling: `card-depth`, `shadow-sm dark:shadow-md`

### Why This Lock Exists:
- User explicitly requested: "this needs to never change for concert events"
- Concert dashboard must remain exactly as it was before multi-event changes
- Any future modifications should only affect other event types
- This ensures concert functionality remains stable and unchanged

### Enforcement:
- This file serves as documentation and warning
- The code has explicit comments warning against modification
- Any future changes should preserve this exact structure for concert events

---

**Last Updated:** $(date)
**Status:** PERMANENTLY LOCKED
**Modification Allowed:** NO
