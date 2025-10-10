# inCommand - Complete Deployment Guide

## 🚀 **Production Deployment Checklist**

This guide provides step-by-step instructions for deploying the complete inCommand platform to production.

---

## 📋 **Pre-Deployment Checklist**

### **1. Environment Setup**

- [ ] Production Supabase project created
- [ ] Environment variables configured
- [ ] API keys obtained for all services
- [ ] Domain name registered and configured
- [ ] SSL certificate obtained
- [ ] CDN configured (optional)

### **2. Database Setup**

- [ ] Run all 12 database migrations
- [ ] Enable Row Level Security (RLS)
- [ ] Create storage buckets
- [ ] Configure backup schedule
- [ ] Set up monitoring alerts

### **3. Third-Party Services**

- [ ] Email provider configured (Resend/SendGrid)
- [ ] SMS provider configured (Twilio/AWS SNS)
- [ ] Map service API key (Mapbox)
- [ ] Video conferencing provider (Agora/Twilio/Jitsi)
- [ ] Analytics tracking (Vercel Analytics)

### **4. Security Configuration**

- [ ] Security headers enabled
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] API keys rotated
- [ ] Audit logging active

---

## 🗄️ **Database Migration Steps**

### **Order of Execution:**

```bash
# 1. Core incident logging
psql -f database/incident_logs_status_migration.sql

# 2. GPS coordinates for incidents
psql -f database/add_gps_coordinates_migration.sql

# 3. Risk scoring system
psql -f database/add_risk_weights_migration.sql

# 4. Incident assignment and escalation
psql -f database/incident_assignment_escalation_migration.sql

# 5. Predictive analytics
psql -f database/predictive_analytics_migration.sql

# 6. Push notifications
psql -f database/push_notifications_migration.sql
psql -f database/push_subscriptions_migration.sql

# 7. Settings management
psql -f database/settings_management_migration.sql

# 8. Photo attachments
psql -f database/incident_photos_migration.sql

# 9. Integrations (email, SMS, webhooks, API)
psql -f database/integrations_migration.sql

# 10. Multi-tenant support
psql -f database/multi_tenant_migration.sql

# 11. Collaboration features
psql -f database/collaboration_migration.sql
```

### **Supabase Storage Buckets:**

Create these buckets in Supabase Dashboard > Storage:

1. **incident-photos**
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: `image/*`

2. **shared-files**
   - Public: No (use signed URLs)
   - File size limit: 100MB
   - Allowed MIME types: All

---

## 🔑 **Environment Variables**

### **Required Variables**

Create `.env.local` file:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Provider (Choose one)
RESEND_API_KEY=re_your_key
# OR
SENDGRID_API_KEY=SG.your_key

# SMS Provider (Optional)
TWILIO_ACCOUNT_SID=AC_your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
# OR
AWS_SNS_REGION=us-east-1
AWS_SNS_ACCESS_KEY_ID=your_key
AWS_SNS_SECRET_ACCESS_KEY=your_secret

# Maps & Location (Optional)
MAPBOX_API_KEY=pk.your_key
WHAT3WORDS_API_KEY=your_key

# Video Conferencing (Optional)
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
# OR
TWILIO_VIDEO_API_KEY=your_key
TWILIO_VIDEO_API_SECRET=your_secret

# API Configuration
API_KEYS=key1,key2,key3
DEFAULT_WEBHOOK_URL=https://external-system.com/webhook

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## 🌐 **Deployment Platforms**

### **Option 1: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod

# Environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all required variables
```

**Vercel Configuration** (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### **Option 2: AWS (Amplify/EC2)**

```bash
# Install AWS Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### **Option 3: Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build Docker image
docker build -t incommand:latest .

# Run container
docker run -p 3000:3000 --env-file .env.local incommand:latest
```

---

## 🔧 **Post-Deployment Configuration**

### **1. Supabase Setup**

```sql
-- Create default organization
INSERT INTO organizations (name, slug, tier, is_active)
VALUES ('Your Organization', 'your-org', 'professional', true);

-- Create admin user role assignment
INSERT INTO user_roles (user_id, role_id, organization_id)
VALUES (
  'your-user-id',
  'admin',
  'your-org-id'
);

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE incident_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE incident_log_revisions;
```

### **2. Storage Buckets Configuration**

In Supabase Dashboard > Storage:

**incident-photos bucket:**
```json
{
  "public": true,
  "fileSizeLimit": 10485760,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"]
}
```

**shared-files bucket:**
```json
{
  "public": false,
  "fileSizeLimit": 104857600,
  "allowedMimeTypes": ["*"]
}
```

### **3. Email Templates**

Configure sender domain in Resend/SendGrid:
- Domain: your-domain.com
- DKIM/SPF records configured
- Sender email: noreply@your-domain.com

### **4. Webhook Configuration**

Register default webhooks via API or database:

```sql
INSERT INTO webhooks (name, url, events, is_active)
VALUES (
  'External Monitoring',
  'https://monitoring.external-system.com/webhook',
  ARRAY['incident.created', 'alert.critical'],
  true
);
```

---

## 📊 **Monitoring Setup**

### **Application Monitoring**

```bash
# Vercel Analytics (automatic)
# No additional setup needed

