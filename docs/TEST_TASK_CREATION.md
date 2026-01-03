# Quick Test: Task Creation from Incidents

## Step 1: Clear Console and Run Test

Copy and paste this entire block into your browser console:

```javascript
// Clear console first
console.clear();

// Your event ID (from the console logs)
const eventId = '2fd1f867-4b7f-4846-81c2-31c64a42fcca';

console.log('🔍 Checking which incidents would create tasks...\n');

fetch(`/api/incidents/process-tasks?event_id=${eventId}`)
  .then(r => r.json())
  .then(data => {
    console.log('═══════════════════════════════════════');
    console.log('📊 TASK CREATION ANALYSIS');
    console.log('═══════════════════════════════════════');
    console.log(`Total open incidents: ${data.totalIncidents}`);
    console.log(`Eligible for tasks: ${data.eligibleForTasks}`);
    console.log('\n📋 Eligible Incidents:');
    console.table(data.incidents);
    
    // Find LOG 008 specifically
    const log008 = data.incidents.find(i => 
      i.occurrence?.includes('check on their staff') || 
      i.occurrence?.includes('Supervisors conducted')
    );
    
    if (log008) {
      console.log('\n✅ LOG 008 FOUND:');
      console.log('  ID:', log008.id);
      console.log('  Type:', log008.incident_type);
      console.log('  Occurrence:', log008.occurrence);
      console.log('  Priority:', log008.priority);
    } else {
      console.log('\n❌ LOG 008 not found in eligible incidents');
    }
    
    console.log('\n═══════════════════════════════════════');
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
```

## Step 2: Create Tasks

After Step 1, if you see eligible incidents, run this to create tasks:

```javascript
// Clear console
console.clear();

const eventId = '2fd1f867-4b7f-4846-81c2-31c64a42fcca';

console.log('🚀 Creating tasks from incidents...\n');

fetch(`/api/incidents/process-tasks?event_id=${eventId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => {
    console.log('═══════════════════════════════════════');
    console.log('✅ TASK CREATION RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`Processed: ${data.processed} incidents`);
    console.log(`Tasks created: ${data.tasksCreated}`);
    console.log('\n📋 Detailed Results:');
    
    data.results.forEach((result, index) => {
      if (result.taskCreated) {
        console.log(`✅ Task ${index + 1}: Created (ID: ${result.taskId})`);
      } else {
        console.log(`❌ Task ${index + 1}: ${result.reason}`);
      }
    });
    
    if (data.tasksCreated > 0) {
      console.log('\n🎉 Success! Check the Tasks page to see your new tasks.');
    }
    console.log('═══════════════════════════════════════');
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
```

## Step 3: Test Single Incident (LOG 008)

If you know the incident ID for LOG 008, test it directly:

```javascript
// Clear console
console.clear();

// Replace 8 with the actual incident ID
const incidentId = 8;

console.log(`🔍 Processing incident ${incidentId}...\n`);

fetch(`/api/incidents/process-tasks?incident_id=${incidentId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => {
    console.log('═══════════════════════════════════════');
    console.log('📋 RESULT');
    console.log('═══════════════════════════════════════');
    console.log('Incident ID:', data.incidentId);
    console.log('Should create:', data.shouldCreate);
    console.log('Task created:', data.taskCreated);
    
    if (data.taskCreated) {
      console.log('✅ Task ID:', data.taskId);
      console.log('🎉 Success! Check the Tasks page.');
    } else {
      console.log('❌ Reason:', data.reason);
    }
    console.log('═══════════════════════════════════════');
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
```

