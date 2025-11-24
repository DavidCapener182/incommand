# Fixing Excessive Authentication Requests

## Problem

The system was making **19,060 authentication requests in 41 minutes** (465 requests/minute, ~8 requests/second) when a user only tried logging in once. This is causing Supabase rate limits to be hit.

## Root Causes Identified

1. **Middleware Running on API Routes**: The middleware was potentially being called on API routes, causing duplicate auth checks
2. **Every API Route Calls Auth**: All 76+ API routes call `getUser()` or `getSession()` on every request
3. **Polling Components**: Multiple components poll API routes frequently:
   - `DoctrineAssistant`: Every 30 seconds
   - `FootballCard_MedicalPolicing`: Every 30 seconds  
   - `Navigation`: Every 30 seconds for notifications
   - `KnowledgeBasePage`: Every 2 seconds when items are ingesting
   - And many more...

4. **AuthContext Re-mounting**: If AuthContext re-mounts, it calls `getInitialSession()` again

## Fixes Applied

### 1. Middleware Optimization ✅
- **Fixed**: Middleware now explicitly excludes `/api/` routes in the matcher
- **Fixed**: Middleware only checks sessions when auth cookies are present
- **Fixed**: Middleware gracefully handles rate limit errors

### 2. API Route Auth Caching (Recommended Next Step)
Consider implementing auth caching in API routes to avoid calling `getUser()` on every request:

```typescript
// Example: Cache auth for 5 seconds per request
const authCache = new Map<string, { user: any; timestamp: number }>()
const AUTH_CACHE_DURATION = 5000

export async function GET(request: NextRequest) {
  const cacheKey = request.headers.get('authorization') || 'no-auth'
  const cached = authCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_DURATION) {
    // Use cached user
  } else {
    // Fetch fresh user
    const { data: { user } } = await supabase.auth.getUser()
    authCache.set(cacheKey, { user, timestamp: Date.now() })
  }
}
```

### 3. Reduce Polling Frequency
Consider increasing polling intervals:
- `DoctrineAssistant`: 30s → 60s
- `FootballCard_MedicalPolicing`: 30s → 60s
- `Navigation` notifications: 30s → 60s
- `KnowledgeBasePage`: 2s → 5s (only when ingesting)

### 4. Use WebSockets Instead of Polling
For real-time updates, consider using Supabase Realtime subscriptions instead of polling API routes.

## Monitoring

To monitor auth request volume:

1. **Supabase Dashboard**: Check Authentication → Logs
2. **Look for patterns**: Identify which API routes are being called most frequently
3. **Check polling intervals**: Review components with `setInterval` calls
4. **Monitor middleware**: Check if middleware is being called on API routes (it shouldn't be)

## Expected Results

After fixes:
- **Before**: 19,060 requests in 41 minutes (465/min)
- **Expected**: < 100 requests per hour for normal usage
- **During active use**: < 500 requests per hour (with polling)

## Additional Recommendations

1. **Implement request deduplication**: Use a request queue to batch similar requests
2. **Add rate limiting on client side**: Prevent components from polling too aggressively
3. **Use React Query or SWR**: These libraries handle caching and deduplication automatically
4. **Monitor in production**: Set up alerts for excessive auth requests

## Testing

After deploying fixes:

1. Clear browser cache and cookies
2. Log in once
3. Monitor Supabase dashboard for 10 minutes
4. Expected: < 50 auth requests for normal page navigation
5. If still high, check browser console for components making excessive API calls

## Emergency Fix

If rate limits are hit immediately:

1. **Wait 15-60 minutes** for limits to reset
2. **Increase Supabase rate limits** in dashboard (see `SUPABASE_RATE_LIMIT_FIX.md`)
3. **Temporarily disable polling** in problematic components
4. **Use service role key** for internal operations (bypasses rate limits)


