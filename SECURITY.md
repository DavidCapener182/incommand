# Security Documentation

This document outlines the security measures implemented in the inCommand application.

## 🔒 Security Headers

The application implements comprehensive security headers via `next.config.js`:

### Content Security Policy (CSP)
- **default-src**: Restricts resources to same origin
- **script-src**: Allows scripts from trusted sources (Supabase, CDNs)
- **style-src**: Allows styles from Google Fonts and CDNs
- **font-src**: Allows fonts from Google Fonts and CDNs
- **img-src**: Allows images from HTTPS sources and data URIs
- **connect-src**: Allows connections to Supabase, OpenWeatherMap, and What3Words APIs
- **frame-src**: Restricts frames to same origin
- **object-src**: Blocks all objects for security
- **base-uri**: Restricts base URI to same origin
- **form-action**: Restricts form submissions to same origin
- **frame-ancestors**: Blocks embedding in iframes (clickjacking protection)

### Additional Security Headers
- **Strict-Transport-Security**: Enforces HTTPS with 1-year max age
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS protection in older browsers
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features (camera, microphone, etc.)

## 🚦 Rate Limiting

Rate limiting is implemented using Upstash Redis with different limits for different endpoints:

### Rate Limit Categories
- **General API**: 100 requests per minute
- **Authentication**: 5 requests per 5 minutes
- **AI/ML Endpoints**: 20 requests per minute
- **Social Media**: 30 requests per minute
- **File Upload**: 10 requests per minute

### Implementation
- Uses client IP or user ID for identification
- Includes retry-after headers in responses
- Graceful degradation on Redis failures
- Comprehensive logging of rate limit events

## ✅ Input Validation

All API endpoints use Zod schemas for input validation:

### Validation Schemas
- **Common**: UUID, email, password, phone, URL, date validation
- **Incident**: Create/update incident, filters validation
- **User**: Create/update user, preferences validation
- **Event**: Create/update event validation
- **Staff**: Create/update staff validation
- **AI**: Insights and chat validation
- **Social Media**: Summary request validation
- **File Upload**: File metadata validation
- **Weather**: Coordinate validation

### Validation Features
- Type-safe validation with TypeScript
- Comprehensive error messages
- Automatic sanitization integration
- Structured logging of validation failures

## 🛡️ XSS Protection

XSS protection is implemented using DOMPurify with multiple sanitization levels:

### Sanitization Levels
- **Strict**: Minimal allowed tags (b, i, em, strong, a, p, br)
- **Rich Text**: Extended tags for formatted content
- **Admin**: Permissive for admin content (blocks scripts only)

### Sanitization Functions
- `sanitize()`: Main content sanitization
- `sanitizeAttribute()`: HTML attribute sanitization
- `sanitizeUrl()`: URL validation and sanitization
- `sanitizeObject()`: Object property sanitization
- `sanitizeFormData()`: Form data sanitization
- `sanitizeSearchQuery()`: Search query sanitization
- `sanitizeFileName()`: File name sanitization

### Security Features
- Blocks dangerous HTML tags and attributes
- Prevents JavaScript injection
- Validates URLs against dangerous protocols
- Removes path traversal attempts
- Comprehensive logging of sanitization events

## 🔐 Authentication & Authorization

### Authentication Middleware
- JWT token validation with Supabase
- User profile verification
- Role-based access control
- Company-based access control

### Authorization Levels
- **Public**: No authentication required
- **Authenticated**: Valid user token required
- **Role-based**: Specific roles required (user, admin, superadmin)
- **Company-based**: Company access required

### Security Features
- Token expiration handling
- Role verification
- Company access verification
- Comprehensive error logging
- Graceful error handling

## 📊 Security Monitoring

### Logging
- Structured logging with component and action context
- Security event logging (authentication, validation, rate limiting)
- Error tracking with detailed context
- Performance monitoring

### Error Handling
- Graceful degradation on security failures
- User-friendly error messages
- Detailed internal logging
- No sensitive data exposure in responses

## 🔧 Environment Variables

### Required Security Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# API Keys
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_key
```

## 🚨 Security Best Practices

### Development
1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Validate all inputs** before processing
4. **Sanitize all outputs** before rendering
5. **Log security events** for monitoring

### Deployment
1. **Use HTTPS** in production
2. **Enable security headers** via Next.js config
3. **Monitor rate limiting** for abuse detection
4. **Regular security audits** of dependencies
5. **Keep dependencies updated** for security patches

### API Security
1. **Rate limit all endpoints** to prevent abuse
2. **Validate all inputs** with Zod schemas
3. **Sanitize all data** before processing
4. **Use authentication** for sensitive endpoints
5. **Log all security events** for monitoring

## 🔍 Security Testing

### Automated Testing
- Input validation testing
- Rate limiting testing
- Authentication testing
- XSS protection testing

### Manual Testing
- Security header verification
- Rate limit behavior testing
- Authentication flow testing
- Input sanitization testing

## 📋 Security Checklist

- [x] Security headers implemented
- [x] Rate limiting configured
- [x] Input validation with Zod
- [x] XSS protection with DOMPurify
- [x] Authentication middleware
- [x] Authorization controls
- [x] Comprehensive logging
- [x] Error handling
- [x] Environment variable security
- [x] HTTPS enforcement
- [ ] Security testing automation
- [ ] Dependency vulnerability scanning
- [ ] Regular security audits

## 🆘 Security Incident Response

### Reporting
- Report security issues to the development team
- Include detailed reproduction steps
- Provide relevant logs and error messages

### Response Process
1. **Assessment**: Evaluate the security issue
2. **Containment**: Prevent further exploitation
3. **Investigation**: Determine root cause
4. **Remediation**: Implement security fixes
5. **Verification**: Test the fixes
6. **Documentation**: Update security documentation

## 📞 Security Contact

For security-related issues or questions:
- Create a security issue in the repository
- Include "SECURITY" in the issue title
- Provide detailed information about the concern

---

**Last Updated**: December 2024
**Version**: 1.0.0
