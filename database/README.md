# Support Tools Database Integration

This directory contains the database schema and operations for the Football Event Support Tools system.

## 🗄️ Database Schema

### Overview
All support tool data is scoped to `company_id` and `event_id` for multi-tenancy, ensuring data isolation between different companies and events.

### Tables

#### Stand Occupancy
- **`stands`** - Stand configuration (name, capacity, order)
- **`stand_occupancy`** - Live occupancy data with timestamps

#### Staffing Numbers  
- **`staffing_roles`** - Role definitions (name, planned count, icon, color)
- **`staffing_actuals`** - Actual staffing numbers with variance tracking

#### Fixture/Match Progress
- **`fixture_tasks`** - Task definitions (minute, description, assigned role)
- **`fixture_completions`** - Task completion status with timestamps

#### Crowd Movement & Gate Status
- **`gates`** - Gate configuration (name, sensor, thresholds)
- **`gate_status`** - Live gate status and entry rates

#### Transport Status
- **`transport_configs`** - Location and monitoring settings
- **`transport_issues`** - Reported transport disruptions

## 🚀 Setup Instructions

### 1. Database Migration
```bash
# Run the migration script
node scripts/migrate-support-tools.js

# Or execute the SQL directly in Supabase
# Copy and run: database/schema/support_tools.sql
```

### 2. Environment Variables
```bash
# Required for MCP Supabase integration
SUPABASE_PROJECT_ID=your-project-id
```

### 3. API Usage
All API endpoints now require `company_id` and `event_id`:

```javascript
// Headers
{
  'x-company-id': 'company-uuid',
  'x-event-id': 'event-uuid'
}

// Or query parameters
?company_id=company-uuid&event_id=event-uuid
```

## 📊 Data Operations

### Stand Occupancy
```javascript
// Get stands with occupancy
GET /api/football/stands

// Update occupancy (auto-save)
POST /api/football/stands
{
  "standId": "uuid",
  "occupancy": 15000,
  "recordedBy": "operator-name"
}

// CRUD operations (explicit save)
PUT /api/football/stands
{
  "action": "create|update|delete",
  "data": { /* stand data */ }
}
```

### Staffing Numbers
```javascript
// Get roles with actual counts
GET /api/football/staffing

// Update actual numbers (auto-save)
POST /api/football/staffing
{
  "roleId": "uuid",
  "actual": 45,
  "recordedBy": "supervisor-name"
}

// CRUD operations (explicit save)
PUT /api/football/staffing
{
  "action": "create|update|delete",
  "data": { /* role data */ }
}
```

### Fixture/Match Progress
```javascript
// Get tasks with completion status
GET /api/football/fixture

// Update task completion (auto-save)
POST /api/football/fixture
{
  "taskId": "uuid",
  "completed": true,
  "completedBy": "safety-officer"
}

// CRUD operations (explicit save)
PUT /api/football/fixture
{
  "action": "create|update|delete",
  "data": { /* task data */ }
}
```

### Crowd Movement & Gate Status
```javascript
// Get gates with status
GET /api/football/crowd

// Update gate status (auto-save)
POST /api/football/crowd
{
  "gateId": "uuid",
  "status": "active|delayed|closed",
  "entryRate": 12500,
  "recordedBy": "gate-operator"
}

// CRUD operations (explicit save)
PUT /api/football/crowd
{
  "action": "create|update|delete",
  "data": { /* gate data */ }
}
```

### Transport Status
```javascript
// Get config and issues
GET /api/football/transport

// Report new issue (auto-save)
POST /api/football/transport
{
  "type": "Bus|Rail|Road|Tube|Tram|Other",
  "description": "Route 26 delays",
  "severity": "low|medium|high",
  "reportedBy": "transport-coordinator"
}

// Update config or resolve issues (explicit save)
PUT /api/football/transport
{
  "action": "config|resolve|delete",
  "data": { /* config or issue data */ }
}
```

## 🔒 Security & Multi-Tenancy

