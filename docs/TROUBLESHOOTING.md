# inCommand Troubleshooting Manual

Quick solutions to common problems

## Table of Contents

1. [Login & Authentication Issues](#login--authentication-issues)
2. [Performance Problems](#performance-problems)
3. [Incident Management Issues](#incident-management-issues)
4. [Mobile & PWA Problems](#mobile--pwa-problems)
5. [Notification Issues](#notification-issues)
6. [Integration Problems](#integration-problems)
7. [Data & Sync Issues](#data--sync-issues)
8. [Browser Compatibility](#browser-compatibility)
9. [Error Messages](#error-messages)
10. [Emergency Procedures](#emergency-procedures)

---

## Login & Authentication Issues

### Cannot Log In

#### Problem: "Invalid email or password"
**Causes:**
- Incorrect credentials
- Account not activated
- CapsLock enabled

**Solutions:**
1. **Check email spelling** - Common typos
2. **Try password reset:**
   - Click "Forgot Password"
   - Check email (including spam folder)
   - Follow reset link
3. **Check CapsLock** - Passwords are case-sensitive
4. **Clear browser cache:**
   ```
   Chrome: Ctrl+Shift+Delete
   Firefox: Ctrl+Shift+Delete
   Safari: Cmd+Option+E
   ```

#### Problem: "Account not found"
**Causes:**
- Email not registered
- Wrong organization
- Account deactivated

**Solutions:**
1. **Contact your administrator** to verify account status
2. **Check correct organization URL**
3. **Try different email** if you have multiple

#### Problem: "Email not verified"
**Causes:**
- Haven't clicked verification link
- Verification email in spam
- Link expired

**Solutions:**
1. **Check spam folder** for verification email
2. **Request new verification email:**
   - Login page > "Resend verification"
3. **Contact admin** if link expired

### Two-Factor Authentication (2FA) Issues

#### Problem: "Invalid 2FA code"
**Causes:**
- Time sync issue
- Wrong authenticator app
- Code expired

**Solutions:**
1. **Ensure device time is correct:**
   - Settings > Date & Time > Set Automatically
2. **Wait for new code** (codes expire every 30 seconds)
3. **Use backup codes** if you saved them
4. **Reset 2FA:**
   - Contact administrator
   - Verify identity
   - Reset 2FA in admin panel

---

## Performance Problems

### Slow Page Loading

#### Problem: Pages take >5 seconds to load
**Causes:**
- Slow internet connection
- Browser cache full
- Too many browser extensions
- Old browser version

**Solutions:**
1. **Check internet speed:**
   - Run speed test (speedtest.net)
   - Minimum required: 5 Mbps
2. **Clear browser cache:**
   ```
   Chrome: Settings > Privacy > Clear browsing data
   Select: Cached images and files
   Time range: All time
   ```
3. **Disable extensions temporarily:**
   - Try private/incognito mode
   - If faster, disable extensions one by one
4. **Update browser** to latest version
5. **Try different browser:**
   - Recommended: Chrome, Firefox, Edge, Safari

### Dashboard Not Updating

#### Problem: Stats/incidents not refreshing
**Causes:**
- WebSocket connection lost
- Browser tab inactive too long
- Network interruption

**Solutions:**
1. **Refresh page** (F5 or Cmd+R)
2. **Check WebSocket connection:**
   - Look for disconnection message (top of screen)
   - Click "Reconnect" if shown
3. **Check network status:**
   - Look for offline indicator
   - Check internet connection
4. **Close and reopen tab**

### High Data Usage

#### Problem: Using too much mobile data
**Causes:**
- Real-time updates enabled
- High-resolution photos
- Background sync

**Solutions:**
1. **Enable data saver mode:**
   - Settings > Preferences > Data Saver
2. **Reduce update frequency:**
   - Settings > Notifications > Update Frequency > Manual
3. **Compress photos before upload:**
   - Automatically enabled, but check Settings > Photos
4. **Use WiFi when possible**

---

## Incident Management Issues

### Cannot Create Incident

#### Problem: "Create Incident" button disabled or missing
**Causes:**
- Insufficient permissions
- Event not active
- Browser issue

**Solutions:**
1. **Check permissions:**
   - Contact admin to verify your role
   - Minimum role: Operator
2. **Check event status:**
   - Admin must activate event first
3. **Try browser refresh** (F5)
4. **Check browser console** for errors:
   ```
   Press F12 > Console tab
   Look for red errors
   Screenshot and send to support
   ```

#### Problem: Form validation errors
**Causes:**
- Missing required fields
- Invalid data format
- Character limits exceeded

**Solutions:**
1. **Review all required fields** (marked with *)
2. **Check field requirements:**
   - Title: Max 100 characters
   - Headline: Max 15 words
   - Description: Max 1000 characters
3. **Remove special characters** if causing issues
4. **Try simpler input first**, then add details

### Cannot Update Incident

#### Problem: "Update" or "Save" button not working
**Causes:**
- Incident locked by another user
- Insufficient permissions
- Network issue

**Solutions:**
1. **Check if someone else is editing:**
   - Look for "User X is editing..." message
   - Wait for them to finish
2. **Verify permissions:**
   - Can you edit incidents assigned to others?
   - Contact admin if needed
3. **Check internet connection**
4. **Try refreshing page** and editing again

### Log Entry Not Saving

#### Problem: Log entry disappears after submit
**Causes:**
- Network interruption
- Browser cache issue
- Validation error (silent)

**Solutions:**
1. **Check offline indicator** at top of page
2. **Enable offline mode:**
   - Settings > Offline Mode
   - Entries save locally and sync later
3. **Copy text before submitting** (Ctrl+C)
4. **Check browser console** for hidden errors
5. **Try shorter entry** to test

---

## Mobile & PWA Problems

### PWA Not Installing

#### Problem: "Add to Home Screen" option missing
**Causes:**
- Not using HTTPS
- Browser doesn't support PWA
- Already installed
- Manifest issues

**Solutions:**
1. **Check URL starts with `https://`** (not http://)
2. **Use supported browser:**
   - iOS: Safari
   - Android: Chrome, Firefox, Edge
3. **Check if already installed:**
   - Look for app icon on home screen
4. **Try manual installation:**
   - Browser menu > "Install app" or "Add to Home Screen"

#### Problem: PWA installed but won't open
**Causes:**
- Service worker issue
- Cache corruption
- URL changed

**Solutions:**
1. **Uninstall and reinstall:**
   - Long-press app icon > Remove/Delete
   - Visit website again
   - Install fresh copy
2. **Clear browser cache** before reinstalling
3. **Check internet connection** on first launch

### Offline Mode Not Working

#### Problem: Can't access app offline
**Causes:**
- Service worker not registered
- Cache not populated
- Never opened app while online

**Solutions:**
1. **Open app while online first:**
   - Load main pages
   - Wait for "Ready for offline" message
2. **Check service worker status:**
   - Settings > About > Service Worker Status
   - Should show "Active"
3. **Re-register service worker:**
   - Settings > Advanced > Reset Service Worker

### Photos Not Uploading

#### Problem: Photo upload fails
**Causes:**
- File too large
- Poor connection
- Wrong file format
- Storage quota exceeded

**Solutions:**
1. **Check file size:**
   - Maximum: 10 MB per photo
   - System auto-compresses, but very large files may fail
2. **Check file format:**
   - Supported: JPG, PNG, HEIC
   - Not supported: BMP, TIFF, RAW
3. **Wait for better connection** (uploads queue automatically)
4. **Reduce photo quality:**
   - Settings > Photos > Quality: Medium or Low

---

## Notification Issues

### Not Receiving Notifications

#### Problem: No push notifications appearing
**Causes:**
- Notifications disabled
- Browser blocked notifications
- Device settings
- Quiet hours enabled

**Solutions:**
1. **Check in-app settings:**
   - Settings > Notifications
   - Ensure enabled for desired events
2. **Check browser permissions:**
   - Browser settings > Site settings > Notifications
   - Ensure allowed for your inCommand domain
3. **Check device settings:**
   - **iOS**: Settings > [Browser] > Notifications > Allow
   - **Android**: Settings > Apps > [Browser] > Notifications > Enabled
4. **Disable Quiet Hours temporarily:**
   - Settings > Notifications > Quiet Hours > Disable
5. **Send test notification:**
   - Settings > Notifications > "Send Test"

### Too Many Notifications

#### Problem: Notification overload
**Causes:**
- All notifications enabled
- Multiple devices
- Digest mode not enabled

**Solutions:**
1. **Enable digest mode:**
   - Settings > Notifications > Frequency: Digest
   - Choose interval: Every 15 min, hourly, etc.
2. **Disable non-critical:**
   - Settings > Notifications
   - Uncheck low-priority events
3. **Use Quiet Hours:**
   - Settings > Notifications > Quiet Hours
   - Set: 22:00 - 07:00 (adjust as needed)
4. **Filter by role:**
   - Only get notifications relevant to your role

### Email Notifications Not Working

#### Problem: Not receiving email notifications
**Causes:**
- Wrong email address
- Emails in spam folder
- Email service issue
- Email notifications disabled

**Solutions:**
1. **Verify email address:**
   - Profile > Email
   - Update if incorrect
2. **Check spam/junk folder**
3. **Add to safe senders:**
   - noreply@your-incommand-domain.com
4. **Check email settings:**
   - Settings > Notifications > Email: Enabled
5. **Contact admin** if system-wide issue

---

## Integration Problems

### Slack Integration Not Working

#### Problem: Messages not posting to Slack
**Causes:**
- Webhook URL incorrect
- Slack app disabled
- Permission issues
- Event filters too strict

**Solutions:**
1. **Verify webhook URL:**
   - Admin > Integrations > Slack
   - Test webhook: Click "Send Test Message"
2. **Check Slack app status:**
   - Slack workspace settings
   - Ensure app is active
3. **Review event filters:**
   - Admin > Integrations > Slack > Events
   - Ensure desired events are checked
4. **Regenerate webhook:**
   - Delete old webhook in Slack
   - Create new webhook
   - Update in inCommand

### Email/SMS Not Sending

#### Problem: System emails/SMS not delivered
**Causes:**
- Provider API key invalid
- Account suspended (unpaid)
- Rate limit exceeded
- Recipient number/email invalid

**Solutions:**
1. **Check provider status:**
   - Login to email/SMS provider dashboard
   - Verify account is active
2. **Verify API keys:**
   - Admin > Integrations > Email/SMS
   - Re-enter API keys
   - Click "Test Configuration"
3. **Check rate limits:**
   - May need to upgrade plan
4. **Verify recipient details:**
   - Phone numbers must include country code (+44)
   - Email addresses must be valid format

### API Connection Issues

#### Problem: External integrations failing
**Causes:**
- API key expired
- Rate limit exceeded
- IP whitelist issue
- API endpoint changed

**Solutions:**
1. **Regenerate API key:**
   - Admin > Integrations > API
   - Generate new key
   - Update in external system
2. **Check rate limits:**
   - Admin > Integrations > API > Usage
   - May need higher tier
3. **Review API logs:**
   - Admin > Integrations > API > Logs
   - Check error messages
4. **Test with Postman/Curl:**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://your-domain.com/api/v1/incidents
   ```

---

## Data & Sync Issues

### Data Not Syncing

#### Problem: Changes not appearing on other devices
**Causes:**
- Offline mode active
- Sync paused
- Network issue
- Cache conflict

**Solutions:**
1. **Check online status** (indicator at top)
2. **Manual sync:**
   - Pull down to refresh
   - Or Settings > Sync Now
3. **Check sync settings:**
   - Settings > Sync > Auto-Sync: Enabled
4. **Clear app cache:**
   - Settings > Advanced > Clear Cache
5. **Sign out and back in**

### Missing Incidents

#### Problem: Incidents disappeared or not showing
**Causes:**
- Filters applied
- Wrong event selected
- Archived/deleted
- Permission changes

**Solutions:**
1. **Check filters:**
   - Clear all filters
   - Incidents > "Clear Filters"
2. **Check event selector:**
   - Ensure correct event is selected (top of page)
3. **Check status filter:**
   - Include "Closed" and "Archived"
4. **Search by incident ID:**
   - Use search bar with ID number
5. **Check with admin** if mass deletion suspected

### Data Lost After Update

#### Problem: Data missing after app/browser update
**Causes:**
- Cache cleared automatically
- Sync didn't complete before update
- Browser storage cleared

**Solutions:**
1. **Check "Recently Deleted":**
   - Settings > Data > Recently Deleted
   - Restore if found
2. **Check server data:**
   - Sign out and sign in
   - Data may sync from server
3. **Contact admin for backup restoration:**
   - They can restore from daily backups

---

## Browser Compatibility

### Supported Browsers

#### Fully Supported (Recommended)
- Chrome/Edge: Version 90+
- Firefox: Version 88+
- Safari: Version 14+
- Mobile browsers: Latest versions

#### Limited Support
- Internet Explorer: **Not supported**
- Older browser versions: May have issues

### Browser-Specific Issues

#### Chrome/Edge Issues
**Problem:** "WebGL not supported"
- **Solution:** Enable hardware acceleration
  - Settings > Advanced > System > Use hardware acceleration

#### Firefox Issues
**Problem:** Slow performance
- **Solution:** Disable Firefox tracking protection for inCommand
  - Click shield icon in address bar
  - Turn off Enhanced Tracking Protection

#### Safari Issues
**Problem:** Push notifications not working
- **Solution:** Ensure "Allow websites to ask for permission to send push notifications" is enabled
  - Safari > Preferences > Websites > Notifications

---

## Error Messages

### Common Error Messages

#### "Network Error"
**Meaning:** Can't connect to server  
**Solutions:**
- Check internet connection
- Check if website is down (ask colleagues)
- Try again in a few minutes
- Contact admin if persistent

#### "Permission Denied"
**Meaning:** Insufficient access rights  
**Solutions:**
- Contact admin to verify your role
- May need role upgrade
- Check if trying to access restricted feature

#### "Session Expired"
**Meaning:** Logged out due to inactivity  
**Solutions:**
- Log in again
- Enable "Remember Me" to stay logged in longer

#### "Rate Limit Exceeded"
**Meaning:** Too many requests too quickly  
**Solutions:**
- Wait 1-2 minutes
- Slow down actions
- Contact admin if automated process

#### "Upload Failed"
**Meaning:** File couldn't be uploaded  
**Solutions:**
- Check file size (<10 MB)
- Check file format (JPG, PNG)
- Check internet connection
- Try again

#### "Validation Error"
**Meaning:** Form data invalid  
**Solutions:**
- Check all required fields filled
- Remove special characters
- Follow format requirements (e.g., phone numbers)

---

## Emergency Procedures

### System Down

#### What to Do If inCommand is Completely Down

**Immediate Actions:**
1. **Check if it's just you:**
   - Ask colleagues if they can access
   - Try different device/network
2. **Check status page** (if available):
   - status.incommand.app
3. **Use backup procedures:**
   - Paper logs (emergency backup forms)
   - Radio communication
   - Text message chain

**Notify:**
- Contact system administrator immediately
- Use emergency contact: [emergency phone]

**Continue Operations:**
- Switch to backup logging method
- Maintain situational awareness
- Document everything for later entry

### Data Loss Emergency

#### If You Suspect Data Loss

**Do NOT:**
- Continue entering data
- Clear cache
- Uninstall app
- Delete anything

**DO:**
1. **Stop immediately**
2. **Contact admin urgently**
3. **Document what happened:**
   - What were you doing?
   - When did it occur?
   - What data is missing?
4. **Don't close browser/app**
5. **Screenshot current state**

Admin can:
- Restore from backup
- Recover from database logs
- Retrieve cached data

### Security Breach

#### If You Suspect Account Compromise

**Immediate Actions:**
1. **Change password immediately**
2. **Log out all devices:**
   - Settings > Security > Log Out All Sessions
3. **Enable 2FA:**
   - Settings > Security > Two-Factor Authentication
4. **Contact administrator**
5. **Review recent activity:**
   - Settings > Security > Activity Log

**Document:**
- When did you notice?
- What unusual activity did you see?
- Any suspicious logins?

---

## Getting Additional Help

### Self-Service Resources

1. **In-App Help:**
   - Click "?" icon anywhere
   - Context-sensitive help
   - Video tutorials

2. **Documentation:**
   - [User Guide](USER_GUIDE.md)
   - [Tutorials](TUTORIALS.md)
   - [Admin Guide](ADMIN_GUIDE.md)
   - [FAQ](FAQ.md)

3. **Community Forum:**
   - community.incommand.app
   - Search existing questions
   - Ask new questions

### Contacting Support

#### Before Contacting Support
Gather this information:
- Error message (exact text or screenshot)
- What you were trying to do
- Steps to reproduce
- Browser/device information
- Your organization and role

#### Support Channels

**Email Support:**
- support@incommand.app
- Response time: Within 4 hours

**Live Chat:**
- Available in app (bottom right)
- Hours: Mon-Fri, 9am-5pm GMT

**Phone Support (Urgent):**
- [Support phone number]
- For critical incidents only

**Emergency Support (24/7):**
- [Emergency phone number]
- For system outages during events

### Information to Include

When reporting an issue, include:
```
Organization: [Your org name]
User Email: [Your email]
Browser/Device: [e.g., Chrome on Windows 10]
Issue: [Brief description]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Error occurred]

Error Message: [Exact text or screenshot]
When It Started: [Date/time]
Frequency: [Always/Sometimes/Once]
Impact: [How it affects your work]
```

---

## Diagnostic Tools

### Browser Console

Access browser console to see technical errors:

**Chrome/Edge:**
```
Windows: F12 or Ctrl+Shift+I
Mac: Cmd+Option+I
```

**Firefox:**
```
Windows: F12 or Ctrl+Shift+K
Mac: Cmd+Option+K
```

**Safari:**
```
First enable: Preferences > Advanced > Show Develop menu
Then: Cmd+Option+C
```

Look for red errors, take screenshot, send to support.

### Network Tab

Check if requests are failing:

1. Open browser console (F12)
2. Click "Network" tab
3. Reproduce issue
4. Look for red/failed requests
5. Right-click failed request > "Copy as cURL"
6. Send to support

### Application Tab

Check local storage and service workers:

1. Open browser console (F12)
2. Click "Application" tab (Chrome) or "Storage" (Firefox)
3. Check:
   - Local Storage: Data stored locally
   - Session Storage: Temporary data
   - Service Workers: Offline functionality

---

## Preventive Measures

### Best Practices to Avoid Issues

✅ **DO:**
- Keep browser updated
- Use recommended browsers
- Clear cache monthly
- Enable automatic backups
- Test new features in training mode
- Report issues early
- Document workarounds

❌ **DON'T:**
- Use outdated browsers
- Ignore update notifications
- Clear cache during active incidents
- Share login credentials
- Bypass security features
- Wait until critical moment to report issues

---

**Still Having Issues?**

Contact our support team - we're here to help!

- **Email**: support@incommand.app
- **Chat**: In-app live chat
- **Phone**: [Your support number]
- **Emergency**: [Emergency 24/7 number]


