# 🎨 Visual Quick Reference - Auditable Logging

**Quick visual guide to all new features**

---

## 🎯 **Dashboard Changes**

### **New Floating Buttons (Bottom Right)**

```
                                    ┌─────────────────┐
                                    │  🎓 Training    │ ← Green (Safe practice)
                                    └─────────────────┘
                                    ┌─────────────────┐
                                    │  + New Incident │ ← Blue (Create real)
                                    └─────────────────┘
```

### **Incident Table - New Visual Indicators**

```
┌─────────────────────────────────────────────────────────────┐
│ Log #001 | Medical Incident          🕓  [AMENDED]   🔴 High │
│ ↑        ↑                            ↑   ↑           ↑      │
│ Log #    Type                   Retro-  Amended   Priority   │
│                                 spective Badge               │
└─────────────────────────────────────────────────────────────┘

🕓 = Retrospective Entry (logged after it happened)
[AMENDED] = Log has been amended (click to see history)
🔴/🟡/🟢 = Priority (High/Medium/Low)
```

---

## 📝 **New Incident Modal - Structured Template**

### **Template Layout**

```
┌────────────────────────────────────────────────────────────────┐
│  Create New Incident                                     [X]    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Structured Template ▼] [Legacy Format]  ← Toggle             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📝 Headline (≤15 words)            💡 Brief summary      │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ Medical incident at north gate - person collapsed│    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  │                                          8/15 words ✓    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📍 Source                      💡 Who/what reported      │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ R3, CCTV North Gate                              │    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 👁️ Facts Observed             💡 Stick to facts          │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ 15:03 - Person collapsed near gate.              │    │ │
│  │ │ Crowd of ~20 people present. Person appears      │    │ │
│  │ │ unconscious, not responsive to voice.            │    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  │ ⚠️ Factual Language Check: ✓ No issues detected         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ⚡ Actions Taken               💡 What was done          │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ R3 called medical at 15:04. Security established │    │ │
│  │ │ crowd control. Medical team arrived 15:06.       │    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🎯 Outcome                     💡 Current status         │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ Person transported to medical tent.              │    │ │
│  │ │ Incident ongoing. Medical team monitoring.       │    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📋 Preview of Log Entry                                  │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ HEADLINE: Medical incident at north gate...      │    │ │
│  │ │                                                   │    │ │
│  │ │ SOURCE: R3, CCTV North Gate                      │    │ │
│  │ │                                                   │    │ │
│  │ │ FACTS: 15:03 - Person collapsed near gate...     │    │ │
│  │ │                                                   │    │ │
│  │ │ ACTIONS: R3 called medical at 15:04...           │    │ │
│  │ │                                                   │    │ │
│  │ │ OUTCOME: Person transported to medical tent...   │    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Submit Incident]        │
└────────────────────────────────────────────────────────────────┘
```

### **AI Validation Warnings**

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Factual Language Check:                                 │
│                                                             │
│ • Avoid emotional language like 'chaotic', 'terrible'      │
│ • Avoid speculation - state only what you observed         │
│ • Consider including specific time references              │
└────────────────────────────────────────────────────────────┘
```

---

## 🎓 **Training Mode Modal**

```
┌──────────────────────────────────────────────────────────────┐
│  🎓 Training Mode - Practice Professional Logging      [X]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📚 Safe Practice Environment                                │
│  Your practice logs won't affect real incident data          │
│                                                               │
│  Choose a training scenario:                                 │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟢 BEGINNER SCENARIO                                   │ │
│  │                                                         │ │
│  │ Medical Incident - Single Casualty                     │ │
│  │                                                         │ │
│  │ You're on duty when R3 reports a person collapsed     │ │
│  │ at the north entrance. Practice creating a structured  │ │
│  │ log entry with basic incident details.                 │ │
│  │                                                         │ │
│  │ Duration: ~5 minutes | Difficulty: ⭐                  │ │
│  │                                                         │ │
│  │                          [Start Beginner Scenario]     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟡 INTERMEDIATE SCENARIO                               │ │
│  │                                                         │ │
│  │ Crowd Management - Escalating Situation                │ │
│  │                                                         │ │
│  │ A crowd surge near the main stage. Multiple sources   │ │
│  │ reporting. Practice coordinating information and       │ │
│  │ documenting actions across multiple callsigns.         │ │
│  │                                                         │ │
│  │ Duration: ~10 minutes | Difficulty: ⭐⭐               │ │
│  │                                                         │ │
│  │                       [Start Intermediate Scenario]    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔴 ADVANCED SCENARIO                                   │ │
│  │                                                         │ │
│  │ Multi-Casualty Incident with External Coordination     │ │
│  │                                                         │ │
│  │ Major incident with multiple casualties. Coordinate    │ │
│  │ with emergency services, document decisions, manage    │ │
│  │ information flow. Full command logging exercise.       │ │
│  │                                                         │ │
│  │ Duration: ~15 minutes | Difficulty: ⭐⭐⭐             │ │
│  │                                                         │ │
│  │                          [Start Advanced Scenario]     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│                                              [Close Training] │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 **Incident Details Modal - New Features**

### **Header with Badges**

