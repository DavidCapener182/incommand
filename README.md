# inCommand - Professional Event Command & Control System

> **Enterprise-grade event management platform with AI intelligence, mobile-first design, and complete collaboration suite**

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)]()

---

## 🌟 What is inCommand?

inCommand is a **professional command and control system** designed for event management, combining real-time incident tracking, AI-powered analytics, mobile-first operations, and enterprise collaboration tools into one comprehensive platform.

**Built for**: Security operations, event managers, emergency responders, venue operators, and command centers.

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- Natural language incident search
- Predictive staffing recommendations
- Auto-categorization and tagging
- Trend detection and anomaly alerts
- Risk prediction models
- AI decision support assistant
- ChatGPT-style conversational interface

### 📱 Mobile-First Operations
- Progressive Web App (PWA) - installable on any device
- Full offline mode with background sync
- Voice-to-text incident reporting
- Camera photo capture with GPS tagging
- Touch-optimized interface
- Quick action buttons

### 📊 Advanced Analytics (9+ Dashboards)
- Operational metrics and KPIs
- Log quality assessment
- Compliance tracking (JESIP/JDM)
- Staff performance analytics
- AI insights and predictions
- Custom metric builder
- Industry benchmarking
- Exportable reports (PDF/CSV/JSON)
- Real-time risk pulse monitoring

### 🔗 Complete Integration Suite
- Email notifications (Resend, SendGrid)
- SMS alerts (Twilio, AWS SNS)
- Webhook system (8+ events)
- REST API with full documentation
- Automated shift handoffs
- External system connectors

### 🏢 Enterprise-Ready
- Multi-tenant architecture
- Role-based access control (7 roles, 25+ permissions)
- Audit logging and compliance
- Data encryption at rest and in transit
- Scalable infrastructure
- Professional incident logging templates

### 📝 Professional Incident Management
- Structured logging templates (JESIP/JDM compliant)
- Dual timestamps (occurrence + logged)
- Non-destructive amendments with audit trail
- Real-time multi-user synchronization
- Training mode for safe practice
- Revision history and compliance tracking

### 🎯 Real-Time Operations
- Live incident dashboard
- WebSocket-based real-time updates
- Command center view
- Staff dispatch and task assignment
- Radio traffic analysis
- Crowd intelligence monitoring
- Operational readiness tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd incommand

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Run database migrations
# See database/ directory for migration files

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📚 Documentation

### For Users
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[User Guide](docs/USER_GUIDE.md)** - Complete feature guide
- **[Tutorials](docs/TUTORIALS.md)** - Step-by-step walkthroughs

### For Administrators
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - System configuration
- **[Configuration Guide](docs/CONFIGURATION_GUIDE.md)** - All integrations
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Problem solving

### For Developers
- **[API Documentation](docs/API_DOCUMENTATION.md)** - REST API reference
- **[Platform Overview](docs/incommand-overview.md)** - Architecture overview
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[Feature Catalogue](docs/FEATURE_CATALOGUE.md)** - Complete feature list

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible components

### Backend
- **Supabase** - Database, authentication, real-time subscriptions
- **PostgreSQL** - Relational database
- **Next.js API Routes** - Serverless functions

### AI & Integrations
- **OpenAI** - Natural language processing and AI features
- **what3words** - Precise location services
- **Resend/SendGrid** - Email delivery
- **Twilio** - SMS notifications

### Mobile
- **Progressive Web App (PWA)** - Installable app experience
- **Service Workers** - Offline support and caching
- **IndexedDB** - Client-side data storage

---

## 📁 Project Structure

```
incommand/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   ├── hooks/            # React hooks
│   ├── types/            # TypeScript definitions
│   └── contexts/         # React contexts
├── database/             # SQL migrations and schemas
├── docs/                 # Documentation
├── public/               # Static assets
└── scripts/              # Build and utility scripts
```

---

## 🎯 Main Features Overview

### Incident Management
- ✅ Professional structured logging templates
- ✅ Dual timestamps (occurrence + logged)
- ✅ Non-destructive amendments
- ✅ Auto-escalation
- ✅ GPS location capture
- ✅ Photo attachments
- ✅ Real-time synchronization

### Analytics & Reporting
- ✅ 9+ dashboard types
- ✅ Custom metric builder
- ✅ PDF/CSV/JSON export
- ✅ Scheduled reports
- ✅ Benchmarking system
- ✅ Compliance reports

### AI Features
- ✅ ChatGPT-style assistant
- ✅ Trend detection
- ✅ Anomaly alerts
- ✅ Auto-categorization
- ✅ Predictive staffing
- ✅ Natural language search

### Mobile
- ✅ PWA (install on phone)
- ✅ Offline mode
- ✅ Voice input
- ✅ Photo capture
- ✅ GPS tracking
- ✅ Quick actions

### Collaboration
- ✅ Live chat
- ✅ Real-time updates
- ✅ Command hierarchy
- ✅ Team coordination
- ✅ File sharing

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:fast         # Start with Turbopack

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analysis

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run typecheck        # TypeScript type checking

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode

# Database
npm run backfill:auditable-logs  # Backfill audit logs
```

### Environment Variables

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side)
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `RESEND_API_KEY` - Email service API key
- Additional keys for integrations (SMS, etc.)

---

## 🏗️ Architecture

### Multi-Tenant Design
- Company-scoped data isolation
- Event-based organization
- Role-based access control (RBAC)
- Row-level security (RLS) policies

### Real-Time Updates
- Supabase Realtime subscriptions
- WebSocket connections
- Optimistic UI updates
- Conflict resolution

### Offline Support
- Service Worker caching
- IndexedDB storage
- Background sync queue
- Conflict resolution on reconnect

---

## 📊 Database Schema

Key tables:
- `incidents` - Incident logs with audit trail
- `events` - Event management
- `profiles` - User profiles with roles
- `companies` - Multi-tenant organization
- `staffing_forecasts` - Predictive staffing data
- `analytics_metrics` - Custom metrics
- See `database/` directory for complete schema

---

## 🔒 Security

- Row-level security (RLS) on all tables
- Role-based access control (RBAC)
- API key management
- Audit logging for all changes
- Data encryption at rest and in transit
- Secure authentication via Supabase Auth

---

## 📈 Roadmap

- [ ] Deeper predictive alerts
- [ ] Advanced collaboration features
- [ ] Expanded integrations
- [ ] Mobile native apps
- [ ] Advanced reporting templates

---

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

- **Documentation**: See `docs/` directory
- **Quick Start**: See [QUICK_START.md](QUICK_START.md)
- **Troubleshooting**: See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

**inCommand v2.0 - Ultimate Platform**  
**Status**: ✅ Production Ready
