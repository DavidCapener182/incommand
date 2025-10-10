# inCommand Tutorials

Step-by-step guides for common tasks

## Table of Contents

1. [Creating Your First Incident](#tutorial-1-creating-your-first-incident)
2. [Using Structured Logging](#tutorial-2-using-structured-logging)
3. [Managing Staff and Callsigns](#tutorial-3-managing-staff-and-callsigns)
4. [Generating End-of-Event Reports](#tutorial-4-generating-end-of-event-reports)
5. [Setting Up Mobile PWA](#tutorial-5-setting-up-mobile-pwa)
6. [Using Voice Input](#tutorial-6-using-voice-input)
7. [Creating Custom Analytics Dashboards](#tutorial-7-creating-custom-analytics-dashboards)
8. [Setting Up Automation Workflows](#tutorial-8-setting-up-automation-workflows)
9. [Configuring Notifications](#tutorial-9-configuring-notifications)
10. [Using the AI Assistant](#tutorial-10-using-the-ai-assistant)

---

## Tutorial 1: Creating Your First Incident

**Time:** 3 minutes  
**Difficulty:** Beginner

### Step 1: Access the Dashboard
1. Log in to inCommand
2. You'll land on the main dashboard
3. Look for the **"+ New Incident"** button (top right)

### Step 2: Open the Creation Form
1. Click **"+ New Incident"**
2. A modal window will appear with the incident form

### Step 3: Fill Basic Information
1. **Title**: Enter a clear, concise title
   - Example: "Medical Incident - Main Stage"
2. **Type**: Select from dropdown
   - Medical, Security, Lost Person, etc.
3. **Priority**: Choose appropriate level
   - Critical (red) for emergencies
   - High (orange) for urgent matters
   - Medium (yellow) for standard issues
   - Low (green) for routine matters

### Step 4: Add Location Information
1. **Location** field: Type the venue location
   - Example: "Gate 3, North Entrance"
2. Or use **GPS button** to capture current location

### Step 5: Describe the Incident
1. **Description** field: Provide detailed information
2. Include:
   - What happened
   - When it happened
   - Who is involved
   - Current status

### Step 6: Optional Fields
- **Assigned To**: Select staff member if known
- **Photos**: Click camera icon to attach images
- **Tags**: Add searchable keywords

### Step 7: Submit
1. Review all information
2. Click **"Create Incident"**
3. Incident is now live in the system

### Step 8: Verify Creation
1. You'll be redirected to the incident details
2. Note the incident ID (e.g., #42)
3. Status should show as "Open"

**🎉 Congratulations!** You've created your first incident.

---

## Tutorial 2: Using Structured Logging

**Time:** 5 minutes  
**Difficulty:** Intermediate

### What is Structured Logging?
Professional format for creating legally defensible, auditable incident logs.

### Step 1: Enable Structured Template
1. Open incident creation modal
2. Look for toggle: **"Use Professional Logging Template"**
3. Click to enable

### Step 2: Write the Headline
1. **Headline** field (max 15 words)
2. Write a factual summary
3. ✅ Good: "Male, 30s, collapsed near stage, conscious, breathing"
4. ❌ Bad: "Guy fell down and looked really bad"

**Tips:**
- Stick to facts
- Use numbers and specifics
- Avoid adjectives and emotions

### Step 3: Document the Source
1. **Source** field: Who reported this?
2. Options:
   - Callsign (e.g., "Alpha 2")
   - Person name
   - CCTV camera
   - Public report

### Step 4: Record Facts Observed
1. **Facts Observed** field
2. Document ONLY what you can verify:
   - ✅ "Patient responsive to verbal commands"
   - ✅ "Visible bleeding from left forearm"
   - ❌ "Patient seemed drunk"
   - ❌ "Probably got in a fight"

**Golden Rule:** If you didn't see it, hear it, or measure it, don't log it.

### Step 5: Document Actions Taken
1. **Actions Taken** field
2. List everything you did:
   - "Applied pressure bandage to wound"
   - "Called for medical team at 14:32"
   - "Moved patient to first aid tent"

**Include timestamps** for each action!

### Step 6: Record Outcome
1. **Outcome** field
2. What happened as a result?
   - "Medical team arrived at 14:35"
   - "Patient transported to hospital at 14:50"
   - "Area cleaned and reopened at 15:00"

### Step 7: Review and Submit
1. Check all fields for accuracy
2. Ensure no speculation or emotion
3. Verify all times are correct
4. Click **"Create Incident"**

### Step 8: Understanding Entry Types
- **Contemporaneous** (✅ best): Logged as it happens
- **Retrospective** (📝): Added later (explain why)

If you're logging retrospectively:
1. System will mark it with 🕓 icon
2. Add justification in provided field
3. Example: "Logged 30 minutes after event due to treating patient"

**🎯 Mastered!** You now know professional structured logging.

---

## Tutorial 3: Managing Staff and Callsigns

**Time:** 10 minutes  
**Difficulty:** Intermediate  
**Role Required:** Silver or higher

### Part A: Adding New Staff

#### Step 1: Navigate to Staff Management
1. Click **Staff** in main navigation
2. You'll see the staffing center

#### Step 2: Add New Staff Member
1. Click **"+ Add Staff"** button
2. Fill in details:
   - Full Name
   - Email address
   - Phone number
   - Role (Operator, Silver, Gold, etc.)

#### Step 3: Assign Role
Different roles have different permissions:
- **Operator**: Basic logging
- **Silver**: Can assign incidents
- **Gold**: Analytics access
- **Admin**: System configuration

#### Step 4: Save Staff Member
1. Click **"Save"**
2. Staff member receives welcome email

### Part B: Assigning Callsigns

#### Step 1: Navigate to Callsign Assignment
1. Click **Callsign Assignment** in navigation
2. View all active staff

#### Step 2: Choose Callsign Template
Templates available:
- **Alpha Team**: Alpha 1, Alpha 2, Alpha 3...
- **Colour Team**: Red 1, Blue 1, Green 1...
- **Sector Team**: North 1, South 1, East 1...
- **Custom**: Design your own

#### Step 3: Assign Callsigns
1. Click **"Auto-Assign"** for automatic assignment
2. Or manually:
   - Click staff member
   - Enter callsign
   - Click **"Assign"**

#### Step 4: Print Callsign Cards
1. Select assigned staff
2. Click **"Print Callsign Cards"**
3. Physical cards can be issued to staff

### Part C: Radio Sign Out

#### Step 1: Staff Signs Out Radio
1. Navigate to **Radio Sign Out** page
2. Enter callsign
3. Select radio number
4. Click **"Sign Out"**

#### Step 2: Tracking Radio Assignments
- View who has which radios
- See sign-out times
- Track returns

#### Step 3: Returning Radios
1. Navigate back to Radio Sign Out
2. Select callsign
3. Click **"Return Radio"**
4. System logs return time

**📡 Complete!** Staff and callsigns are now managed.

---

## Tutorial 4: Generating End-of-Event Reports

**Time:** 5 minutes  
**Difficulty:** Beginner  
**Role Required:** Silver or higher

### Step 1: Navigate to Analytics
1. Click **Analytics** in main menu
2. Wait for dashboards to load

### Step 2: Apply Filters
1. **Date Range**: Select your event dates
2. **Event**: Choose the specific event
3. **Incident Types**: Select which to include
4. **Staff**: Filter by specific team if needed

### Step 3: Review the Data
Quick checks before exporting:
- Total incident count
- Response times
- Peak hours
- Staff utilization

### Step 4: Open Export Modal
1. Look for **"Export Report"** button (top right)
2. Click to open export options

### Step 5: Configure Export
1. **Report Type**:
   - Executive Summary (1-2 pages)
   - Detailed Report (complete data)
   - Compliance Report (audit-ready)
   - Custom Report (choose sections)

2. **Format**:
   - PDF (formatted, print-ready)
   - CSV (spreadsheet data)
   - JSON (for integrations)

3. **Sections to Include**:
   - ☑ Incident Summary
   - ☑ Timeline
   - ☑ Heat Maps
   - ☑ Staff Performance
   - ☑ Response Times
   - ☑ Compliance Metrics

### Step 6: Add Branding (Optional)
- Upload your logo
- Add event name
- Include client information
- Custom footer text

### Step 7: Generate Report
1. Review your selections
2. Click **"Generate Report"**
3. Wait for processing (usually 10-30 seconds)

### Step 8: Download
1. Click **"Download"** when ready
2. Report saves to your downloads folder
3. Ready to share or print!

### Step 9: Schedule Automated Reports (Optional)
1. Click **"Schedule Report"**
2. Choose frequency:
   - End of each event
   - Daily at specific time
   - Weekly summary
   - Monthly overview
3. Enter email recipients
4. Click **"Save Schedule"**

**📊 Done!** Your professional report is ready.

---

## Tutorial 5: Setting Up Mobile PWA

**Time:** 3 minutes  
**Difficulty:** Beginner

### What is a PWA?
Progressive Web App - works like a native app but installed from the browser.

### For iPhone/iPad (iOS)

#### Step 1: Open Safari
1. Open Safari browser (must be Safari!)
2. Navigate to your inCommand URL

#### Step 2: Access Share Menu
1. Tap the **Share** button (square with arrow)
2. Located at bottom of screen

#### Step 3: Add to Home Screen
1. Scroll down in share menu
2. Tap **"Add to Home Screen"**

#### Step 4: Customize Name
1. Edit name if desired (or keep "inCommand")
2. Tap **"Add"** (top right)

#### Step 5: Launch App
1. Find inCommand icon on your home screen
2. Tap to launch
3. Works like a native app!

### For Android

#### Step 1: Open Chrome
1. Open Chrome browser
2. Navigate to your inCommand URL

#### Step 2: Access Menu
1. Tap the **three dots** (top right)
2. Menu will open

#### Step 3: Install App
1. Look for **"Install app"** or **"Add to Home screen"**
2. Tap it

#### Step 4: Confirm Installation
1. Popup will appear
2. Tap **"Install"** or **"Add"**

#### Step 5: Launch App
1. App icon appears on home screen
2. Tap to launch

### Enabling Notifications

#### Step 1: First Launch Prompt
1. On first app launch, you'll see notification prompt
2. Tap **"Allow"** to enable

#### Step 2: If You Missed It
**iOS:**
1. Settings > inCommand
2. Enable Notifications

**Android:**
1. Long-press app icon
2. App info > Notifications
3. Enable

**🎉 Installed!** inCommand now works like a native app.

---

## Tutorial 6: Using Voice Input

**Time:** 2 minutes  
**Difficulty:** Beginner

### Prerequisites
- Mobile device with microphone
- Microphone permission granted
- Internet connection

### Step 1: Enable Microphone Permission
**First Time Only:**
1. Tap microphone icon
2. Browser will ask for microphone access
3. Tap **"Allow"**

### Step 2: Start Voice Input
1. Open incident creation or log entry form
2. Look for **microphone icon** 🎤
3. Tap the icon
4. Icon will turn red (recording)

### Step 3: Speak Your Entry
Speak clearly and naturally:

**Example 1: Creating Incident**
> "Create medical incident at main stage. Male patient, approximately 30 years old, conscious and breathing. Visible injury to left arm."

**Example 2: Updating Incident**
> "Medical team arrived at fourteen thirty-five. Patient assessed and transported to first aid tent. Vital signs stable."

**Tips:**
- Speak at normal pace
- Pause briefly between thoughts
- Say "comma" or "period" for punctuation
- Say numbers clearly ("fourteen thirty-five")

### Step 4: Stop Recording
1. Tap microphone icon again
2. Or say **"Stop recording"**
3. Icon returns to normal color

### Step 5: Review Transcription
1. Text appears in the field
2. Review for accuracy
3. Edit any mistakes manually

### Step 6: AI Structuring (Structured Template)
If using structured template:
1. AI automatically extracts:
   - Headline from your speech
   - Facts observed
   - Actions taken
   - Outcome
2. Review AI's structuring
3. Adjust if needed

### Step 7: Submit
1. Click **"Submit"** or **"Create"**
2. Entry is logged

### Voice Commands
You can also use voice for navigation:

- "Show all incidents"
- "Open analytics"
- "Go to staff page"
- "Create new incident"
- "Search for [query]"

**🎤 Perfect!** Hands-free incident logging achieved.

---

## Tutorial 7: Creating Custom Analytics Dashboards

**Time:** 10 minutes  
**Difficulty:** Advanced  
**Role Required:** Gold or higher

### Step 1: Navigate to Custom Metrics
1. Go to **Analytics**
2. Click **"Custom Metrics"** tab
3. Click **"+ New Metric"** button

### Step 2: Name Your Metric
1. **Metric Name**: e.g., "Medical Response Time"
2. **Description**: What this metric measures
3. **Category**: Choose or create category

### Step 3: Define the Calculation

#### Example: Average Medical Response Time
1. **Calculation Type**: Average
2. **Field**: `response_time_minutes`
3. **Filter**: `type = 'Medical'`
4. **Time Range**: Last 7 days

#### Available Calculation Types:
- Count
- Sum
- Average
- Minimum
- Maximum
- Percentage
- Custom Formula

### Step 4: Add Filters
1. Click **"Add Filter"**
2. Choose field to filter by:
   - Incident Type
   - Priority
   - Status
   - Date Range
   - Assigned Staff
   - Location
3. Set filter value
4. Add multiple filters if needed

### Step 5: Choose Visualization
1. **Chart Type**:
   - Line Chart (trends over time)
   - Bar Chart (comparisons)
   - Pie Chart (proportions)
   - Number Card (single value)
   - Table (detailed data)

2. **Display Options**:
   - Colors
   - Labels
   - Legend position
   - Grid lines

### Step 6: Set Refresh Rate
1. **Update Frequency**:
   - Real-time (every 30 seconds)
   - Every 1 minute
   - Every 5 minutes
   - Every 15 minutes
   - Manual only

### Step 7: Save Metric
1. Review configuration
2. Click **"Save Metric"**
3. Metric is now available

### Step 8: Create Custom Dashboard

#### Method 1: Drag and Drop
1. Go to **"Custom Dashboards"** tab
2. Click **"+ New Dashboard"**
3. Name your dashboard
4. Drag metrics from library onto canvas
5. Resize and arrange as desired

#### Method 2: Template-Based
1. Click **"Use Template"**
2. Choose pre-built template:
   - Medical Response Dashboard
   - Security Incident Overview
   - Staffing Performance
   - Executive Summary
3. Customize with your metrics

### Step 9: Configure Dashboard Layout
1. **Grid Size**: Choose columns (2, 3, or 4)
2. **Spacing**: Tight, normal, or loose
3. **Theme**: Match system or custom

### Step 10: Share Dashboard
1. Click **"Share"** button
2. Options:
   - **Public Link**: Anyone with link can view
   - **Email**: Send to specific people
   - **Embed Code**: Put on external website
   - **Export**: Download as PDF/image

### Step 11: Schedule Updates
1. Click **"Schedule"**
2. Choose frequency (daily, weekly, monthly)
3. Select recipients
4. Dashboard emails automatically

**📈 Excellent!** Your custom analytics dashboard is live.

---

## Tutorial 8: Setting Up Automation Workflows

**Time:** 15 minutes  
**Difficulty:** Advanced  
**Role Required:** Admin

### What Are Workflows?
Automated actions triggered by specific conditions.

### Example: Auto-Escalate Critical Incidents

#### Step 1: Navigate to Automation
1. Click **Settings** (gear icon)
2. Select **"Automation"**
3. Click **"+ New Workflow"**

#### Step 2: Name and Describe
1. **Workflow Name**: "Auto-Escalate Critical Medical"
2. **Description**: "Automatically escalate critical medical incidents to Gold command"
3. **Status**: Active

#### Step 3: Define the Trigger
1. **Trigger Type**: Incident Created
2. **Conditions**:
   - Field: `type`
   - Operator: `equals`
   - Value: `Medical`
   - AND
   - Field: `priority`
   - Operator: `equals`
   - Value: `Critical`

#### Step 4: Add Actions
**Action 1: Assign to Gold Commander**
1. Click **"+ Add Action"**
2. Action Type: Assign Incident
3. Assign To: Gold Commander role
4. Priority: Immediate

**Action 2: Send Notifications**
1. Click **"+ Add Action"**
2. Action Type: Send Notification
3. Recipients: Gold Commander, Medical Lead
4. Channel: SMS + Push Notification
5. Message Template:
   ```
   🚨 CRITICAL MEDICAL INCIDENT
   ID: {{incident.id}}
   Location: {{incident.location}}
   Details: {{incident.headline}}
   ```

**Action 3: Create Task**
1. Click **"+ Add Action"**
2. Action Type: Create Task
3. Task Title: "Review Critical Medical: {{incident.id}}"
4. Assign To: Gold Commander
5. Due: Immediate

#### Step 5: Add Delays (Optional)
**Example: Follow-up if not resolved**
1. Click **"+ Add Delay"**
2. Wait Time: 15 minutes
3. Condition: If status still "Open"
4. Then: Send reminder notification

#### Step 6: Test the Workflow
1. Click **"Test Workflow"**
2. System simulates the trigger
3. Review test results
4. Check all actions fire correctly

#### Step 7: Activate
1. Toggle **"Active"** to ON
2. Click **"Save Workflow"**
3. Workflow is now live

### More Workflow Examples

#### Auto-Close Resolved Incidents
**Trigger**: Incident status changed to "Resolved"  
**Action**: Wait 24 hours, then auto-close

#### Staff Check-in Reminder
**Trigger**: Event start time -2 hours  
**Action**: Send SMS to all assigned staff

#### Daily Summary Report
**Trigger**: Every day at 08:00  
**Action**: Generate report and email to managers

#### Resource Low Alert
**Trigger**: First aid supplies < 20%  
**Action**: Alert logistics team

**🤖 Automated!** Your workflows are now saving time.

---

## Tutorial 9: Configuring Notifications

**Time:** 5 minutes  
**Difficulty:** Intermediate

### Part A: Personal Notification Preferences

#### Step 1: Open Settings
1. Click your **profile icon** (top right)
2. Select **"Settings"**
3. Click **"Notifications"** tab

#### Step 2: Choose Channels
Enable/disable notification channels:
- ☑ **Push Notifications**: In-app alerts
- ☑ **Email**: Sent to your email address
- ☑ **SMS**: Text messages (requires phone number)
- ☐ **Desktop**: Browser notifications

#### Step 3: Configure Triggers
Choose what triggers notifications:

**Incidents:**
- ☑ New incident created
- ☑ Incident assigned to me
- ☑ Critical incident (any)
- ☐ All incident updates
- ☑ My incidents updated

**Staff:**
- ☑ Shift starting soon (30 min before)
- ☑ Staff member requests help
- ☐ Team member status change

**System:**
- ☑ System alerts
- ☑ Low resources
- ☐ New features available

#### Step 4: Set Quiet Hours
1. Enable **"Quiet Hours"**
2. Start Time: 22:00
3. End Time: 07:00
4. Exceptions:
   - ☑ Still notify for Critical incidents
   - ☑ Still notify if I'm on-duty

#### Step 5: Notification Frequency
- **Immediate**: Get notified instantly
- **Digest**: Bundle notifications
  - Every 15 minutes
  - Every hour
  - Daily summary

#### Step 6: Test Notifications
1. Click **"Send Test Notification"**
2. Check you receive it
3. Adjust settings if needed

### Part B: System-Wide Notification Rules (Admin)

#### Step 1: Navigate to System Settings
1. **Settings** > **"System"**
2. **"Notifications"** section

#### Step 2: Configure Default Rules
**For All Users:**
- Critical incidents always notify everyone on-duty
- Incident assignments always notify assigned person
- Event start/end notifications

#### Step 3: Role-Based Rules
**Gold Command:**
- All critical incidents
- Escalated incidents
- System alerts

**Silver:**
- Incidents in their sector
- Staff issues
- Resource alerts

**Operators:**
- Their assigned incidents
- Direct mentions
- Shift reminders

#### Step 4: External Webhooks
1. **"Add Webhook"** button
2. Enter webhook URL
3. Choose events to send
4. Configure payload format

#### Step 5: Save Settings
1. Review all configurations
2. Click **"Save Changes"**
3. Test with sample notifications

**🔔 Configured!** Notifications are now personalized.

---

## Tutorial 10: Using the AI Assistant

**Time:** 5 minutes  
**Difficulty:** Beginner

### Step 1: Open AI Chat
1. Look for **AI chat bubble** icon (bottom right)
2. Click to open chat panel
3. AI assistant greets you

### Step 2: Basic Queries

#### Ask About Current Status
**You**: "What's happening right now?"  
**AI**: Shows summary of active incidents, staff on duty, current trends

#### Ask About Specific Incidents
**You**: "Tell me about incident 42"  
**AI**: Provides complete incident details, status, timeline

#### Search for Incidents
**You**: "Find all medical incidents in Zone A today"  
**AI**: Returns filtered list with links

### Step 3: Get Recommendations

#### Staffing Recommendations
**You**: "Do we have enough staff for tonight?"  
**AI**: Analyzes predicted demand vs. current staffing, suggests adjustments

#### Incident Patterns
**You**: "Are there any concerning trends?"  
**AI**: Identifies patterns, anomalies, areas needing attention

### Step 4: Generate Summaries

#### Quick Incident Summary
**You**: "Summarize incident 42 for handover"  
**AI**: Generates concise, professional summary

#### Shift Handover
**You**: "Create handover brief for night shift"  
**AI**: Compiles all relevant information, ongoing incidents, pending actions

### Step 5: Predictive Questions

#### Forecast Incidents
**You**: "Predict incident volume for Saturday"  
**AI**: Uses historical data + external factors for forecast

#### Resource Predictions
**You**: "Will we need more medical staff tomorrow?"  
**AI**: Analyzes trends and provides recommendation

### Step 6: Natural Language Commands

#### Create Incident
**You**: "Create a medical incident at Gate 3, male patient, conscious"  
**AI**: Extracts info, creates incident, confirms with you

#### Update Status
**You**: "Mark incident 42 as resolved"  
**AI**: Updates status, asks if you want to add closing notes

### Step 7: Ask for Help

#### How-To Questions
**You**: "How do I generate an end-of-event report?"  
**AI**: Provides step-by-step guide

#### Feature Discovery
**You**: "What new features are available?"  
**AI**: Lists recent updates with quick demos

### Step 8: Complex Analysis

#### Multi-Factor Analysis
**You**: "Why are medical incidents higher on Saturdays?"  
**AI**: Analyzes multiple factors (attendance, weather, events, trends)

#### Comparative Analysis
**You**: "Compare this event to last month"  
**AI**: Provides detailed comparison with insights

### Advanced Tips

**Context Awareness:**
AI remembers your conversation, so you can ask follow-up questions:
- **You**: "What about incident 42?"
- **AI**: [provides info]
- **You**: "Show me similar incidents"
- **AI**: [knows you mean similar to 42]

**Multi-Step Tasks:**
- **You**: "Create incident, assign to John, and notify Gold"
- **AI**: Executes all steps, confirms each

**Export Conversations:**
- Click **"Export Chat"**
- Save AI insights for reports

**Voice Input:**
- Click **microphone icon**
- Speak your question
- AI responds with voice + text

**🤖 Mastered!** The AI assistant is now your command center copilot.

---

## Need More Help?

### Video Tutorials
- [Creating Incidents](video-link)
- [Structured Logging](video-link)
- [Mobile PWA Setup](video-link)
- [Analytics Deep Dive](video-link)

### Documentation
- [User Guide](USER_GUIDE.md)
- [Admin Guide](ADMIN_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Troubleshooting](TROUBLESHOOTING.md)

### Support
- **Email**: support@incommand.app
- **Chat**: In-app live chat
- **Phone**: [Your support number]

---

**Happy Learning! 🎓**