```
┌──────────────────────────────────────────────────────────────┐
│  Incident Details                                      [X]    │
│                                                               │
│  Log #001 | Medical Incident  🕓  [AMENDED (3)]              │
│                                 ↑   ↑          ↑              │
│                           Retrospective  Amended  Revision #  │
│                                                               │
│  Occurred: 14:55 | Logged: 15:03 (8 minutes after)           │
│  ↑                ↑              ↑                            │
│  When it         When it was     Delay shown if              │
│  happened        logged           retrospective               │
└──────────────────────────────────────────────────────────────┘
```

### **Action Buttons**

```
┌──────────────────────────────────────────────────────────────┐
│  [📋 View History]  [✏️ Amend Entry]                         │
│   ↑                 ↑                                         │
│   Show audit trail  Create amendment                         │
└──────────────────────────────────────────────────────────────┘
```

### **Revision History (Collapsible)**

```
┌──────────────────────────────────────────────────────────────┐
│  📜 Revision History (3 amendments)           [▼ Collapse]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Revision #3 | 2025-10-09 15:30 | Changed by: Silver-1  │ │
│  │                                                         │ │
│  │ Field Changed: Action Taken                            │ │
│  │                                                         │ │
│  │ Old Value:                                             │ │
│  │ R3 called medical at 15:04.                            │ │
│  │                                                         │ │
│  │ New Value:                                             │ │
│  │ R3 called medical at 15:04. Ambulance arrived 15:15.  │ │
│  │                                                         │ │
│  │ Reason: Added ambulance arrival time                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Earlier revisions collapsed...]                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ⏰ **Log Review Reminder (Silver Commanders)**

```
┌──────────────────────────────────────────────────────────────┐
│  ⏰ Log Review Reminder                               [X]    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  It's been 30 minutes since your last review.                │
│  Time to check recent incident activity.                     │
│                                                               │
│  📊 Activity Since Last Review:                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🆕 New Incidents: 3                                    │ │
│  │ ✏️ Updated Incidents: 5                                │ │
│  │ ✅ Closed Incidents: 2                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Last Reviewed: 14:30                                        │
│  Current Time: 15:00                                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Snooze 15 min] [Snooze 30 min] [Snooze 60 min]       │ │
│  │                                                         │ │
│  │ [✓ Mark as Reviewed]              [Dismiss]            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 📚 **Help Page - New Section**

### **Professional Logging Standards Section**

```
┌──────────────────────────────────────────────────────────────┐
│  Help & Glossary                                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [About] [Glossary] [Features] [Logging Standards] ← NEW    │
│                                                               │
│  📋 Professional Logging Standards                           │
│                                                               │
│  "If it ain't written down, it didn't happen"               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📝 Structured Logging Template                         │ │
│  │                                                         │ │
│  │ HEADLINE (≤15 words)                                   │ │
│  │ ✅ "Medical incident at north gate - person collapsed"│ │
│  │ ❌ "Terrible emergency happened"                       │ │
│  │                                                         │ │
│  │ SOURCE                                                 │ │
│  │ ✅ "R3, CCTV North Gate, Security Team"               │ │
│  │ ❌ "Someone told me"                                   │ │
│  │                                                         │ │
│  │ FACTS OBSERVED                                         │ │
│  │ ✅ "15:03 - Person collapsed. Crowd of ~20 present"   │ │
│  │ ❌ "It was chaotic and scary"                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✅ Use These              │  ❌ Avoid These            │ │
│  │                           │                             │ │
│  │ • Specific times (15:03)  │  • Emotional language       │ │
│  │ • Exact locations         │  • Opinions                 │ │
│  │ • Measurable quantities   │  • Vague terms              │ │
│  │ • Direct observations     │  • Speculation              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  🛡️ JESIP & JDM Compliance                                  │
│  • Complete audit trail                                      │
│  • Immutable original entries                                │
│  • Legal defensibility                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 **Color Coding**

### **Priority Badges**
- 🔴 **Red** = High priority
- 🟡 **Yellow** = Medium priority
- 🟢 **Green** = Low priority

### **Status Indicators**
- 🕓 **Clock** = Retrospective entry (logged after occurrence)
- [AMENDED] **Amber** = Log has been amended
- [TRAINING] **Purple** = Practice/training log

### **Validation Colors**
- ✅ **Green** = Validation passed
- ⚠️ **Amber** = Warning (can still submit)
- ❌ **Red** = Error (must fix)

---

## 💡 **Quick Tips**

### **Tooltips** (💡)
Hover over any 💡 icon for context-specific help

### **Live Indicators**
- Word count updates as you type
- AI validation runs in real-time
- Preview updates automatically

### **Keyboard Shortcuts**
- `Tab` = Navigate between fields
- `Cmd/Ctrl + Enter` = Submit form
- `Esc` = Close modal

---

## 🎯 **Where to Find Things**

```
Dashboard
├── Floating Buttons (Bottom Right)
│   ├── 🎓 Training (Green) → Training Mode Modal
│   └── + New Incident (Blue) → Creation Modal
│
├── Incident Table
│   ├── Click incident → Details Modal
│   │   ├── "View History" → Revision History
│   │   └── "Amend Entry" → Amendment Modal
│   │
│   └── Visual Indicators
│       ├── 🕓 = Retrospective
│       ├── [AMENDED] = Has amendments
│       └── 🔴🟡🟢 = Priority
│
└── Bottom Navigation
    └── Help → Professional Logging Standards
```

---

**📖 Full documentation available in `/docs/` folder**

*Server: http://localhost:3000*

