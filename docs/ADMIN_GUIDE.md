# inCommand Administrator Guide

Complete system configuration and management guide for administrators

## Table of Contents

1. [Initial System Setup](#initial-system-setup)
2. [User Management](#user-management)
3. [Organization Configuration](#organization-configuration)
4. [Event Management](#event-management)
5. [Integration Configuration](#integration-configuration)
6. [Security & Permissions](#security--permissions)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Monitoring](#performance-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Initial System Setup

### First-Time Administrator Setup

#### Step 1: Access Admin Panel
1. Log in with superadmin credentials
2. Click **"Admin"** in main navigation
3. You'll see the admin dashboard

#### Step 2: System Configuration
Navigate to **Settings > System Settings**

**Basic Configuration:**
```
Organization Name: Your Organization
System URL: https://your-domain.com
Support Email: support@your-domain.com
Time Zone: Europe/London
Date Format: DD/MM/YYYY
Time Format: 24-hour
```

#### Step 3: Email Configuration
**SMTP Settings:**
```
SMTP Host: smtp.your-provider.com
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP Username: your-email@domain.com
SMTP Password: [your-password]
From Address: noreply@your-domain.com
From Name: inCommand System
```

**Test Email:**
1. Enter test recipient email
2. Click **"Send Test Email"**
3. Verify receipt

#### Step 4: Storage Configuration
**Supabase Storage:**
```
Project URL: https://your-project.supabase.co
API Key: [Your Supabase anon key]
Service Role Key: [Your service role key]
Storage Bucket: incommand-files
```

#### Step 5: Feature Flags
Enable/disable platform features:
- ☑ AI Assistant
- ☑ Voice Input
- ☑ Offline Mode
- ☑ GPS Tracking
- ☑ Photo Attachments
- ☑ Video Conferencing
- ☑ Blockchain Audit Trail

---

## User Management

### Adding Users

#### Individual User Creation
1. **Admin > Users > Add User**
2. Fill in details:
   ```
   Full Name: John Smith
   Email: john.smith@company.com
   Phone: +44 7XXX XXXXXX
   Role: operator | silver | gold | admin | superadmin
   ```
3. Click **"Create User"**
4. User receives invitation email

#### Bulk User Import
1. **Admin > Users > Bulk Import**
2. Download CSV template
3. Fill template:
   ```csv
   name,email,phone,role,callsign
   John Smith,john@company.com,+447XXXXXXX,operator,Alpha 1
   Jane Doe,jane@company.com,+447XXXXXXX,silver,Alpha 2
   ```
4. Upload completed CSV
5. Review import preview
6. Click **"Import Users"**

### Role Management

#### Permission Levels

**Operator** (Basic User)
- Create incidents
- Update own incidents
- View all incidents
- Basic reporting

**Silver** (Supervisor)
- All Operator permissions
- Assign incidents to staff
- Manage staff in their sector
- Advanced reporting
- Export data

**Gold** (Commander)
- All Silver permissions
- Full incident management
- Analytics access
- Custom dashboards
- System configuration (limited)

**Admin** (System Administrator)
- All Gold permissions
- User management
- System configuration
- Integration setup
- Backup/restore

**Superadmin** (Platform Owner)
- Complete system access
- Multi-tenant management
- Billing configuration
- Plugin installation
- Database access

#### Custom Roles
1. **Admin > Roles > Create Custom Role**
2. Name: e.g., "Medical Lead"
3. Base permissions on existing role
4. Add/remove specific permissions:
   - ☑ View all medical incidents
   - ☑ Assign medical staff
   - ☑ Access medical analytics
   - ☐ System configuration

### User Groups
1. **Admin > Groups > Create Group**
2. Name: e.g., "Medical Team"
3. Add members
4. Set group permissions
5. Assign group to incidents in bulk

---

## Organization Configuration

### Multi-Tenant Setup

#### Creating Organizations
1. **Admin > Organizations > Create**
2. Fill details:
   ```
   Organization Name: ABC Events Ltd
   Subdomain: abc-events
   Industry: Events & Entertainment
   Size: 50-200 employees
   Subscription Tier: Professional
   ```

#### Organization Settings
**Per-Organization Configuration:**
- Custom branding (logo, colors)
- Feature access based on subscription
- Data isolation
- Separate billing

#### White-Label Configuration
1. **Admin > Branding**
2. Upload logo (recommended: 200x50px PNG)
3. Choose colors:
   - Primary Color: #1E40AF
   - Secondary Color: #10B981
   - Accent Color: #F59E0B
4. Custom domain setup (requires DNS configuration)
5. Email template customization

---

## Event Management

### Creating Events

#### Basic Event Setup
1. **Admin > Events > Create Event**
2. Fill event details:
   ```
   Event Name: Summer Music Festival 2025
   Date: 01/07/2025 - 03/07/2025
   Venue: Hyde Park, London
   Expected Attendance: 50,000
   Event Type: Music Festival
   ```

#### Venue Configuration
**Venue Details:**
```
Venue Name: Hyde Park
Address: Hyde Park, London W2 2UH
GPS Coordinates: 51.5074° N, 0.1657° W
Capacity: 50,000
Zones: Main Stage, North Field, South Field, VIP Area
```

**Upload Venue Map:**
1. Prepare venue map image (PNG/JPG)
2. Upload via **"Upload Map"**
3. Mark zones on map
4. Set GPS boundaries for each zone

#### Staffing Configuration
**Staff Requirements:**
```
Total Staff: 150
Security: 50
Medical: 20
Operations: 30
Hospitality: 30
Management: 20
```

**Shift Patterns:**
- Morning: 08:00 - 16:00
- Afternoon: 14:00 - 22:00
- Night: 20:00 - 04:00

#### Resource Allocation
**Medical Resources:**
- First Aid Stations: 5
- Ambulances: 2
- Paramedics: 10
- First Aiders: 20

**Security Resources:**
- Entry Gates: 8
- CCTV Cameras: 50
- Radio Channels: 5
- Patrol Units: 10

---

## Integration Configuration

### Email/SMS Providers

#### Email Services

**Option 1: Resend (Recommended)**
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. **Admin > Integrations > Email**
4. Select **"Resend"**
5. Enter API key
6. Verify domain
7. Test configuration

**Option 2: SendGrid**
```
API Key: SG.XXXXXXXXXXXXXXXXXXXXXXXX
Sender Email: noreply@your-domain.com
Sender Name: inCommand
```

**Option 3: AWS SES**
```
AWS Region: eu-west-2
AWS Access Key ID: AKIA...
AWS Secret Access Key: [secret]
```

#### SMS Services

**Option 1: Twilio**
```
Account SID: AC...
Auth Token: [token]
Phone Number: +44 7XXX XXXXXX
```

**Option 2: AWS SNS**
```
AWS Region: eu-west-2
AWS Access Key ID: AKIA...
AWS Secret Access Key: [secret]
```

**Option 3: MessageBird**
```
API Key: [your-key]
Originator: inCommand
```

### Webhook Configuration

#### Setting Up Webhooks
1. **Admin > Integrations > Webhooks**
2. Click **"Add Webhook"**
3. Configure:
   ```
   Name: Slack Notifications
   URL: https://hooks.slack.com/services/...
   Events: incident_created, incident_critical
   Method: POST
   Headers:
     Content-Type: application/json
   Authentication: Bearer [token]
   ```

#### Webhook Events
Available webhook events:
- `incident.created`
- `incident.updated`
- `incident.resolved`
- `incident.critical`
- `staff.checked_in`
- `staff.checked_out`
- `resource.low`
- `alert.triggered`

#### Webhook Payload Example
```json
{
  "event": "incident.created",
  "timestamp": "2025-01-10T14:30:00Z",
  "data": {
    "id": 42,
    "title": "Medical Incident - Main Stage",
    "type": "Medical",
    "priority": "High",
    "status": "Open",
    "location": "Main Stage",
    "created_by": "Alpha 1"
  }
}
```

### API Configuration

#### Generating API Keys
1. **Admin > Integrations > API**
2. Click **"Generate API Key"**
3. Name: e.g., "External Dashboard"
4. Permissions:
   - ☑ Read incidents
   - ☑ Read analytics
   - ☐ Write incidents
   - ☐ User management
5. Set rate limit: 1000 requests/hour
6. Click **"Generate"**
7. **Copy key immediately** (shown only once)

#### API Documentation
- Endpoint: `https://your-domain.com/api/v1`
- Authentication: `Authorization: Bearer YOUR_API_KEY`
- Rate Limit: 1000 requests/hour
- Full docs: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### Third-Party Integrations

#### Slack Integration
1. Create Slack app at [api.slack.com](https://api.slack.com)
2. Add webhook URL to your workspace
3. Copy webhook URL
4. **Admin > Integrations > Slack**
5. Paste webhook URL
6. Choose notification triggers
7. Test integration

#### Microsoft Teams
Similar setup to Slack with Teams webhooks

#### Power BI / Tableau
1. **Admin > Integrations > BI Tools**
2. Enable API access
3. Generate read-only API key
4. Configure in your BI tool:
   - Data Source: REST API
   - URL: `https://your-domain.com/api/v1/analytics`
   - Auth: Bearer token

---

## Security & Permissions

### Access Control

#### Row-Level Security (RLS)
Supabase RLS policies are pre-configured but can be customized:

1. Access Supabase dashboard
2. Navigate to **Table Editor**
3. Select table
4. Click **"RLS"** tab
5. Review/edit policies

**Example Policy (Incidents):**
```sql
-- Users can only see incidents from their organization
CREATE POLICY "Users see own org incidents"
ON incidents FOR SELECT
USING (organization_id = auth.jwt() ->> 'organization_id');
```

#### API Security
- All API endpoints require authentication
- Rate limiting enabled (1000 req/hr default)
- CORS configured for allowed origins
- HTTPS enforced

#### Data Encryption
- **At Rest**: AES-256 encryption (Supabase default)
- **In Transit**: TLS 1.3
- **Backups**: Encrypted with separate key

### Audit Logging

#### View Audit Logs
1. **Admin > Audit Logs**
2. Filter by:
   - User
   - Action type
   - Date range
   - Resource type

#### Audit Log Retention
```
Default: 90 days
Compliance Mode: 7 years
Export: Available anytime
```

#### Blockchain Audit Trail (Optional)
For tamper-proof logging:
1. **Admin > Security > Blockchain**
2. Enable blockchain audit trail
3. Choose blockchain network
4. Configure hash frequency
5. All logs are cryptographically verified

### Compliance Features

#### GDPR Compliance
- User data export tool
- Right to be forgotten implementation
- Data processing agreements
- Cookie consent management

#### SOC 2 / ISO 27001
- Documented security controls
- Regular security assessments
- Incident response procedures
- Access logs and monitoring

---

## Backup & Recovery

### Automatic Backups

#### Backup Configuration
1. **Admin > Backup & Restore**
2. Enable automatic backups
3. Schedule:
   ```
   Frequency: Daily at 02:00 UTC
   Retention: 30 days
   Storage: Supabase + S3
   Encryption: Enabled
   ```

#### Backup Contents
- Database (all tables)
- Uploaded files (photos, documents)
- User configurations
- System settings

### Manual Backup

#### Create Manual Backup
1. **Admin > Backup & Restore**
2. Click **"Create Backup Now"**
3. Name backup (e.g., "Pre-upgrade-2025-01-10")
4. Select what to include:
   - ☑ Database
   - ☑ Files
   - ☑ Settings
5. Click **"Create Backup"**
6. Download backup file when ready

### Restoration

#### Restore from Backup
1. **Admin > Backup & Restore**
2. Click **"Restore"** tab
3. Select backup to restore
4. Choose restore options:
   - Full restore (replaces everything)
   - Selective restore (choose tables)
5. **Warning**: This will overwrite current data
6. Click **"Restore Backup"**
7. Confirm with password
8. Wait for restoration (may take several minutes)

### Data Export

#### Export All Data
1. **Admin > Data Export**
2. Choose format:
   - SQL dump
   - CSV files
   - JSON files
3. Select tables to export
4. Click **"Generate Export"**
5. Download when ready

---

## Performance Monitoring

### System Health Dashboard

#### Access Monitoring
1. Navigate to `/monitoring`
2. View real-time metrics:
   - Error rate
   - API response times
   - Active users
   - Database performance

#### Key Metrics

**Performance Metrics:**
- Page Load Time: Target < 2 seconds
- API Response Time: Target < 500ms
- Database Query Time: Target < 100ms

**Error Metrics:**
- Error Rate: Target < 0.1%
- Critical Errors: Target = 0
- Warning Rate: Monitor trend

**Usage Metrics:**
- Active Users (concurrent)
- Page Views per Hour
- Feature Adoption Rate
- Mobile vs Desktop Usage

### Performance Optimization

#### Database Optimization
1. **Admin > Performance > Database**
2. Run **"Analyze Slow Queries"**
3. Review query performance
4. Add indexes for slow queries
5. Optimize complex queries

#### Caching Configuration
```
Static Assets: CDN cached, 1 year
API Responses: Redis cache, 5 minutes
Page Content: Next.js cache, 10 minutes
```

#### CDN Setup (Optional)
1. Sign up for Cloudflare or similar
2. Point DNS to CDN
3. Configure caching rules
4. Enable auto-minification

---

## Troubleshooting

### Common Issues

#### Users Cannot Log In
**Check:**
1. Email verification status
2. Account active status
3. Password reset if needed
4. Role permissions

**Solution:**
```bash
# Reset user password
Admin > Users > [Select User] > Reset Password
```

#### Slow Performance
**Check:**
1. System Health Dashboard
2. Database query performance
3. Active users count
4. Error logs

**Solutions:**
- Add database indexes
- Optimize slow queries
- Scale Supabase instance
- Enable caching

#### Emails Not Sending
**Check:**
1. SMTP configuration
2. Email service status
3. Domain verification
4. Email queue

**Solution:**
```bash
Admin > Integrations > Email > Test Configuration
Review error logs for specific issues
```

#### Mobile PWA Not Installing
**Check:**
1. HTTPS enabled
2. Manifest.json correct
3. Service worker registered
4. Browser compatibility

**Solution:**
- Ensure HTTPS (required for PWA)
- Clear browser cache
- Re-register service worker

### Error Logs

#### Accessing Error Logs
1. **Admin > Monitoring > Error Tracking**
2. Filter by:
   - Severity (error, warning, info)
   - Component
   - Time range
   - User

#### Common Error Codes
```
AUTH001: Authentication failed
DB001: Database connection error
API001: API rate limit exceeded
UPLOAD001: File upload failed
PERMS001: Insufficient permissions
```

### Support Escalation

#### When to Escalate
- System outage > 15 minutes
- Data loss or corruption
- Security breach
- Critical bugs affecting operations

#### How to Escalate
1. **Email**: support@incommand.app (Priority Support)
2. **Phone**: [Emergency support number]
3. Include:
   - Organization ID
   - Error description
   - Steps to reproduce
   - Error logs (if available)
   - Impact assessment

---

## Advanced Configuration

### Environment Variables

#### Required Variables (`.env.local`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email
RESEND_API_KEY=re_...

# SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+44...

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...

# Maps & Location
MAPBOX_ACCESS_TOKEN=pk...
WHAT3WORDS_API_KEY=xxx

# Optional Services
SENTRY_DSN=https://...
STRIPE_SECRET_KEY=sk_live_...
```

### Custom Deployment

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Deploy to AWS/Azure
See `DEPLOYMENT_GUIDE.md` for detailed instructions

### Database Migrations

#### Running Migrations
```bash
# Via Supabase Dashboard
1. Go to SQL Editor
2. Paste migration SQL
3. Run query

# Via CLI
supabase db push
```

#### Creating Custom Migrations
```bash
# Create new migration
supabase migration new your_migration_name

# Edit file in supabase/migrations/
# Run migration
supabase db push
```

---

## Best Practices

### Security Best Practices
- ✅ Use strong, unique passwords
- ✅ Enable 2FA for admin accounts
- ✅ Regular security audits
- ✅ Keep software updated
- ✅ Monitor access logs
- ✅ Implement least-privilege access
- ✅ Regular backup verification

### Performance Best Practices
- ✅ Monitor system health daily
- ✅ Optimize slow queries
- ✅ Use CDN for static assets
- ✅ Enable caching appropriately
- ✅ Regular database maintenance
- ✅ Archive old data

### Operational Best Practices
- ✅ Document customizations
- ✅ Test before deploying
- ✅ Maintain backup schedule
- ✅ Train users properly
- ✅ Keep documentation updated
- ✅ Regular system audits

---

## Additional Resources

- [User Guide](USER_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Security Documentation](SECURITY_AUDIT.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

**Need Help?**
- Email: support@incommand.app
- Documentation: docs.incommand.app
- Community: community.incommand.app

---

**Administrator Guide Version 1.0**  
**Last Updated: January 2025**

