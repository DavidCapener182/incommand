# Security Implementation Guide

This document outlines the security measures implemented in the inCommand application to ensure production-grade security and data protection.

## 🔒 Security Architecture

### 1. Environment Variable Security

- **Typed Environment Validation**: All environment variables are validated using Zod schemas in `src/config/env.ts`
- **Server-Only Secrets**: Service role keys are never exposed to the client bundle
- **Early Validation**: Application fails fast if required environment variables are missing
- **CI/CD Integration**: Environment validation runs automatically during deployment

```typescript
// ✅ Secure - Server-only
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ❌ Insecure - Never do this
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

### 2. Row-Level Security (RLS)

All database operations use RLS-enabled Supabase clients that respect user context:

```typescript
// ✅ Secure - Uses RLS
const supabase = createRlsServerClient(request.headers)
const { data } = await supabase
  .from('incidents')
  .select('*')
  .eq('user_id', user.id) // Automatically scoped by RLS
```

### 3. API Route Security

All API routes use secure handlers that enforce authentication and authorization:

```typescript
// ✅ Secure API route
export async function GET(request: NextRequest) {
  return secureApiHandler(request, async (supabase, user, request) => {
    // Your secure logic here
    // User is guaranteed to be authenticated
    // Supabase client respects RLS policies
  })
}
```

### 4. Security Headers

Comprehensive security headers are applied via middleware and Next.js config:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security**: Enforces HTTPS
- **Permissions Policy**: Restricts browser features

### 5. Authentication & Session Security

- **Server-Only Sessions**: Authentication tokens are handled server-side
- **Session Validation**: Every request validates session and user status
- **Role-Based Access**: Admin routes require specific roles
- **Automatic Logout**: Expired sessions are handled gracefully

## 🛡️ Security Best Practices

### Data Sanitization

All user input is sanitized to prevent XSS and injection attacks:

```typescript
// ✅ Sanitized logging
console.log('User action', sanitizeForLogging({
  userId: user.id,
  action: 'incident_created',
  // Sensitive data is automatically redacted
}))
```

### Error Handling

Security-conscious error messages that don't leak sensitive information:

```typescript
// ✅ Secure error messages
return NextResponse.json(
  { error: 'Authentication failed' }, 
  { status: 401 }
)

// ❌ Insecure - Don't expose internal details
return NextResponse.json(
  { error: 'Database connection failed: postgres://user:pass@host' }, 
  { status: 500 }
)
```

### Logging Security

- **No Sensitive Data**: Logs never contain passwords, tokens, or keys
- **Structured Logging**: All logs use structured format for analysis
- **Audit Trails**: User actions are logged for security monitoring

## 🔍 Security Validation

### Automated Security Checks

The application includes automated security validation:

```bash
# Run security audit
npm run predeploy

# Manual security check
ts-node src/scripts/securityAudit.ts
```

### Security Checks Include:

1. **Environment Variable Exposure**: Ensures no server secrets are exposed to client
2. **Hardcoded Secrets**: Scans for accidentally committed secrets
3. **Security Headers**: Validates all required security headers are present
4. **RLS Implementation**: Ensures Row-Level Security is properly implemented
5. **Console Logging**: Checks for sensitive data in console statements

## 🚨 Security Incident Response

### If a Security Issue is Discovered:

1. **Immediate Response**:
   - Rotate any potentially compromised API keys
   - Review access logs for unauthorized activity
   - Update security configurations if needed

2. **Investigation**:
   - Check audit logs for the affected time period
   - Review user access patterns
   - Analyze any unusual database queries

3. **Prevention**:
   - Update security policies
   - Enhance monitoring
   - Conduct security review

## 📋 Security Checklist

### Before Deployment:

- [ ] All environment variables are properly configured
- [ ] No hardcoded secrets in code
- [ ] Security headers are enabled
- [ ] RLS policies are active in Supabase
- [ ] API routes use secure handlers
- [ ] Logging is sanitized
- [ ] Security audit passes

### Regular Security Maintenance:

- [ ] Review and rotate API keys quarterly
- [ ] Update dependencies for security patches
- [ ] Monitor access logs for anomalies
- [ ] Review user permissions and roles
- [ ] Test security configurations

## 🔧 Security Configuration

### Supabase RLS Policies

Ensure these RLS policies are active in your Supabase dashboard:

```sql
-- Example RLS policy for incidents table
CREATE POLICY "Users can only see their own incidents" ON incidents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own incidents" ON incidents
  FOR UPDATE USING (auth.uid() = user_id);
```

### Environment Variables

Required environment variables for security:

```bash
# Server-only (never expose to client)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Client-safe (can be exposed)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📞 Security Contact

For security-related issues or questions:

- **Security Issues**: Report immediately to the development team
- **Questions**: Contact the technical lead
- **Emergency**: Follow incident response procedures

---

**Remember**: Security is an ongoing process. Regular reviews and updates are essential to maintain a secure application.
