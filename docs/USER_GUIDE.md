# inCommand User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Incident Management](#incident-management)
4. [Analytics & Reporting](#analytics--reporting)
5. [AI Features](#ai-features)
6. [Mobile Features](#mobile-features)
7. [Collaboration Tools](#collaboration-tools)
8. [Settings & Preferences](#settings--preferences)

---

## Getting Started

### First Login

1. Navigate to your inCommand instance (e.g., `https://your-domain.com`)
2. Log in with your credentials
3. Complete your profile setup if prompted
4. Familiarize yourself with the dashboard

### User Roles

- **Operator**: Basic incident logging and viewing
- **Silver**: Advanced features + incident assignment
- **Gold**: Full control + analytics access
- **Admin**: System configuration + user management
- **Superadmin**: Complete system access

---

## Dashboard Overview

### Main Dashboard

The dashboard is your command center, providing real-time visibility into:

#### Key Performance Indicators (KPIs)
- **Active Incidents**: Current open incidents requiring attention
- **Response Time**: Average time from incident creation to first response
- **Staff On Duty**: Number of staff members currently active
- **Incidents Today**: Total incidents logged in the current day

#### Live Analytics
- Real-time incident trends with sparkline charts
- Peak hour analysis
- Resource utilization metrics
- Log quality scoring

#### Quick Actions
- ➕ Create New Incident
- 📋 View All Incidents
- 👥 Check Staff Availability
- 📊 View Analytics

### Navigation

- **Left Sidebar**: Primary navigation menu
- **Top Bar**: Search, notifications, profile menu
- **Bottom Nav** (Mobile): Quick access to key features

---

## Incident Management

### Creating an Incident

#### Standard Mode
1. Click **"+ New Incident"** button
2. Fill in required fields:
   - **Title**: Brief description
   - **Type**: Category (Medical, Security, etc.)
   - **Priority**: Low, Medium, High, Critical
   - **Location**: Where the incident occurred
   - **Description**: Detailed information

#### Structured Logging Mode ⭐ NEW
For professional, auditable incident logs:

1. Enable **"Use Professional Logging Template"**
2. Fill structured fields:
   - **Headline** (≤15 words): Brief factual summary
   - **Source**: Who reported it (callsign, person, camera)
   - **Facts Observed**: Only verifiable, objective facts
   - **Actions Taken**: What you did in response
   - **Outcome**: Result of actions taken

**Tips for Structured Logging:**
- ✅ DO: "Male, 30s, unresponsive. Pulse weak."
- ❌ DON'T: "Guy looked really sick and worried."
- Keep to facts, avoid speculation or emotion
- Use timestamps for each action
- Reference staff by callsign

### Viewing Incidents

#### Incident Board
- **List View**: Detailed table with all incidents
- **Stats Sidebar**: Real-time metrics and trends
- **Filters**: By status, priority, type, date range
- **Search**: Full-text search across all fields

#### Incident Details
Click any incident to view:
- Complete incident history
- All log entries (with amendments marked)
- Assigned staff members
- Location information (GPS if available)
- Attached photos
- AI-generated summaries

### Updating Incidents

#### Adding Log Entries
1. Open incident details
2. Click **"Add Log Entry"**
3. Use structured template for professional logs
4. Submit entry

**Entry Types:**
- **Contemporaneous**: Logged as events happen (gold standard)
- **Retrospective**: Added later (requires justification)

#### Amending Entries
inCommand uses non-destructive amendments:
1. Select the entry to amend
2. Click **"Amend"**
3. Add correction or additional information
4. Original entry remains visible with amendment appended

**Audit Trail:**
- All amendments are timestamped
- Original content is never deleted
- Full revision history is always visible

### Status Management

**Available Statuses:**
- 🔴 **Open**: Active incident
- 🟡 **In Progress**: Being handled
- 🟢 **Resolved**: Completed successfully
- ⚪ **Closed**: Finalized
- ⏸️ **On Hold**: Temporarily paused
- ❌ **Cancelled**: No longer valid

### Priority Levels

- 🔴 **Critical**: Immediate life-threatening situation
- 🟠 **High**: Urgent, requires quick response
- 🟡 **Medium**: Important, standard timeline
- 🟢 **Low**: Non-urgent, routine matter

---

## Analytics & Reporting

### Analytics Dashboard

Access via **Analytics** menu or **📊** icon

#### Available Dashboards

1. **Log Quality Dashboard**
   - Completeness scoring
   - Validation trends
   - Entry quality metrics
   - Compliance indicators

2. **Compliance Dashboard**
   - JESIP/JDM alignment
   - Audit readiness
   - Policy adherence
   - Licensing reports

3. **User Activity Dashboard**
   - Entries per hour
   - Retrospective rate
   - Most active operators
   - Session analytics

4. **AI Insights Dashboard** ⭐ NEW
   - Trend detection
   - Anomaly alerts
   - Predictive analytics
   - Smart recommendations

5. **Custom Metrics** ⭐ NEW
   - Build your own metrics
   - Custom dashboards
   - Saved queries
   - Scheduled reports

### Generating Reports

1. Navigate to Analytics
2. Select desired dashboard
3. Apply filters (date range, users, types)
4. Click **"Export Report"**
5. Choose format:
   - **PDF**: Formatted report with charts
   - **CSV**: Raw data for spreadsheets
   - **JSON**: Structured data for integrations

### Benchmarking ⭐ NEW

Compare your performance against:
- **Industry Standards**: UK events sector benchmarks
- **Your Historical Data**: Month-over-month comparisons
- **Similar Events**: Peer comparison
- **Custom Baselines**: Set your own targets

---

## AI Features

### AI Assistant 🤖 ⭐ NEW

Your intelligent command center copilot

**How to Use:**
1. Click the **AI chat bubble** (bottom right)
2. Ask questions in natural language
3. Get instant answers and recommendations

**Example Queries:**
- "What's the busiest time today?"
- "Show me all medical incidents in Zone A"
- "Predict staffing needs for tonight"
- "Generate incident summary for handover"

### AI-Powered Features

#### Trend Detection
- Automatically identifies incident patterns
- Alerts to emerging issues
- Confidence scoring

#### Anomaly Detection
- Flags unusual spikes or drops
- Pattern break alerts
- Unusual timing indicators

#### Auto-Categorization
- Suggests incident types
- Priority recommendations
- Resource allocation hints

#### Risk Prediction
- Multi-factor analysis
- Mitigation suggestions
- Escalation forecasting

#### Natural Language Search
- Semantic search across all data
- "Find incidents similar to..."
- Relevance scoring

---

## Mobile Features

### Progressive Web App (PWA)

inCommand works offline and can be installed on your phone:

1. Open inCommand in mobile browser
2. Tap browser menu
3. Select **"Add to Home Screen"**
4. App installs like native app

### Offline Mode ⭐ NEW

Continue working without internet:
- Create incidents offline
- Add log entries
- Upload photos
- Data syncs automatically when online

### Voice Input 🎤 ⭐ NEW

Hands-free incident logging:
1. Tap microphone icon
2. Speak your log entry
3. AI transcribes and structures
4. Review and submit

**Voice Commands:**
- "Create medical incident at Gate 3"
- "Update incident 42 status to resolved"
- "Show me all open incidents"

### Photo Attachments 📷 ⭐ NEW

1. Open incident
2. Tap camera icon
3. Take photo or select from gallery
4. Photo uploads with GPS location
5. Auto-compressed for fast uploads

### GPS Location 📍 ⭐ NEW

Automatic location capture:
- GPS coordinates
- What3Words address
- Reverse geocoding (street address)
- Location history

### Quick Actions ⭐ NEW

Floating action button for one-tap access:
- Quick incident creation
- Emergency alerts
- Staff check-in
- Location sharing

---

## Collaboration Tools

### Live Chat ⭐ NEW

Real-time team communication:
1. Click **Chat** icon
2. Select channel or create new
3. Send messages, files, locations
4. Thread conversations per incident

### Tactical Maps 🗺️ ⭐ NEW

Visual incident management:
- Interactive venue map
- Real-time incident plotting
- Staff location tracking
- Zone management
- Heat maps

### Collaborative Notes ⭐ NEW

Shared note-taking:
- Real-time editing
- Version history
- @mentions
- Incident linking

### Command Hierarchy ⭐ NEW

Visual org chart:
- Chain of command
- Presence indicators
- Contact quick-actions
- Role assignments

### Video Conferencing 🎥 ⭐ NEW

Integrated video calls:
- One-click incident briefings
- Screen sharing
- Recording capability
- Participant management

---

## Settings & Preferences

### User Preferences

**Appearance:**
- Dark/Light mode
- Theme colors
- Font size
- Layout density

**Notifications:**
- Push notifications
- Email alerts
- SMS notifications
- Custom triggers

**Logging Preferences:**
- Default to structured template
- Auto-save drafts
- Entry templates
- Validation strictness

### System Settings (Admin Only)

**Event Configuration:**
- Event name and details
- Operating hours
- Venue information
- Capacity settings

**User Management:**
- Add/remove users
- Assign roles
- Permission groups
- Callsign assignment

**Integration Settings:**
- Email/SMS providers
- Webhook endpoints
- API keys
- External services

**Backup & Restore:**
- Automatic backups
- Manual export
- Data retention
- Restore points

---

## Best Practices

### Professional Logging

✅ **DO:**
- Log contemporaneously (as events happen)
- Use structured template for important incidents
- Stick to observable facts
- Use callsigns and timestamps
- Review logs before handover

❌ **DON'T:**
- Use emotional language
- Speculate or assume
- Delete or hide information
- Delay logging critical incidents
- Use informal language

### Incident Management

✅ **DO:**
- Assign appropriate priority
- Update status promptly
- Use GPS location features
- Attach photos for evidence
- Close incidents when resolved

❌ **DON'T:**
- Leave incidents open indefinitely
- Change priority without reason
- Forget to log handovers
- Miss critical details

### Security & Compliance

✅ **DO:**
- Log out when finished
- Use strong passwords
- Report security concerns
- Follow GDPR guidelines
- Maintain audit trails

❌ **DON'T:**
- Share login credentials
- Leave device unattended
- Delete audit records
- Bypass security protocols

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New incident
- `Ctrl/Cmd + /`: Command palette
- `Ctrl/Cmd + D`: Toggle dark mode
- `Ctrl/Cmd + ,`: Settings
- `Esc`: Close modal

---

## Getting Help

### In-App Help
- Click **Help** icon (?)
- Search help articles
- View video tutorials
- Contact support

### Support Channels
- **Email**: support@incommand.app
- **Phone**: [Your support number]
- **Chat**: Live chat in app
- **Documentation**: docs.incommand.app

### Training Resources
- Video tutorials: [Link to videos]
- PDF guides: Available in Help section
- Training mode: Practice safely
- Webinars: [Schedule link]

---

## Frequently Asked Questions

**Q: Can I use inCommand offline?**
A: Yes! The PWA works offline. Data syncs when you reconnect.

**Q: How long are incidents stored?**
A: Indefinitely, with automatic archival of old incidents.

**Q: Can I export my data?**
A: Yes, via Analytics > Export or Settings > Backup.

**Q: Is there a mobile app?**
A: Yes, install the PWA or use our React Native app (coming soon).

**Q: How do I amend a log entry?**
A: Click the entry, select "Amend", add your correction. Original remains visible.

**Q: What happens to retrospective entries?**
A: They're marked with a 🕓 icon and require justification for audit purposes.

**Q: Can I customize dashboards?**
A: Yes! Use Custom Metrics builder in Analytics.

**Q: How secure is my data?**
A: Military-grade encryption, SOC 2 compliance, regular audits. See Security documentation.

---

**For more information, visit our [Documentation Portal](https://docs.incommand.app) or contact support.**

