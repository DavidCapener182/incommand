# Fixing Supabase Authentication Rate Limits

## Problem

Users are experiencing "Request rate limit reached" errors when trying to log in, even when they haven't made many login attempts. This is caused by Supabase's built-in rate limiting on authentication endpoints.

## Root Cause

1. **Supabase Default Rate Limits**: Supabase enforces rate limits on authentication endpoints to prevent brute force attacks. The default limits are:
   - **Sign in attempts**: ~5-10 per hour per IP
   - **Password reset requests**: ~3 per hour per email
   - **Session checks**: Can contribute to rate limits

2. **Middleware Session Checks**: Our middleware checks sessions on every request, which can contribute to hitting rate limits.

## Solutions

### Solution 1: Increase Rate Limits in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Settings**
3. Look for **Rate Limits** or **Security** section
4. Increase the following limits:
   - **Sign in attempts per hour**: Increase to 50-100 (or higher for production)
   - **Password reset requests per hour**: Increase to 20-30
   - **Email verification requests**: Increase if needed

**Note**: If you're on a free tier, you may have stricter limits. Consider upgrading to Pro tier for higher limits.

### Solution 2: Whitelist Your IP Address

If you're testing from a specific IP:

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Look for **IP Allowlist** or **Rate Limit Exceptions**
3. Add your IP address to the allowlist

### Solution 3: Use Service Role Key for Internal Operations (Already Implemented)

We've optimized the middleware to:
- Only check sessions when auth cookies are present
- Gracefully handle rate limit errors
- Allow requests to proceed when rate limited (pages handle auth)

### Solution 4: Upgrade Supabase Plan

If you're on the free tier:
- **Free tier**: Very strict rate limits
- **Pro tier**: Higher rate limits, better for production
- **Team/Enterprise**: Custom rate limits

## Immediate Fix

If you're currently blocked:

1. **Wait 15-60 minutes** - Rate limits typically reset automatically
2. **Clear browser cookies** - Sometimes helps reset the session state
3. **Use a different network/IP** - If possible, try from a different location
4. **Contact Supabase Support** - If you have a paid plan, they can help reset limits

## Prevention

The middleware has been optimized to:
- ✅ Only check sessions when auth cookies are present
- ✅ Handle rate limit errors gracefully
- ✅ Allow requests through when rate limited (pages handle auth client-side)

## Monitoring

To monitor rate limit issues:

1. Check Supabase dashboard → **Logs** → **Auth Logs**
2. Look for 429 (Too Many Requests) errors
3. Monitor the frequency of auth API calls

## Production Recommendations

For a production system with paying customers:

1. **Upgrade to Supabase Pro tier** ($25/month) for higher rate limits
2. **Implement client-side session caching** to reduce server-side checks
3. **Use service role key** for internal operations (already done)
4. **Monitor auth logs** regularly for rate limit issues
5. **Consider implementing** a custom auth rate limiter that's more lenient than Supabase's defaults

## Code Changes Made

1. **Middleware optimization**: Only checks sessions when auth cookies are present
2. **Error handling**: Gracefully handles rate limit errors
3. **Fallback behavior**: Allows requests through when rate limited, letting pages handle auth

## Testing

After making changes:

1. Clear browser cookies
2. Try logging in
3. Monitor Supabase dashboard for rate limit errors
4. Check browser console for any auth-related errors

## Support

If issues persist:
- Check Supabase status: https://status.supabase.com
- Contact Supabase support (if on paid plan)
- Review Supabase documentation: https://supabase.com/docs/guides/auth/rate-limits


