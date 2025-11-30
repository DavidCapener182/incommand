# Incident Modal - Component Structure

## Main Component
- **`src/components/IncidentCreationModal.tsx`** - Main incident creation modal component (4,879 lines)

## Card Components (New Modular Structure)
Located in `src/components/incidents/cards/`:

1. **`IncidentCreationModalHeader.tsx`** - Header section of the modal
2. **`CallsignInformationCard.tsx`** - Callsign from/to inputs
3. **`IncidentConfigurationCard.tsx`** - Priority, entry type, timestamps
4. **`DetailedInformationCard.tsx`** - Headline, source, facts, actions, outcome
5. **`GreenGuideBestPracticesCard.tsx`** - Green Guide best practices display
6. **`LocationAndActionsCard.tsx`** - Location fields and actions taken
7. **`AdditionalOptionsCard.tsx`** - Photos, tags, special fields

## Supporting Components

### Quick Entry Components
- **`src/components/QuickTabs.tsx`** - Quick tabs for Attendance/Weather/Noise/Crowd
- **`src/components/ui/QuickAddInput.tsx`** - AI-powered natural language input
- **`src/components/IncidentTypeCategories.tsx`** - Categorized incident type selector

### Voice Input Components
- **`src/components/VoiceInputButton.tsx`** - Voice input button with recording
- **`src/components/VoiceInputField.tsx`** - Voice input field component
- **`src/components/incidents/RecentRadioMessages.tsx`** - Recent radio messages display

### AI & Smart Features
- **`src/components/GuidedActionsModal.tsx`** - Guided actions suggestions
- **`src/components/SOPModal.tsx`** - Standard Operating Procedures modal

### UI Components
- **`src/components/ui/CursorTracker.tsx`** - Real-time cursor tracking
- **`src/components/ui/TypingIndicator.tsx`** - Typing indicator display

### Form & Input Components
- **`src/components/IncidentDependencySelector.tsx`** - Dependency/relationship selector
- **`src/components/EscalationTimer.tsx`** - Escalation countdown timer

### Debug Component
- **`src/components/debug/IncidentFormDebugger.tsx`** - Development debug helper

## Component Hierarchy

```
IncidentCreationModal (main)
├── IncidentCreationModalHeader
├── QuickTabs (optional)
├── QuickAddInput
├── IncidentTypeCategories
│
├── Middle Column - Main Form
│   ├── CallsignInformationCard
│   ├── IncidentConfigurationCard
│   ├── DetailedInformationCard
│   ├── GreenGuideBestPracticesCard
│   ├── LocationAndActionsCard
│   └── AdditionalOptionsCard
│
├── VoiceInputButton / VoiceInputField
├── RecentRadioMessages
├── IncidentDependencySelector
├── EscalationTimer
├── GuidedActionsModal (conditional)
├── SOPModal (conditional)
├── CursorTracker
└── TypingIndicator
```

## Total TSX Files: 19 components