# Custom monitoring endpoints
GET /api/health
GET /api/metrics
```

### **Database Monitoring**

Enable in Supabase Dashboard:
- Query performance insights
- Connection pooling
- Slow query logs
- Error tracking

### **Alerts Configuration**

Set up alerts for:
- API error rate > 5%
- Response time > 2s
- Database CPU > 80%
- Storage > 90% full
- Failed authentications > 10/min

---

## 🔒 **Security Hardening**

### **1. Security Headers**

Add to `next.config.js`:

```javascript
{
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)'
          }
        ]
      }
    ]
  }
}
```

### **2. Rate Limiting**

Implement in middleware:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const apiKey = request.headers.get('X-API-Key')
  
  // Check rate limit
  const allowed = await checkRateLimit(ip, apiKey)
  
  if (!allowed) {
    return new NextResponse('Rate limit exceeded', { status: 429 })
  }
  
  return NextResponse.next()
}
```

### **3. CORS Configuration**

```typescript
// Allow specific origins
const allowedOrigins = [
  'https://your-domain.com',
  'https://app.your-domain.com'
]

export function corsMiddleware(origin: string) {
  return allowedOrigins.includes(origin)
}
```

---

## 🧪 **Pre-Production Testing**

### **1. Run Full Test Suite**

```bash
# Unit tests
npm test -- --coverage

# E2E tests (all browsers)
npx playwright test

# Performance tests
npm run test:performance

# Security audit
npm audit
npx snyk test
```

### **2. User Acceptance Testing**

Test these critical workflows:
- [ ] Create event
- [ ] Log incident (online)
- [ ] Log incident (offline, then sync)
- [ ] Voice input incident
- [ ] Attach photo to incident
- [ ] Amend incident log
- [ ] View analytics
- [ ] Export PDF report
- [ ] Search incidents
- [ ] Create custom metric
- [ ] View benchmarking
- [ ] Send email notification
- [ ] Test webhook delivery

### **3. Load Testing**

```bash
# Test with production-like load
npm run test:load -- --users=100 --duration=300
```

Expected results:
- ✅ P95 response time < 500ms
- ✅ P99 response time < 1s
- ✅ Error rate < 1%
- ✅ Throughput > 100 req/s

---

## 📦 **Build for Production**

```bash
# Install dependencies
npm ci --production

# Build application
npm run build

# Test production build locally
npm start

# Verify build
# Should see: "Ready on http://localhost:3000"
```

---

## 🌍 **DNS Configuration**

### **DNS Records**

```
# Main domain
A     @              -> Your server IP
AAAA  @              -> Your IPv6 (optional)

# WWW subdomain
CNAME www            -> your-domain.com

# API subdomain (optional)
CNAME api            -> your-domain.com

# Client portal subdomain (optional)
CNAME portal         -> your-domain.com

# Email verification
TXT   @              -> "v=spf1 include:_spf.resend.com ~all"
TXT   resend._domainkey -> [DKIM key from Resend]
```

---

## 🔄 **Backup & Recovery**

### **Automated Backups**

Enable in Supabase Dashboard:
- Daily automatic backups
- Point-in-time recovery
- 7-day retention (Free tier)
- 30-day retention (Pro tier)

### **Manual Backup**

```bash
# Export database
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

# Export storage
# Use Supabase CLI or Dashboard
```

### **Restore Procedure**

```bash
# Restore database
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql

# Verify data
psql -h db.your-project.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM incident_logs;"
```

---

## 📈 **Scaling Strategy**

### **Horizontal Scaling**

**Vercel (Automatic):**
- Automatic scaling
- Edge network
- Serverless functions
- No configuration needed

**Self-Hosted:**
```bash
# Use PM2 for clustering
npm install -g pm2

# Start with cluster mode
pm2 start ecosystem.config.js
```

### **Database Scaling**

**Supabase:**
- Start: Free tier (500MB, unlimited API requests)
- Growth: Pro tier (8GB, dedicated resources)
- Scale: Enterprise (custom, read replicas)

**Connection Pooling:**
```javascript
// Use Supabase connection pooler
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
)
```

---

## 🔐 **Security Checklist**

### **Pre-Launch Security Review**

- [ ] All environment variables use secrets manager
- [ ] No API keys in code
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] RLS policies tested
- [ ] API authentication working
- [ ] Rate limiting enabled
- [ ] File upload restrictions in place
- [ ] XSS protection verified
- [ ] SQL injection tested
- [ ] CSRF protection enabled
- [ ] Session management secure
- [ ] Audit logging active

### **Post-Launch Security**

- [ ] Monitor failed login attempts
- [ ] Review audit logs daily
- [ ] Run weekly security scans
- [ ] Update dependencies monthly
- [ ] Conduct quarterly pen tests
- [ ] Review access controls monthly

---

## 📱 **PWA Deployment**

