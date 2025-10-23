# Scoped Access System Guide

## Overview

The Scoped Access System allows event organizers to invite temporary users (medics, security, production staff, or read-only users) to specific events without giving them full platform access. These users can only access the current event and have limited permissions based on their assigned role.

## How It Works

### 1. Database Structure

- **`event_invites`**: Stores secure invite tokens with expiration dates and usage limits
- **`event_members`**: Maps users to events with roles and temporary status
- **RLS Policies**: Ensure users can only access data for events they're members of

### 2. User Roles

- **`medic`**: Can create and update incidents, view all event data
- **`security`**: Can create and update incidents, view all event data  
- **`production`**: Can create and update incidents, view all event data
- **`read_only`**: Can only view incidents and event data, cannot create or modify

### 3. Access Control

- Temporary members are identified by a "Guest" badge in the navigation
- Admin features (Settings, etc.) are hidden for temporary members
- Access is automatically revoked when the invite expires
- Users can be manually revoked by event organizers

## For Event Organizers

### Creating Invites

1. Go to **Settings** → **Event Invites** (only visible to admin users)
2. Click **Create Invite**
3. Fill in the details:
   - **Role**: Choose from medic, security, production, or read_only
   - **Intended Email** (optional): Restrict invite to specific email
   - **Max Uses**: How many times the invite can be used
   - **Expires At**: When the invite expires
   - **Allow Multiple**: Whether the same person can use the invite multiple times
4. Click **Create Invite**
5. **Copy the generated token** - this is the only time you'll see it
6. Share the token with the intended user

### Managing Invites

- View all active invites with usage statistics
- Revoke invites to immediately disable access
- Monitor who has used invites and when

### User Experience

1. User visits `/invite?token=YOUR_TOKEN`
2. User enters their name and email
3. System creates account (if new user) or links to existing account
4. User receives magic link via email
5. User clicks magic link to access the event
6. User sees "Guest" badge and limited navigation

## For Invited Users

### Redeeming an Invite

1. Visit the invite link provided by the organizer
2. Enter your full name and email address
3. Click **Redeem Invite**
4. Check your email for the magic link
5. Click the magic link to access the event

### What You Can Access

- **Incidents**: View and create incidents (depending on role)
- **Staff**: View staff assignments and availability
- **Reports**: View event reports and analytics
- **Help**: Access help documentation

### What You Cannot Access

- **Settings**: Platform settings are hidden
- **Admin**: Administrative functions are not available
- **Other Events**: Only the current event is accessible

## Security Features

### Token Security

- Tokens are hashed before storage
- Tokens are only shown once during creation
- Expired tokens are automatically cleaned up

### Access Control

- Row Level Security (RLS) ensures data isolation
- Users can only see data for events they're members of
- Automatic logout when membership expires

### Audit Logging

- All invite creation and redemption is logged
- Failed attempts are tracked
- Membership changes are recorded

## Cleanup and Maintenance

### Automatic Cleanup

- Expired invites are automatically marked as expired
- Expired memberships are automatically revoked
- Cleanup runs via scheduled API endpoint

### Manual Cleanup

- Event organizers can revoke invites manually
- Revoking an invite immediately signs out all users who used it
- Revoked memberships prevent further access

## API Endpoints

### For Organizers

- `POST /api/events/[eventId]/invites` - Create new invite
- `GET /api/events/[eventId]/invites` - List all invites
- `DELETE /api/events/[eventId]/invites?inviteId=X` - Revoke invite

### For Users

- `POST /api/invite/redeem` - Redeem invite token
- `POST /api/auth/magic-link` - Verify invite details when automatic authentication fails

### For System

- `POST /api/cleanup/expired-invites` - Clean up expired invites and members

## Best Practices

### For Organizers

1. **Set appropriate expiration dates** - Don't leave invites open indefinitely
2. **Use intended email** - For sensitive roles, restrict to specific emails
3. **Monitor usage** - Check who has used invites and revoke if needed
4. **Regular cleanup** - Remove unused invites periodically

### For Users

1. **Use the magic link promptly** - Links expire after a certain time
2. **Don't share your access** - Your account is tied to your email
3. **Contact organizer for issues** - They can help with access problems

## Troubleshooting

### Common Issues

**"Invalid or expired invite token"**
- Check if the token is correct
- Verify the invite hasn't expired
- Ensure the invite hasn't been revoked

**"Email does not match intended recipient"**
- The invite was created for a specific email
- Use the email address the invite was intended for

**"User is already a member of this event"**
- The user already has access to this event
- Check if they're already logged in

**"Membership has expired"**
- The invite or membership has passed its expiration date
- Contact the event organizer for a new invite

### Getting Help

- Contact the event organizer for invite issues
- Check the help documentation for general questions
- Report technical issues through the platform

## Technical Implementation

The system uses:

- **Supabase Auth** for user management and magic links
- **Row Level Security** for data isolation
- **Crypto hashing** for secure token storage
- **Real-time subscriptions** for live updates
- **Audit logging** for compliance and debugging

All components are built with security and scalability in mind, ensuring that temporary users can only access what they need while maintaining the integrity of the platform.
