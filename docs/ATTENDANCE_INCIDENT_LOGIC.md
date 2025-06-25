# Attendance Creation Logic in New Incident Modal

This document describes how the "Attendance" incident type is detected, processed, and stored when creating a new incident via the Incident Creation Modal.

## 1. Detection of Attendance Incidents

- The system detects an "Attendance" incident if the input text contains keywords such as:
  - `current numbers`, `clicker`, `attendance`, `numbers`, `capacity`, `occupancy`, `count`
- It also checks if the input contains a number (the attendance count).

**Detection logic:**
```js
if (/current numbers|clicker|attendance|numbers|capacity|occupancy|count/i.test(text)) {
  // Extract any number from the text
  const numbers = text.match(/\d+/);
  if (numbers) {
    return 'Attendance';
  }
}
```

## 2. Parsing Attendance Incidents

- When an "Attendance" incident is detected, the system extracts the first number from the input as the attendance count.
- It calculates the percentage of venue capacity and the remaining capacity.
- The default maximum capacity is 3500, but if the event has a specific `expected_attendance`, that value is used.

**Parsing logic:**
```js
const numbers = input.match(/\d+/);
if (!numbers) return null;

const count = numbers[0];
const maxCapacity = expectedAttendance > 0 ? expectedAttendance : 3500;
const percentage = Math.round((parseInt(count) / maxCapacity) * 100);
const remaining = maxCapacity - parseInt(count);

return {
  occurrence: `Current Attendance: ${count}`,
  action_taken: `Attendance at ${count} people (${percentage}% of capacity). ${remaining} people remaining to reach capacity.`,
  callsign_from: 'Attendance',
  incident_type: 'Attendance'
};
```

## 3. Database Insertion

- When the incident is submitted:
  - An entry is created in the `incident_logs` table.
  - If the incident type is "Attendance", an additional entry is created in the `attendance_records` table with:
    - `event_id`
    - `count` (attendance number)
    - `timestamp` (current time)

**Insertion logic:**
```js
if (formData.incident_type === 'Attendance') {
  const count = parseInt(formData.occurrence.match(/\d+/)?.[0] || '0');
  if (count > 0) {
    await supabase
      .from('attendance_records')
      .insert([{
        event_id: selectedEvent.id,
        count: count,
        timestamp: now
      }]);
  }
}
```

## 4. Default Action Taken

- For attendance incidents, the default action taken is:
  - "Venue occupancy updated."

---

## Recent Improvements (June 2024)
- Attendance quick input is now pre-filled with "Current Attendance: " in the Incident Creation Modal.
- Quick actions row above "Action Taken" is hidden for Attendance Update incidents.
- UI/UX improvements for context-aware logic and responsive design. 