### **Service Worker Registration**

Verify in production:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-enhanced.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.error('SW failed', err))
}
```

### **PWA Checklist**

- [ ] HTTPS enabled
- [ ] manifest.json accessible
- [ ] Service worker registered
- [ ] Icons in all sizes
- [ ] Start URL works
- [ ] Installability verified
- [ ] Offline page works
- [ ] Background sync tested

---

## 🎯 **Performance Optimization**

### **Before Launch**

```bash
# Analyze bundle size
npm run build -- --analyze

# Optimize images
npm install -g sharp-cli
sharp-cli --input public --output public/optimized

# Generate static pages
npm run build
# Verify .next/server/pages/*.html
```

### **CDN Configuration**

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com', 'your-project.supabase.co'],
    formats: ['image/avif', 'image/webp']
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

---

## 📊 **Monitoring & Analytics**

### **Application Monitoring**

**Vercel Analytics:**
- Automatically enabled
- Real-time metrics
- Core Web Vitals
- User analytics

**Custom Monitoring:**
```typescript
// Add to critical endpoints
import { logger } from '@/lib/logger'

logger.info('API call', {
  endpoint: '/api/incidents',
  method: 'POST',
  duration: 150,
  userId: 'user-id'
})
```

### **Database Monitoring**

Supabase provides:
- Query performance
- Connection count
- Storage usage
- API request volume

### **Error Tracking**

Integrate Sentry (optional):

```bash
npm install @sentry/nextjs

# Configure
npx @sentry/wizard@latest -i nextjs
```

---

## 🚨 **Incident Response Plan**

### **If Production Issues Occur**

**1. Immediate Response:**
```bash
# Check application logs
vercel logs

# Check database status
# Supabase Dashboard > Database

# Rollback if needed
vercel rollback
```

**2. Escalation Path:**
- Level 1: Development team (< 1 hour)
- Level 2: DevOps team (1-4 hours)
- Level 3: External support (> 4 hours)

**3. Communication:**
- Status page update
- Email to affected users
- Internal team notification
- Post-mortem documentation

---

## 📋 **Launch Day Checklist**

### **T-24 Hours**

- [ ] Final code freeze
- [ ] Complete test suite run
- [ ] Database backup
- [ ] Security scan
- [ ] Performance test
- [ ] Stakeholder notification

### **T-4 Hours**

- [ ] Deploy to production
- [ ] Verify all services
- [ ] Test critical paths
- [ ] Monitor error rates
- [ ] Check performance metrics

### **T-0 (Launch)**

- [ ] Enable production traffic
- [ ] Monitor dashboards
- [ ] Test user workflows
- [ ] Check real-time features
- [ ] Verify notifications

### **T+4 Hours**

- [ ] Review error logs
- [ ] Check performance
- [ ] User feedback collection
- [ ] Issue triage
- [ ] Team debrief

---

## 🎓 **User Onboarding**

### **Admin Setup**

1. Create organization
2. Configure branding (if white-label)
3. Set up user roles
4. Configure notification preferences
5. Import staff list
6. Create first event
7. Configure API keys (if needed)
8. Set up webhooks (if needed)

### **User Training**

Provide access to:
- User guides in `/docs`
- Video tutorials (create these)
- Training mode in app
- Help documentation
- Support contact

---

## 📈 **Success Metrics**

### **Track These KPIs:**

**Technical:**
- Uptime > 99.9%
- Page load < 2s
- API response < 500ms
- Error rate < 0.1%
- Test coverage > 80%

**Business:**
- User adoption rate
- Daily active users
- Incidents logged per event
- Customer satisfaction score
- Feature usage analytics

**Operational:**
- Average response time
- Incident resolution time
- Log quality score
- Compliance rate
- Staff utilization

---

## 🔄 **Continuous Improvement**

### **Weekly**
- Review error logs
- Check performance metrics
- Update dependencies
- User feedback review

### **Monthly**
- Security patch updates
- Feature usage analysis
- Performance optimization
- User training sessions

### **Quarterly**
- Major feature releases
- Security audit
- Infrastructure review
- Stakeholder review

---

## 🎉 **DEPLOYMENT COMPLETE!**

Once deployed, your platform provides:

✅ **World-class event management**  
✅ **AI-powered intelligence**  
✅ **Mobile-first experience**  
✅ **Enterprise scalability**  
✅ **Complete collaboration**  
✅ **Production-grade quality**

**Welcome to the future of event command and control!** 🚀

---

## 📞 **Support & Resources**

**Documentation**: All files in `/docs` directory  
**API Reference**: `docs/API_DOCUMENTATION.md`  
**Security Guide**: `docs/SECURITY_AUDIT.md`  
**Testing Guide**: `docs/TESTING_GUIDE.md`  
**Project Summary**: `docs/PROJECT_COMPLETE_SUMMARY.md`

**Server**: http://localhost:3000 (development)  
**Production**: https://your-domain.com

---

**Last Updated**: January 2024  
**Platform Version**: 1.0.0  
**Status**: 🟢 Production Ready
