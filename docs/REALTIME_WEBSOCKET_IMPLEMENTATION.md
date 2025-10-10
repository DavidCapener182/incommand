# Real-Time WebSocket Implementation for Multi-User Control Rooms

## Overview

The inCommand system now features comprehensive real-time WebSocket updates to support multi-user control rooms where multiple loggists and commanders can work simultaneously. All changes are instantly synchronized across all connected clients.

---

## 🔄 Real-Time Features

### 1. **Incident Log Updates**
- **New Incidents**: Instantly appear on all connected clients
- **Status Changes**: Real-time updates when incidents are closed/reopened
- **Amendments**: Live notifications when logs are amended
- **Priority Updates**: Immediate visibility of priority changes

### 2. **Amendment & Revision Tracking**
- **New Amendments**: Toast notifications when logs are amended by other users
- **Revision Creation**: Real-time alerts when new revisions are added
- **Audit Trail Updates**: Automatic refresh of revision history

### 3. **Multi-User Coordination**
- **Concurrent Editing**: Multiple users can view and amend logs simultaneously
- **Conflict Prevention**: Visual indicators show when others are editing
- **Live Notifications**: Toast messages for all significant changes

---

## 🛠️ Technical Implementation

### WebSocket Subscriptions

#### 1. **Incident Logs Channel** (`IncidentTable.tsx`)
```typescript
supabase
  .channel(`incident_logs_${currentEventId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'incident_logs',
    filter: `event_id=eq.${currentEventId}`
  }, (payload) => {
    // Handle INSERT, UPDATE, DELETE
  })
  .subscribe()
```

**Handles:**
- ✅ New incident creation (INSERT)
- ✅ Incident updates including amendments (UPDATE)
- ✅ Incident deletion (DELETE)

**Special Features:**
- Detects amendments (`is_amended` flag change)
- Shows priority-based toast notifications
- Prevents duplicate toasts with intelligent debouncing

#### 2. **Log Revisions Channel** (`useLogRevisions.ts`)
```typescript
supabase
  .channel(`log_revisions_${eventId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'incident_log_revisions'
  }, (payload) => {
    // Handle new revision
  })
  .subscribe()
```

**Handles:**
- ✅ New revision notifications
- ✅ Revision count updates
- ✅ Field change tracking

#### 3. **Incident Details Channel** (`IncidentDetailsModal.tsx`)
```typescript
supabase
  .channel(`incident_${incidentId}_${Date.now()}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'incident_logs',
    filter: `id=eq.${incidentId}`
  }, (payload) => {
    // Refresh incident details
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'incident_log_revisions',
    filter: `incident_log_id=eq.${incidentId}`
  }, (payload) => {
    // Refresh revision history
  })
  .subscribe()
```

**Handles:**
- ✅ Live updates to opened incident details
- ✅ Automatic revision history refresh
- ✅ Amendment badge updates

---

## 📊 Toast Notification System

### Priority-Based Notifications

**High Priority Incidents** (12 second duration):
- Ejection
- Code Green/Black/Pink
- Aggressive Behaviour
- Missing Child/Person
- Hostile Act
- Counter-Terror Alert
- Fire Alarm
- Evacuation
- Medical
- Suspicious Behaviour

**Standard Incidents** (8 second duration):
- All other incident types

**Amendment Notifications** (8 second duration):
- Log amended alerts with audit trail prompts

### Duplicate Prevention

The system includes intelligent toast deduplication:
```typescript
const recentToasts = new Map<string, number>()

// Create unique key for toast
const toastKey = `${incident.log_number}-${incident.incident_type}-INSERT`

// Check if shown within last 10 seconds
if (recentToasts.has(toastKey) && (now - recentToasts.get(toastKey)!) < 10000) {
  return // Prevent duplicate
}
```

**Features:**
- ✅ 10-second debounce window
- ✅ 30-second cleanup of old records
- ✅ Unique keys per incident and action type

---

## 🔔 Real-Time Notifications

### 1. **New Incident Created**
```typescript
{
  type: isHighPriority ? 'warning' : 'info',
  title: `New ${incident.incident_type} Incident`,
  message: `Log ${incident.log_number}: ${incident.occurrence}`,
  duration: isHighPriority ? 12000 : 8000,
  urgent: isHighPriority
}
```

### 2. **Log Amended**
```typescript
{
  type: 'warning',
  title: '📝 Log Amended',
  message: `Log ${updated.log_number} has been amended. Review the audit trail for details.`,
  duration: 8000,
  urgent: true
}
```

### 3. **Status Changed**
```typescript
{
  type: updated.is_closed ? 'success' : 'info',
  title: `Incident ${updated.is_closed ? 'Closed' : 'Reopened'}`,
  message: `Log ${updated.log_number}: ${updated.incident_type}`,
  duration: 6000
}
```

### 4. **Revision Created**
```typescript
{
  type: 'info',
  title: '📋 Log Revision Created',
  message: `${notification.changedBy} updated ${notification.fieldChanged} in a log entry`,
  duration: 6000
}
```

---

## 🏗️ Architecture

### Component Hierarchy

```
Dashboard
├── IncidentTable
│   ├── Uses: useLogRevisions hook
│   ├── Subscribes: incident_logs channel
│   └── Provides: Global toast callbacks
│
├── IncidentDetailsModal
│   ├── Subscribes: incident_logs (specific ID)
│   ├── Subscribes: incident_log_revisions (specific log)
│   └── Auto-refreshes: On any update
│
└── LogReviewReminder
    └── Uses: Real-time log data for reminders