### Data Isolation
- All tables include `company_id` and `event_id` foreign keys
- Database queries automatically filter by these IDs
- No cross-company or cross-event data access possible

### Access Control
- API endpoints validate `company_id` and `event_id` presence
- Database operations are scoped to the requesting company/event
- User permissions should be checked at the application level

## 📈 Performance

### Indexes
- Composite indexes on `(company_id, event_id)` for all tables
- Additional indexes on frequently queried fields
- Automatic `updated_at` timestamp triggers

### Query Optimization
- Efficient JOINs between configuration and operational data
- Pagination support for large datasets
- Summary queries for dashboard statistics

## 🧪 Testing

### Test Data
```sql
-- Insert test company and event
INSERT INTO companies (id, name) VALUES ('test-company', 'Test Company');
INSERT INTO events (id, company_id, name) VALUES ('test-event', 'test-company', 'Test Event');

-- Use these IDs in API calls
-- company_id: test-company
-- event_id: test-event
```

### API Testing
```bash
# Test with curl
curl -H "x-company-id: test-company" \
     -H "x-event-id: test-event" \
     http://localhost:3000/api/football/stands
```

## 🔄 Migration from Manual Store

The system has been migrated from in-memory `manualStore` to persistent database storage:

### Before (Manual Store)
- Data stored in memory
- Lost on server restart
- No multi-tenancy
- Simple key-value storage

### After (Database)
- Persistent PostgreSQL storage
- Multi-tenant with company/event scoping
- Full CRUD operations
- Audit trails and timestamps
- Scalable and production-ready

## 📚 Database Functions

### Stand Operations
- `getStands(companyId, eventId)` - Get all stands with occupancy
- `createStand(companyId, eventId, data)` - Create new stand
- `updateStand(companyId, eventId, standId, data)` - Update stand
- `deleteStand(companyId, eventId, standId)` - Delete stand
- `updateStandOccupancy(companyId, eventId, standId, occupancy)` - Update occupancy

### Staffing Operations
- `getStaffingRoles(companyId, eventId)` - Get roles with actual counts
- `createStaffingRole(companyId, eventId, data)` - Create new role
- `updateStaffingRole(companyId, eventId, roleId, data)` - Update role
- `deleteStaffingRole(companyId, eventId, roleId)` - Delete role
- `updateStaffingActual(companyId, eventId, roleId, actual)` - Update actual count

### Fixture Operations
- `getFixtureTasks(companyId, eventId)` - Get tasks with completion status
- `createFixtureTask(companyId, eventId, data)` - Create new task
- `updateFixtureTask(companyId, eventId, taskId, data)` - Update task
- `deleteFixtureTask(companyId, eventId, taskId)` - Delete task
- `updateTaskCompletion(companyId, eventId, taskId, completed)` - Update completion

### Crowd Operations
- `getGates(companyId, eventId)` - Get gates with status
- `createGate(companyId, eventId, data)` - Create new gate
- `updateGate(companyId, eventId, gateId, data)` - Update gate
- `deleteGate(companyId, eventId, gateId)` - Delete gate
- `updateGateStatus(companyId, eventId, gateId, status, entryRate)` - Update status

### Transport Operations
- `getTransportConfig(companyId, eventId)` - Get configuration
- `upsertTransportConfig(companyId, eventId, data)` - Create/update config
- `getTransportIssues(companyId, eventId)` - Get all issues
- `createTransportIssue(companyId, eventId, data)` - Report new issue
- `updateTransportIssue(companyId, eventId, issueId, resolved)` - Resolve issue
- `deleteTransportIssue(companyId, eventId, issueId)` - Delete issue

## 🎯 Next Steps

1. **Execute Migration**: Run the SQL schema in your Supabase database
2. **Set Environment**: Configure `SUPABASE_PROJECT_ID`
3. **Test APIs**: Verify all endpoints work with company/event context
4. **Add Authentication**: Implement user authentication and authorization
5. **Monitor Performance**: Set up database monitoring and optimization
6. **Backup Strategy**: Implement regular database backups
7. **Audit Logging**: Add comprehensive audit trails for compliance
