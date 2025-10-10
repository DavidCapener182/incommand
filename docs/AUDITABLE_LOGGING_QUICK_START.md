# Auditable Event Logging - Quick Start Guide

## ✅ Implementation Complete!

All Phase 1 features have been successfully implemented and integrated into inCommand.

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migration

Go to your **Supabase Dashboard**:
1. Navigate to **SQL Editor**
2. Open the file: `database/auditable_logging_phase1_migration.sql`
3. Copy and paste the entire content
4. Click **Run**
5. Verify you see the success messages in the output

**What this does:**
- Adds 8 new columns to `incident_logs` table
- Creates `incident_log_revisions` table for amendment tracking
- Sets up helper functions and triggers
- Creates RLS policies for security
- Backfills existing logs with default values

### Step 2: Install Dependencies (Optional)

If you want to run the backfill script locally:

```bash
npm install
```

The new devDependencies (`dotenv`, `ts-node`) have already been added to `package.json`.

### Step 3: Test the Features

Your app is ready to use! Test these features:

#### Create a New Incident
1. Click "Create Incident" button
2. Scroll down to see the new **Entry Type** section
3. Select "Contemporaneous" (default) or "Retrospective"
4. If retrospective, provide a justification
5. Submit the incident

#### View Incident Details
1. Click any incident in the table
2. See the **dual timestamps** in the header (Occurred vs Logged)
3. See the **AMENDED** badge if the log has been modified
4. See the 🕓 icon if it's a retrospective entry

#### Amend an Incident
1. Open any incident details
2. Click **"Amend Entry"** button (replaces old "Edit")
3. Select which field to amend
4. Enter new value and reason for amendment
5. Preview the changes
6. Confirm amendment
7. View the **Revision History** section to see all changes

#### View Revision History
1. Open an amended incident
2. The **Revision History** section appears automatically
3. Click to expand and see:
   - What changed (old → new values)
   - Who made the change
   - When it was changed
   - Why it was changed

---

## 📋 What's New

### Visual Indicators

#### In Incident Table:
- 🕓 **Retrospective badge** - Amber badge for delayed entries
- **AMENDED badge** - Amber badge showing log has been modified
- **Priority badge** - Color-coded priority levels

#### In Incident Details:
- **Dual timestamps** - "Occurred: 14:32 | Logged: 14:35"
- **Entry type indicator** - Shows if entry is retrospective
- **Amendment count** - "(3 revisions)" in header
- **Revision history section** - Complete audit trail

### New Features

#### Entry Type Classification
- **Contemporaneous**: Logged in real-time
- **Retrospective**: Logged after delay (requires justification)
- Automatic validation warnings if time delta exceeds 15 minutes

#### Non-Destructive Amendments
- Old "Edit" → New "Amend Entry"
- Creates revision records instead of overwriting
- Tracks who, what, when, why for every change
- Complete audit trail visible to all users

#### Immutable Audit Trail
- No silent edits - every change is recorded
- Full attribution with user names and callsigns
- Timestamp for every amendment
- Justification required for all changes

---

## 🎯 Usage Examples

### Example 1: Real-Time Incident
```
Entry Type: Contemporaneous
Time of Occurrence: 14:32:15
Time Logged: 14:32:20
Result: Standard entry, no special indicators
```

### Example 2: Delayed Entry
```
Entry Type: Retrospective
Time of Occurrence: 14:15:00
Time Logged: 14:47:30
Justification: "Live comms prevented immediate logging due to multiple simultaneous incidents"
Result: Shows 🕓 badge in table
```

### Example 3: Amending a Log
```
Original: "Barrier collapse in Pit B"
Amended To: "Barrier collapse in Pit B section 3"
Change Type: Clarification
Reason: "Added specific section number after confirmation with venue ops"
Result: Shows AMENDED badge, revision history displays complete change
```

---

## 🔒 Permissions

### Who Can Do What:

- **All Users**: Create logs, view logs, view revision history
- **Log Creators** (within 24 hours): Amend their own logs
- **Admins**: Amend any log at any time

### Security Features:
- RLS policies enforce data access
- Authentication required for all operations
- Complete audit trail maintained
- No destructive edits possible

---

## 📊 Data Migration

If you want to run the backfill script (optional - migration handles this):

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run backfill
npm run backfill:auditable-logs
```

This will:
- Set `time_of_occurrence` = `timestamp` for existing logs
- Set `time_logged` = `timestamp` for existing logs
- Mark all existing as `entry_type` = 'contemporaneous'
- Copy `callsign_from` to `logged_by_callsign`
- Display summary statistics

---

## 🐛 Troubleshooting

### "Can't amend this log"
**Solution**: You can only amend logs you created (within 24 hours) or if you're an admin.

### "Retrospective justification required"
**Solution**: When selecting "Retrospective" entry type, you must provide a justification explaining the delay.

### Revision history not showing
**Solution**: Ensure the database migration has been run. Check the `incident_log_revisions` table exists.

### Time validation warnings
**Solution**: These are informational. If logging an event >15 minutes ago, select "Retrospective" and provide justification.

---

## 📚 Documentation

- **Technical Specification**: `docs/AUDITABLE_LOGGING_SPEC.md`
- **Implementation Summary**: `docs/AUDITABLE_LOGGING_IMPLEMENTATION_SUMMARY.md`
- **This Quick Start**: `docs/AUDITABLE_LOGGING_QUICK_START.md`

---

## 🎉 You're Ready!

The auditable logging system is now fully integrated into inCommand. All new incidents will capture:
- ✅ Dual timestamps (occurrence vs logged)
- ✅ Entry type classification
- ✅ User attribution with callsigns
- ✅ Immutable audit trail
- ✅ Non-destructive amendments
- ✅ Complete revision history

**Happy logging!** 📝✨