```

### Custom Hook: `useLogRevisions`

**Purpose:** Track log revisions in real-time across the application

**Features:**
- ✅ Event-scoped subscriptions
- ✅ Revision count tracking per incident
- ✅ Latest revisions list (10 most recent)
- ✅ Callback support for custom notifications

**Usage:**
```typescript
const { revisionCount, latestRevisions } = useLogRevisions(
  eventId,
  (notification) => {
    // Handle new revision
  }
)
```

---

## 🔐 Security Considerations

### Row-Level Security (RLS)
All real-time subscriptions respect Supabase RLS policies:
- Users only receive updates for incidents in their accessible events
- Amendment permissions are enforced at the API level
- Revision history respects user roles

### Data Filtering
```typescript
filter: `event_id=eq.${currentEventId}`  // Event-scoped
filter: `id=eq.${incidentId}`            // Incident-scoped
filter: `incident_log_id=eq.${incidentId}` // Revision-scoped
```

---

## 🧪 Testing Real-Time Features

### Multi-User Scenario Testing

1. **Open two browser sessions** (different users or incognito mode)
2. **Create an incident** in Session 1
   - ✅ Should appear in Session 2 instantly
   - ✅ Toast notification should appear in Session 2

3. **Amend a log** in Session 1
   - ✅ Amendment badge should appear in Session 2
   - ✅ Toast notification should appear in Session 2

4. **Open incident details** in both sessions
5. **Create a revision** in Session 1
   - ✅ Revision history should update in Session 2
   - ✅ Toast notification should appear

6. **Change incident status** in Session 1
   - ✅ Status should update in Session 2
   - ✅ Toast notification should appear

### Performance Testing

**Metrics to Monitor:**
- Toast notification latency (should be < 500ms)
- UI update latency (should be < 1s)
- Memory usage with multiple subscriptions
- Network traffic patterns

**Expected Load:**
- 10-50 concurrent users per event
- 1-10 incidents per minute (peak)
- 5-20 revisions per hour

---

## 🐛 Debugging

### Enable Debug Logging

The system uses the built-in logger for detailed WebSocket debugging:

```typescript
logger.debug('Real-time event received', {
  component: 'IncidentTable',
  eventType: payload.eventType,
  incidentLogNumber: incident.log_number
})
```

### Common Issues

**1. Subscriptions not working:**
- Check Supabase connection status
- Verify RLS policies allow reads
- Ensure filter syntax is correct

**2. Duplicate toasts:**
- Check `recentToasts` Map for proper cleanup
- Verify unique key generation logic

**3. Missing updates:**
- Confirm subscription status is 'SUBSCRIBED'
- Check network tab for WebSocket connection
- Verify event_id matches across sessions

### Debug Commands

```javascript
// Check active subscriptions
console.log(activeSubscriptions.size)

// Check toast callbacks
console.log(globalToastCallbacks.size)

// Monitor subscription state
if (subscriptionRef.current) {
  console.log(subscriptionRef.current.state)
}
```

---

## 📈 Performance Optimization

### Subscription Management

**Best Practices:**
- ✅ Clean up subscriptions on component unmount
- ✅ Use unique channel names to prevent conflicts
- ✅ Filter events at the database level
- ✅ Batch UI updates with React state

**Memory Management:**
```typescript
// Cleanup on unmount
return () => {
  if (subscriptionRef.current) {
    subscriptionRef.current.unsubscribe()
    subscriptionRef.current = null
  }
}
```

### Toast Deduplication

- 10-second debounce per unique action
- Automatic cleanup of records older than 30 seconds
- Prevents notification spam during bulk updates

---

## 🚀 Future Enhancements

### Planned Features

1. **Presence Indicators**
   - Show which users are viewing/editing logs
   - Display cursor positions in shared views

2. **Collaborative Editing**
   - Real-time collaborative text editing
   - Conflict resolution UI

3. **Advanced Notifications**
   - User-specific notification preferences
   - Sound alerts for critical incidents
   - Browser push notifications

4. **Performance Monitoring**
   - WebSocket latency tracking
   - Update frequency analytics
   - Network health dashboard

---

## 📚 Related Documentation

- [Auditable Logging Spec](./AUDITABLE_LOGGING_SPEC.md)
- [Phase 1 Implementation](./AUDITABLE_LOGGING_IMPLEMENTATION_SUMMARY.md)
- [Quick Start Guide](./AUDITABLE_LOGGING_QUICK_START.md)

---

## ✅ Implementation Checklist

- [x] Basic WebSocket subscriptions for incident_logs
- [x] Amendment detection and notifications
- [x] Revision tracking and real-time updates
- [x] Toast notification system with deduplication
- [x] Multi-channel subscriptions in detail modal
- [x] useLogRevisions custom hook
- [x] Priority-based notification urgency
- [x] Proper cleanup and memory management
- [x] Debug logging infrastructure
- [ ] Presence indicators (future)
- [ ] Collaborative editing (future)
- [ ] Push notifications (future)

---

**Last Updated:** $(date)
**Implementation Status:** ✅ **COMPLETE - Phase 2**

