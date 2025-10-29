# inCommand Access Control Guide

## Overview

The inCommand system has a two-tiered access control structure that separates global system administration from company-specific administration.

## Access Levels

### 1. **Back Office (Global System Administration)**
- **URL**: `/admin/*`
- **Access**: Restricted to `david@incommand.uk` only
- **Purpose**: Global system management, billing, accounting, support tickets
- **Features**:
  - System settings and configuration
  - Global user management
  - Billing and accounting
  - Support ticket management
  - Audit logs
  - Organization management

### 2. **Company Settings (Company-Specific Administration)**
- **URL**: `/settings/*`
- **Access**: Company admins (users with `admin` or `superadmin` role in their company)
- **Purpose**: Company-specific settings and management
- **Features**:
  - User preferences
  - Event management
  - Notification settings
  - AI usage monitoring
  - Backup and restore
  - Support requests

## Security Implementation

### Back Office Protection
- **Email Restriction**: Only `david@incommand.uk` can access
- **MFA Required**: Multi-factor authentication mandatory
- **Admin Role Required**: Must have admin/superadmin role
- **API Protection**: All back office APIs (`/api/admin/*`, `/api/accounting/*`, `/api/billing/*`, `/api/support/*`) are protected

### Company Settings Protection
- **Role-Based**: Users with `admin` or `superadmin` role in their company
- **Company Context**: Users can only access their own company's data
- **No Email Restriction**: Any company admin can access (not restricted to specific email)

## User Roles

### Global Roles
- **superadmin**: Full system access (including back office)
- **admin**: Company admin access (settings only)

### Company Context
- Users are associated with companies via `company_id`
- Company admins can only manage users and settings within their company
- Data isolation ensures companies cannot access each other's data

## API Endpoints

### Back Office APIs (Restricted to david@incommand.uk)
- `/api/admin/*` - Organization and user management
- `/api/accounting/*` - Financial management
- `/api/billing/*` - Subscription and billing
- `/api/support/*` - Support ticket system
- `/api/compliance/*` - Compliance and exports
- `/api/metrics` - System metrics
- `/api/dashboard` - Global dashboard

### Company APIs (Available to company admins)
- `/api/settings/*` - Company settings
- `/api/v1/*` - Core application APIs
- `/api/incidents/*` - Incident management
- `/api/staff/*` - Staff management
- `/api/analytics/*` - Analytics and reporting

## Navigation

### Back Office Navigation
- Accessible via `/admin` route
- Shows global system administration tools
- Only visible to `david@incommand.uk`

### Company Settings Navigation
- Accessible via `/settings` route
- Shows company-specific administration tools
- Visible to company admins

## Error Messages

### Back Office Access Denied
- **Message**: "Access denied. Back office access is restricted to system administrators."
- **Action**: Redirects to login page

### Company Settings Access
- **Message**: Standard role-based access control
- **Action**: Shows appropriate UI based on user role

## Implementation Details

### Middleware Protection
- `/admin` routes: Email + MFA + Admin role required
- `/settings` routes: Admin role required (no email restriction)

### Database Security
- Row Level Security (RLS) policies ensure data isolation
- Company context enforced at database level
- Audit logging for all administrative actions

## Best Practices

1. **Regular Access Reviews**: Periodically review who has admin access
2. **MFA Enforcement**: Ensure all admin users have MFA enabled
3. **Role Separation**: Keep back office and company admin roles separate
4. **Audit Logging**: Monitor all administrative actions
5. **Data Isolation**: Ensure company data remains isolated

## Troubleshooting

### Common Issues
1. **"Access denied" for back office**: Check if user is `david@incommand.uk`
2. **"Insufficient permissions" for settings**: Check if user has admin role
3. **MFA required**: Ensure MFA is enabled for the user
4. **Company data not visible**: Check company_id association

### Support
For access issues, contact the system administrator or check the audit logs for detailed error information.
