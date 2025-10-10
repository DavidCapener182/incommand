# inCommand Configuration Guide

Complete setup guide for all integrations and advanced features

## Table of Contents

1. [AI Model Configuration](#ai-model-configuration)
2. [Email/SMS Providers](#emailsms-providers)
3. [Webhook Configuration](#webhook-configuration)
4. [Third-Party Integrations](#third-party-integrations)
5. [Environment Variables Reference](#environment-variables-reference)

---

## AI Model Configuration

### Supported AI Providers

inCommand supports multiple AI providers for different features:

- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3)
- **Google** (Gemini Pro)
- **Perplexity** (Research-enhanced models)
- **Mistral**
- **Ollama** (Local models)

### Configuration Steps

#### 1. Get API Keys

**OpenAI:**
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up/Login
3. Navigate to API Keys
4. Click "Create new secret key"
5. Copy key immediately (shown only once)

**Anthropic:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create account
3. Go to API Keys
4. Generate new key
5. Copy key

**Perplexity:**
1. Visit [perplexity.ai/settings/api](https://perplexity.ai/settings/api)
2. Generate API key
3. Copy key

#### 2. Add Keys to Environment

**Option A: Via .env.local file**
```bash
# Create/edit .env.local in project root
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_API_KEY=AIza...
MISTRAL_API_KEY=...
```

**Option B: Via Environment Variables (Production)**
In your hosting platform (Vercel, AWS, etc.):
```
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
```

#### 3. Configure Model Selection

**In Admin Panel:**
1. Navigate to **Admin > Settings > AI Configuration**
2. Select models for each feature:

**AI Assistant:**
- Model: Claude 3.5 Sonnet (recommended)
- Or: GPT-4
- Fallback: GPT-3.5 Turbo

**Research Features:**
- Model: Perplexity Sonar Large (recommended)
- Fallback: GPT-4

**Auto-Categorization:**
- Model: GPT-3.5 Turbo (fast & cheap)
- Or: Claude 3 Haiku

**Trend Detection:**
- Model: Claude 3.5 Sonnet
- Or: GPT-4

#### 4. Test AI Features

```bash
# Test AI Assistant
1. Open AI chat in app
2. Ask: "Test message"
3. Should get response within 5 seconds

# Test Auto-Categorization
1. Create incident without type
2. System should suggest type automatically

# Test Trend Detection
1. Navigate to Analytics > AI Insights
2. Should show detected trends
```

### Ollama (Local AI)

For running AI models locally:

#### Installation
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama2
ollama pull mistral
```

#### Configuration
```bash
# .env.local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

#### Advantages
- No API costs
- Data stays local
- No internet required
- Faster for some operations

#### Disadvantages
- Requires powerful hardware
- Self-hosted maintenance
- May be less accurate than cloud models

---

## Email/SMS Providers

### Email Configuration

#### Option 1: Resend (Recommended)

**Why Resend:**
- Simple setup
- Generous free tier (100 emails/day)
- Good deliverability
- EU/UK compliant

**Setup:**
```bash
# 1. Sign up at resend.com
# 2. Get API key
# 3. Add to .env.local
RESEND_API_KEY=re_...

# 4. Verify domain (optional but recommended)
# Follow instructions in Resend dashboard
```

**Configuration in App:**
```
Admin > Integrations > Email
Provider: Resend
API Key: [paste key]
From Email: noreply@your-domain.com
From Name: inCommand
```

#### Option 2: SendGrid

**Setup:**
```bash
# .env.local
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=inCommand
```

**Free Tier:** 100 emails/day

#### Option 3: AWS SES

**Setup:**
```bash
# .env.local
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@your-domain.com
```

**Advantages:**
- Very cheap at scale
- High deliverability
- Integrated with AWS

**Disadvantages:**
- More complex setup
- Requires AWS account
- Starts in sandbox mode (needs approval for production)

### SMS Configuration

#### Option 1: Twilio (Recommended)

**Why Twilio:**
- Reliable worldwide delivery
- Good UK coverage
- Simple API
- Pay as you go

**Setup:**
```bash
# 1. Sign up at twilio.com
# 2. Get phone number
# 3. Get credentials
# 4. Add to .env.local

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+44...
```

**Costs (UK):**
- Phone number: ~£1/month
- SMS: ~£0.04/message

**Configuration in App:**
```
Admin > Integrations > SMS
Provider: Twilio
Account SID: [paste]
Auth Token: [paste]
From Number: +44...
```

#### Option 2: AWS SNS

**Setup:**
```bash
# .env.local
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SNS_SENDER_ID=inCommand
```

**Costs:** Very cheap (~£0.06/message UK)

#### Option 3: MessageBird

**Setup:**
```bash
# .env.local
MESSAGEBIRD_API_KEY=...
MESSAGEBIRD_ORIGINATOR=inCommand
```

### Testing Email/SMS

**Test Email:**
```bash
# In app
Admin > Integrations > Email > Send Test Email
Enter your email > Send
Check inbox (and spam)
```

**Test SMS:**
```bash
# In app
Admin > Integrations > SMS > Send Test SMS
Enter your mobile number > Send
Should receive within 30 seconds
```

---

## Webhook Configuration

### What Are Webhooks?

Webhooks allow inCommand to send real-time notifications to external systems when events occur.

### Common Use Cases

- **Slack notifications** when critical incidents occur
- **Microsoft Teams** updates for team channels
- **Custom dashboards** receiving live data
- **External logging** systems
- **Automated workflows** (Zapier, Make, n8n)

### Webhook Setup

#### 1. Create Webhook Endpoint

**Example: Slack Webhook**
```bash
# 1. Go to api.slack.com/apps
# 2. Create new app
# 3. Enable Incoming Webhooks
# 4. Add webhook to workspace
# 5. Copy webhook URL (looks like):
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### 2. Configure in inCommand

```
Admin > Integrations > Webhooks > Add Webhook

Name: Slack Critical Incidents
URL: [paste Slack webhook URL]
Method: POST
Headers:
  Content-Type: application/json

Events to Send:
  ☑ incident.created (priority: critical)
  ☑ incident.updated (priority: critical)
  ☐ incident.resolved
  
Payload Template:
{
  "text": "🚨 Critical Incident: {{incident.title}}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Incident #{{incident.id}}*\n*Type:* {{incident.type}}\n*Location:* {{incident.location}}\n*Status:* {{incident.status}}"
      }
    }
  ]
}

Test Webhook > Save
```

#### 3. Available Events

- `incident.created`
- `incident.updated`
- `incident.resolved`
- `incident.closed`
- `incident.critical`
- `staff.checked_in`
- `staff.checked_out`
- `alert.triggered`
- `resource.low`

#### 4. Webhook Security

**HMAC Signature Verification:**
```javascript
// Webhook receivers can verify authenticity
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hmac === signature;
}
```

**In inCommand:**
```
Admin > Integrations > Webhooks > [Your Webhook]
Secret Key: [generate or provide your own]
Signature Header: X-InCommand-Signature
```

### Example Integrations

#### Zapier
```
1. Create Zap
2. Trigger: Webhooks by Zapier
3. Copy webhook URL
4. Add to inCommand as webhook
5. Configure actions in Zapier
```

#### Discord
```
1. Server Settings > Integrations > Webhooks
2. Create webhook
3. Copy URL
4. Add to inCommand

Payload:
{
  "content": "🚨 {{incident.title}}",
  "embeds": [{
    "title": "Incident #{{incident.id}}",
    "description": "{{incident.description}}",
    "color": 15158332,
    "fields": [
      {"name": "Type", "value": "{{incident.type}}", "inline": true},
      {"name": "Priority", "value": "{{incident.priority}}", "inline": true},
      {"name": "Location", "value": "{{incident.location}}"}
    ]
  }]
}
```

---

## Third-Party Integrations

### Slack Integration

**Full Setup:**
```
1. Create Slack App (api.slack.com/apps)
2. Enable:
   - Incoming Webhooks
   - Bot Token Scopes: chat:write, chat:write.public
3. Install to workspace
4. Copy Bot Token & Webhook URL
5. Add to inCommand:
   Admin > Integrations > Slack
   Bot Token: xoxb-...
   Webhook URL: hooks.slack.com/services/...
   
6. Choose channels:
   Critical Incidents: #incidents-critical
   All Incidents: #incidents
   Staff Updates: #staff-updates
```

### Microsoft Teams

**Setup:**
```
1. Teams channel > Connectors
2. Add "Incoming Webhook"
3. Name: inCommand Notifications
4. Copy webhook URL
5. Add to inCommand:
   Admin > Integrations > Teams
   Webhook URL: [paste]
```

### Google Maps / Mapbox

**For advanced mapping features:**

**Mapbox (Recommended):**
```bash
# 1. Sign up at mapbox.com
# 2. Get access token
# 3. Add to .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# Features enabled:
- 3D venue visualization
- Custom map styles
- Indoor positioning
- Route optimization
```

**Google Maps:**
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...
```

### What3Words

**For precise location:**
```bash
# 1. Sign up at what3words.com/developers
# 2. Get API key
# 3. Add to .env.local
WHAT3WORDS_API_KEY=...

# Features:
- Convert GPS to 3-word addresses
- Easy verbal location sharing
- Integrated in location capture
```

### Weather Services

**OpenWeatherMap (Free tier):**
```bash
# .env.local
OPENWEATHER_API_KEY=...

# Features:
- Current weather
- 5-day forecast
- Weather impact predictions
```

### Payment Processing (Optional)

**Stripe (for subscription management):**
```bash
# .env.local
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin configuration:
Admin > Billing > Stripe
Enable subscriptions, invoicing, payment processing
```

---

## Environment Variables Reference

### Complete .env.local Template

```bash
# ==========================================
# CORE CONFIGURATION
# ==========================================

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ==========================================
# AI SERVICES
# ==========================================

# OpenAI (GPT models)
OPENAI_API_KEY=sk-proj-...

# Anthropic (Claude models) - Recommended
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity (Research features) - Recommended
PERPLEXITY_API_KEY=pplx-...

# Google (Gemini models)
GOOGLE_API_KEY=AIza...

# Mistral
MISTRAL_API_KEY=...

# Ollama (Local) - Optional
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# ==========================================
# EMAIL SERVICES (Choose one)
# ==========================================

# Resend (Recommended)
RESEND_API_KEY=re_...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@your-domain.com

# AWS SES
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@your-domain.com

# ==========================================
# SMS SERVICES (Choose one)
# ==========================================

# Twilio (Recommended)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+44...

# AWS SNS
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# MessageBird
MESSAGEBIRD_API_KEY=...
MESSAGEBIRD_ORIGINATOR=inCommand

# ==========================================
# MAPS & LOCATION
# ==========================================

# Mapbox (Recommended)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...

# What3Words
WHAT3WORDS_API_KEY=...

# ==========================================
# WEATHER
# ==========================================

# OpenWeatherMap
OPENWEATHER_API_KEY=...

# ==========================================
# MONITORING & ANALYTICS
# ==========================================

# Sentry (Error tracking) - Optional
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# PostHog (Analytics) - Optional
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ==========================================
# PAYMENT PROCESSING (Optional)
# ==========================================

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ==========================================
# STORAGE (Usually Supabase, but can use AWS)
# ==========================================

# AWS S3 (Optional, for external storage)
AWS_S3_BUCKET=...
AWS_S3_REGION=eu-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# ==========================================
# BLOCKCHAIN (Optional)
# ==========================================

# Ethereum/Polygon for audit trail
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_PRIVATE_KEY=...
BLOCKCHAIN_CONTRACT_ADDRESS=0x...

# ==========================================
# DEVELOPMENT
# ==========================================

# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Enable debug logging
DEBUG=true
LOG_LEVEL=info
```

### Minimal Setup (Required Only)

```bash
# Absolute minimum to run inCommand

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# At least one AI provider
ANTHROPIC_API_KEY=sk-ant-...

# That's it! Everything else is optional.
```

### Testing Configuration

```bash
# Test if all keys are working
npm run test:config

# Or check in app:
Admin > System Settings > Test Configuration
```

---

## Security Best Practices

### API Key Management

✅ **DO:**
- Use environment variables
- Never commit keys to git
- Rotate keys regularly
- Use different keys for dev/prod
- Limit key permissions
- Monitor key usage

❌ **DON'T:**
- Hardcode keys in source code
- Share keys in chat/email
- Use same key across projects
- Give keys broader permissions than needed

### .gitignore Configuration

Ensure your `.gitignore` includes:
```
.env
.env.local
.env*.local
*.key
*.pem
secrets/
```

---

## Troubleshooting Configuration

### AI Not Working

1. **Check API key validity:**
   ```bash
   # Test OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   
   # Should return list of models
   ```

2. **Check key format:**
   - OpenAI: `sk-proj-...` or `sk-...`
   - Anthropic: `sk-ant-...`
   - Perplexity: `pplx-...`

3. **Check account status:**
   - Login to provider dashboard
   - Verify account is active
   - Check usage limits
   - Ensure payment method is valid

### Emails Not Sending

1. **Check SMTP configuration**
2. **Verify domain (if using custom domain)**
3. **Check spam folder**
4. **Test with different email provider**
5. **Check provider dashboard for bounces**

### Webhooks Not Firing

1. **Check webhook URL is correct**
2. **Verify events are enabled**
3. **Check webhook logs:**
   ```
   Admin > Integrations > Webhooks > [Your Webhook] > Logs
   ```
4. **Test webhook manually:**
   ```bash
   curl -X POST [your-webhook-url] \
     -H "Content-Type: application/json" \
     -d '{"test": "message"}'
   ```

---

## Next Steps

After configuration:
1. ✅ Test all integrations
2. ✅ Train your team
3. ✅ Run a test event
4. ✅ Monitor system health
5. ✅ Set up automated backups

**Need help?** Contact support@incommand.app


