# Notification Settings Setup Guide

## Overview
The notification settings page has been implemented to allow users to configure their notification preferences for the InCommand platform. This includes settings for incidents, AI insights, system notifications, events, and delivery methods.

## Features Implemented

### 1. Notification Categories
- **Incident Notifications**: New incidents, updates, resolutions, high priority, urgent incidents
- **AI Insights**: Summary digest, trend alerts, performance insights  
- **System Notifications**: Maintenance alerts, updates, security alerts
- **Event Notifications**: New events, updates, event ended
- **Delivery Methods**: Browser notifications, email notifications, digest frequency, quiet hours

### 2. Advanced Features
- **Browser Permission Management**: Automatic browser notification permission requests
- **Quiet Hours**: Configurable time periods to pause non-urgent notifications
- **Digest Frequency**: Real-time, hourly, daily, or weekly notification summaries
- **Granular Controls**: Individual toggles for each notification type
- **Persistent Storage**: Settings saved to Supabase database per user

## Database Setup Required

### Step 1: Create the Database Table
You need to run the following SQL in your **Supabase SQL Editor** to create the required table:

```sql
-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON user_notification_settings(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification settings" 
ON user_notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON user_notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON user_notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" 
ON user_notification_settings FOR DELETE 
USING (auth.uid() = user_id);
```

### Step 2: Verify Setup
After running the SQL, you can test if the table was created correctly by running:

```bash
curl -X POST http://localhost:3000/api/setup-notification-settings-table
```

You should see a response indicating the table exists and is accessible.

## File Structure

### New Files Created
- `src/app/settings/notifications/page.tsx` - Main notification settings page
- `src/app/api/setup-notification-settings-table/route.ts` - Database setup API endpoint
- `docs/NOTIFICATION_SETTINGS_SETUP.md` - This documentation file

### Key Components
- **NotificationSettings Interface**: TypeScript interface defining all available settings
- **SettingToggle Component**: Reusable toggle switch component for individual settings
- **Browser Permission Handling**: Automatic browser notification permission management
- **Toast Notifications**: User feedback for save/error states
- **Loading States**: Proper loading indicators during data operations

## Usage

### For Users
1. Navigate to **Settings** → **Notification Settings**
2. Configure preferences for different notification types
3. Set delivery methods (browser/email notifications)
4. Configure quiet hours if desired
5. Click **Save Settings** to persist changes

### For Developers
The notification settings are stored in the `user_notification_settings` table with the following structure:
- `user_id`: Links to the authenticated user
- `settings`: JSONB field containing all notification preferences
- Automatic timestamps for creation and updates
- Row Level Security ensures users can only access their own settings

## Default Settings
The system provides sensible defaults:
- Most incident notifications: **Enabled**
- AI insights: **Mostly enabled** (performance insights disabled by default)
- System maintenance and security: **Enabled**
- Browser notifications: **Enabled** (if permission granted)
- Email notifications: **Disabled** (user must opt-in)
- Digest frequency: **Daily**
- Quiet hours: **Disabled** (22:00-08:00 when enabled)

## Integration Points

### With Existing Notification System
The settings page integrates with the existing notification infrastructure:
- Uses the existing `Toast` component for user feedback
- Compatible with the `NotificationDrawer` system
- Leverages existing Supabase authentication and database

### Browser Notifications
- Automatic permission request handling
- Graceful fallback when permissions are denied
- Visual indicators for permission status

## Testing
To test the notification settings:
1. Ensure the database table is created (see Step 1 above)
2. Log in as a user
3. Navigate to Settings → Notification Settings
4. Modify some settings and save
5. Reload the page to verify settings persist
6. Test browser notification permission requests

## Future Enhancements
Potential future improvements:
- Email template customization
- Advanced scheduling options
- Notification preview/testing
- Integration with third-party services (Slack, Discord, etc.)
- Bulk notification management for administrators
- Analytics on notification engagement 