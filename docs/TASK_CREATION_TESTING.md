# Task Creation from Incident Logs - Testing Guide

## Overview

The task creation system automatically detects task-related keywords in incident logs and creates tasks. This guide shows you how to test it.

## How It Works

The system analyzes incidents from the `incident_logs` table and creates tasks when:
- The incident contains task-related keywords (check, verify, assign, follow up, etc.)
- The incident type suggests a task (patrol, check, inspection, etc.)
- The incident is open (not closed)

## Testing Methods

### Method 1: Check Which Incidents Would Create Tasks (Dry Run)

**GET Request** - See which incidents are eligible for task creation:

```bash
# Replace YOUR_EVENT_ID with your actual event ID
curl -X GET "http://localhost:3000/api/incidents/process-tasks?event_id=YOUR_EVENT_ID" \
  -H "Cookie: your-auth-cookie"
```

**Response:**
```json
{
  "success": true,
  "totalIncidents": 10,
  "eligibleForTasks": 3,
  "incidents": [
    {
      "id": 123,
      "incident_type": "Patrol",
      "occurrence": "Need to check gate 5 security",
      "priority": "medium",
      "location": "Gate 5"
    }
  ]
}
```

### Method 2: Process a Single Incident

**POST Request** - Create a task from a specific incident:

```bash
# Replace INCIDENT_ID with your actual incident ID
curl -X POST "http://localhost:3000/api/incidents/process-tasks?incident_id=INCIDENT_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"
```

**Response:**
```json
{
  "success": true,
  "incidentId": 123,
  "analyzed": true,
  "shouldCreate": true,
  "taskCreated": true,
  "taskId": "uuid-of-created-task"
}
```

### Method 3: Process All Open Incidents for an Event

**POST Request** - Process all open incidents:

```bash
# Replace YOUR_EVENT_ID with your actual event ID
curl -X POST "http://localhost:3000/api/incidents/process-tasks?event_id=YOUR_EVENT_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"
```

**Response:**
```json
{
  "success": true,
  "eventId": "your-event-id",
  "processed": 10,
  "tasksCreated": 3,
  "results": [
    {
      "taskCreated": true,
      "taskId": "uuid-1",
      "reason": "Task created from incident"
    },
    {
      "taskCreated": false,
      "reason": "No task keywords detected"
    }
  ]
}
```

### Method 4: Process Specific Incidents by IDs

**POST Request** - Process specific incidents:

```bash
curl -X POST "http://localhost:3000/api/incidents/process-tasks" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "incident_ids": [123, 456, 789]
  }'
```

## Task Keywords That Trigger Creation

The system looks for these keywords in the `occurrence` field:

- **Action verbs**: check, verify, inspect, review, monitor
- **Follow-up**: follow up, follow-up, followup
- **Assignment**: assign, allocate, deploy, send
- **Coordination**: coordinate, arrange, organize
- **Preparation**: prepare, set up, setup
- **Security**: clear, secure, lock down
- **Requests**: need, require, must, should, please, can you, could you

## Example Test Incidents

Create these incidents to test task creation:

### Test 1: Simple Task Request
```
Incident Type: Patrol
Occurrence: "Need to check gate 5 security"
Priority: Medium
```

### Test 2: Assignment Task
```
Incident Type: Coordination
Occurrence: "Please assign someone to monitor the main entrance"
Priority: High
```

### Test 3: Follow-up Task
```
Incident Type: Other
Occurrence: "Follow up on the earlier report about noise complaints"
Priority: Medium
```

### Test 4: Should NOT Create Task (Critical Incident)
```
Incident Type: Medical
Occurrence: "Medical emergency at gate 3"
Priority: Critical
```
*(This won't create a task because it's a critical incident type)*

## Testing in Browser Console

You can also test directly in the browser console:

```javascript
// Get your event ID from the page
const eventId = 'your-event-id-here';

// Check which incidents would create tasks
fetch(`/api/incidents/process-tasks?event_id=${eventId}`)
  .then(r => r.json())
  .then(data => console.log('Eligible incidents:', data));

// Process all incidents for an event
fetch(`/api/incidents/process-tasks?event_id=${eventId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => console.log('Task creation results:', data));
```

## Verifying Created Tasks

After running the task creation:

1. Go to the **Tasks** page in your application
2. Look for tasks with notes like: `Auto-created from incident log #123 (Patrol)`
3. Check that the task:
   - Has a title based on the incident occurrence
   - Includes the full incident details in the description
   - Has the correct priority (mapped from incident priority)
   - Has location if the incident had one

## Troubleshooting

### No tasks created?
- Check that incidents contain task keywords
- Verify incidents are open (not closed)
- Check browser console for errors
- Verify you're authenticated

### Tasks created but wrong?
- Check the incident `occurrence` field has task keywords
- Verify incident priority is set correctly
- Check that duplicate detection isn't blocking creation

### API errors?
- Ensure you're authenticated (check cookies)
- Verify event_id and incident_id are valid UUIDs/integers
- Check server logs for detailed error messages

