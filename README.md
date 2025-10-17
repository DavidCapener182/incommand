# inCommand (Event Control)

## Overview

inCommand is a comprehensive event control dashboard built with Next.js and Supabase. It features multi-tenancy, user profiles, event/incident management, role-based permissions, real-time notifications, AI-powered insights, and a modern, responsive UI designed for professional event management.

## Key Features

### Core Event Management
- **Multi-Tenancy**: Company isolation for users and events
- **Event & Incident Management**: Create, view, and manage events and incidents with role-based permissions
- **Photo Attachments**: Upload and preview incident photos with audit logging
- **User Profiles**: Display user roles and profile information
- **Real-time Updates**: Live incident tracking with automatic refresh

### AI-Powered Features
- **AI Chat Assistant**: Intelligent chatbot with conversation history for event management support
- **AI-Powered Debrief Summary**: Automatically generates comprehensive debrief reports with event overview, attendance analysis, incident tables, and key learning points
- **AI Insights Carousel**: Rotating AI-generated insights with auto-advance functionality and manual navigation
- **Predictive Analytics**: AI-based predictions for future incidents and trends

### Advanced Notification System
- **Smart Toast Notifications**: 
  - Repositioned to avoid menu bar interference
  - Extended duration for high-priority incidents (12 seconds) and regular incidents (8 seconds)
  - Client-side deduplication to prevent duplicate notifications
  - Priority-based color coding and animations
- **Notification Drawer**: 
  - Right-side sliding drawer with backdrop
  - Activity feed with recent actions and incident updates
  - AI-powered summary with quick stats and urgent alerts
  - Mark all as read functionality
  - Persistent notification tracking with localStorage
  - Real-time badge with unread count and animations
- **Real-time Subscriptions**: Live incident updates with toast notifications for new incidents and status changes

### Staff Management & Operations
- **Modern Callsign Assignment**: 
  - Card-based interface with color-coded departments
  - Visual status indicators and staff avatars with skill badges
  - Real-time assignment with dropdown menus and search functionality
  - Responsive design supporting 1-8 column layouts
- **Department Management**: Full CRUD operations with custom colors and categories
- **Staff Database**: Company-isolated staff records with role and skill tracking
- **Available Staff Display**: Compact cards with hover tooltips showing qualifications

### Super Admin & Business Intelligence
- **Development Tracking**: Comprehensive cost tracking system for development hours and AI usage
- **ROI Analytics**: Break-even analysis and profitability projections
- **Subscription Modeling**: Revenue forecasting with £25/month pricing structure
- **Business Metrics**: Real-time investment tracking with detailed cost breakdowns
- **Super Admin Access**: Restricted to authorized email addresses with full system oversight

### Analytics Dashboard
- **Incident Heatmap**: Visualizes incident locations to identify hotspots
- **Performance Metrics**: Tracks key performance indicators for events
- **Comprehensive Event Analysis**: AI-powered analysis of entire event database including:
  - Event status overview (total/open/high-priority incidents)
  - Complete incident type breakdown
  - Recent activity analysis
  - Trend analysis and pattern detection
  - Location hotspot identification
  - Actionable security recommendations

### Dashboard Cards & UI
- **Venue Occupancy**: Live stats with progress bar, color-coded capacity levels, and critical state animations (pulse + red border at 100%)
- **Weather Card**: Current weather and forecast for venue location (responsive design)
- **What3Words Map Card**: Clickable card opening fullscreen modal map with enhanced mobile layout
- **Current Event Card**: Integrated AI insights with cycling paragraphs and navigation controls
- **Responsive Navigation**: Collapsible hamburger menu for mobile devices
- **Enhanced KPI Grid**: Progressive responsive layout (2→4→6→8 columns) with reduced padding for better space utilization
- **Real-time Timestamps**: "Last Updated" timestamp above incident table for live operations awareness
- **Floating Action Button**: Persistent "New Incident" button with smart visibility management

### Enhanced User Experience
- **Incident Creation Modal**: 
  - Complete UI/UX redesign with three-column responsive layout
  - Quick Add bar moved to full-width top section for better visibility
  - Incident Type chips with color-coded categories and search functionality
  - Independent scrolling for incident type list (no interference with other fields)
  - Section headers with icons and improved visual hierarchy
  - Styled select components with custom chevrons
  - Enhanced textareas with light grey backgrounds
  - Sticky footer with modern button styles (red "Log Incident", blue outline "Save as Draft")
  - Usage-based incident type sorting per device/browser
  - Improved quick actions and context-aware logic
  - Pre-filled attendance quick input
  - Complete form reset functionality
- **Incident Log Table**: 
  - Responsive design with proper column alignment
  - Type column centered on mobile
  - Truncated occurrence/action columns on desktop
  - Status column always visible
  - Real-time updates with subscription management
- **Search & Filtering**: Enhanced search functionality with improved layout
- **Mobile Optimization**: Comprehensive responsive design across all components

### Technical Enhancements
- **Build Optimization**: Resolved webpack module errors and build cache issues
- **Performance Improvements**: Optimized API calls and reduced redundant requests
- **Error Handling**: Enhanced error states with retry functionality
- **Accessibility**: Improved ARIA labels, keyboard navigation, and WCAG AA contrast compliance
- **State Management**: Proper context management for notifications and UI states
- **Component Architecture**: Enhanced TypeScript safety and component organization
- **Responsive Design**: Comprehensive mobile-first approach with logical stacking

## 🧭 Complete Feature Catalog

Below is a consolidated catalog of implemented capabilities. For deep coverage and file references, see `README_COMPLETE.md` and `ULTIMATE_PLATFORM_COMPLETE.md`.

### Incident & Event Management
- Multi-tenant organizations and events with RBAC
- Full incident lifecycle: create, update, debrief, report, archive
- Photo attachments with audit logging and secure storage
- Structured logging templates (JESIP/JDM aligned)

### AI-Powered Intelligence
- Conversational AI assistant with natural language commands
- Auto-categorization and priority suggestions
- Predictive analytics (incident probability, staffing recommendations)
- Trend and anomaly detection with confidence scoring

### Analytics & Reporting
- 9+ dashboards: operational KPIs, log quality, compliance, user activity
- Executive summaries and compliance reports (PDF/CSV/JSON export)
- Custom metric and dashboard builders; benchmarking and trend analysis

### Notifications & Real-Time
- Smart toast system with deduplication and priority handling
- Notification drawer with unread badges and AI summaries
- WebSocket-driven live updates across incidents, analytics, and chat

### Staff Management & Operations
- Callsign assignment UI (card-based, color-coded departments)
- Staff database with roles, skills, and availability
- Department CRUD with categories and real-time assignment

### Collaboration Suite
- Real-time chat with incident threads and presence indicators
- File sharing, @mentions, pinned messages, read receipts
- Collaborative notes and command hierarchy visualization

### Command Center Display
- Wall-mounted dashboard mode (`/display`)
- Auto-rotating views, multi-screen support, map-centric layouts

### Search & Discovery
- Full-text and semantic search framework
- Smart collections (saved filters), duplicates and related suggestions

### Automation Workflows
- Visual rule engine with if–then–else logic
- Auto-escalation, smart routing, resource allocation templates

### Machine Learning Platform
- Custom model training and prediction pipelines
- Pattern learning from operator corrections

### IoT & Sensors
- Camera feeds, crowd density, environmental sensors, alert beacons
- Access control and emergency button integrations (frameworks)

### Geospatial Platform
- 3D venue modeling, indoor positioning (beacons), route optimization
- Geofencing, zones, heat maps, AR marker support (ready)

### Business Intelligence
- Data warehouse schema and BI connectors (Power BI/Tableau)
- SQL query builder, custom data models, scheduled reports

### Marketplace & Plugins
- Plugin architecture and SDK; marketplace UI (`/marketplace`)
- Hooks, events, developer portal (ready)

### Security & Compliance
- RLS on all tables, RBAC, audit trail with blockchain option
- GDPR-ready, SOC2-aligned patterns, HTTPS/TLS, rate limits

### Monitoring & Observability
- Error tracking, performance metrics, usage analytics
- System health snapshots and feature adoption tracking (`/monitoring`)

### Mobile & PWA
- Installable PWA with offline mode and background sync
- Voice input, camera+GPS capture, touch-optimized UI

### Integrations
- Email (Resend/SendGrid/SES), SMS (Twilio/SNS/MessageBird)
- Webhooks and REST API, Maps (Mapbox/Google), Weather (OpenWeather)

### Administration & Multi-Tenancy
- Organization management, feature flags, subscription modeling
- White-label branding, custom domains, multi-tier plans

See also:
- `README_COMPLETE.md` — comprehensive overview and metrics
- `ULTIMATE_PLATFORM_COMPLETE.md` — implementation summary and file map

## Recent Major Updates (January 2025)

### Dashboard & Incident Creation UI/UX Overhaul (January 2025)
- **Dashboard Enhancements**: 
  - Added "Last Updated" timestamp above incident table for real-time awareness
  - Enhanced venue occupancy with critical state animations (pulse + red border at 100% capacity)
  - Implemented progressive responsive KPI grid (2→4→6→8 columns)
  - Reduced KPI card padding for better space utilization
  - Fixed floating "New Incident" button visibility management
- **Incident Creation Modal Redesign**:
  - Complete visual overhaul with three-column responsive layout
  - Quick Add bar moved to full-width top section
  - Incident Type chips with color-coded categories and search functionality
  - Independent scrolling for incident type list (no interference with other fields)
  - Section headers with icons and improved visual hierarchy
  - Styled select components with custom chevrons
  - Enhanced textareas with light grey backgrounds
  - Sticky footer with modern button styles (red "Log Incident", blue outline "Save as Draft")
  - Full accessibility compliance with ARIA labels and keyboard navigation

## Recent Major Updates (June 2025)

### Group Chat UI/UX & Logic Overhaul (June 26, 2025)
- **Resolved persistent syntax error** in `EventMessagesPanel.tsx` ("Unexpected token `div`")
- **Comprehensive UI/UX and Supabase logic improvements for the Messages tab:**
  - Sidebar: sticky event header, always-visible icons, group separation, scrollable, active state styling
  - Chat header: group icon, subtitle, "View Members" button with badge, avatars, tooltips
  - Message area: empty state, avatars, role-colored names, timestamps, bubble styles, pinned messages, action icons, date separators, read receipts
  - Input bar: dynamic placeholder, attachment icon, send button, focus/active states, (optionally) @mentions and keyboard shortcuts
  - General: dashboard-style UI, dark mode, responsive sidebar, ARIA labels, keyboard accessibility
  - Supabase: real-time updates, group creation, member assignment
  - **Toast notifications**: new message toasts with click-to-jump (scrolls to and highlights relevant message)
  - Polish: hover/active states, empty group state, mobile navigation, notification click-to-jump
- **Laid groundwork for further refinements** (per detailed user feedback)

### Development Tracking & Business Intelligence (Latest)
- **Development Cost Tracking**: Comprehensive system for tracking development hours and AI usage costs
  - Super admin dashboard with ROI projections and break-even analysis
  - Automatic cost calculation (£40/hour development, AI usage tracking)
  - Subscription revenue modeling (£25/month per subscriber)
  - Real-time investment tracking with profitability timeline
- **EventPricingCalculator**: Interactive pricing component for subscription modeling
- **Business Metrics**: Complete development lifecycle tracking with cost transparency

### Staff Management & Callsign Assignment Overhaul
- **Modern Callsign Interface**: Complete redesign with card-based layout
  - Color-coded department cards (Management=Purple, Security=Blue, etc.)
  - Visual status indicators (green checkmarks, orange warnings)
  - Staff avatars with initials and skill badges (SIA, First Aid, etc.)
  - Responsive grid layout (1-8 columns based on screen size)
- **Enhanced Staff Management**: 
  - Company-isolated staff data with proper Supabase integration
  - Real-time staff assignment with dropdown menus
  - Available staff display with hover tooltips for skills
  - Drag & drop assignment capabilities
- **Department Management**: Full CRUD operations for departments
  - Custom department creation with color selection (9 muted color options)
  - Edit/delete functionality with confirmation dialogs
  - Dynamic category management system

### Dashboard & UI Improvements
- **Fixed Dashboard Layout**: Resolved TopIncidentTypesCard compilation errors
- **Separated Card Components**: What3Words and Top 3 Incident Types now properly separated
- **Company Footer**: Dynamic company name display from user profiles
- **Navigation Cleanup**: Removed redundant "Staff Management" from sidebar
- **Responsive Design**: Enhanced mobile layout with proper card spacing

### Technical Infrastructure
- **Database Schema Enhancements**: 
  - New `dev_sessions` and `ai_usage` tables for cost tracking
  - Improved `staff` table with company isolation
  - Enhanced audit logging capabilities
- **API Route Expansion**:
  - `/api/seed-dev-data` - Development data seeding
  - `/api/seed-subscription-data` - Subscription data management
  - `/api/setup-dev-tables` - Database table creation
  - `/api/setup-subscription-table` - Subscription infrastructure
- **Server-Side Improvements**: Fixed AI insights API with proper Supabase client configuration

### Notification System Overhaul
- **Smart Toast System**: Eliminated duplicate notifications with intelligent deduplication
- **Notification Drawer**: Complete activity feed with AI insights and real-time updates
- **Persistent Tracking**: localStorage-based read notification management
- **Enhanced UX**: Proper positioning, animations, and user feedback

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Authentication)
- **AI Integration**: OpenAI GPT-4o-mini, Perplexity AI
- **Deployment**: Vercel with automatic GitHub integration
- **External APIs**: Weather, Geocoding, What3Words integration

## AI Architecture

- OpenAI primary (server). If unavailable, server responds with `fallback: 'browser-recommended'` and the client performs WebLLM parsing. WebLLM is not initialized on the server.

Additional details:
- OpenAI is the primary AI provider for server-side parsing. If the server cannot use OpenAI (e.g., missing key or outage), the endpoint responds with a fallback signal and minimal heuristics.
- When this occurs, the server includes `fallback: 'browser-recommended'` in the JSON. The client then initializes WebLLM and performs parsing locally in the browser.
- WebLLM is a browser-only runtime and is intentionally not initialized on the server.

## Setup

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Environment Variables**
   - Copy `.env.example` to `.env.local` and configure:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_api_key
   NEXT_PUBLIC_WHAT3WORDS_API_KEY=your_what3words_api_key
   # Optional: configure the browser LLM model used by WebLLM (defaults to a small, browser-friendly model)
   NEXT_PUBLIC_WEBLLM_MODEL_ID=Llama-3.2-3B-Instruct-q4f32_1-MLC
   ```

   - Optional: Local LLM (Ollama) configuration if you want server-side fallback to a local model
     ```
     OLLAMA_BASE_URL=http://localhost:11434
     OLLAMA_MODEL_DEFAULT=llama3.2
     OLLAMA_MODEL_DEBRIEF=llama3.2
     OLLAMA_MODEL_SENTIMENT=llama3.2
     # OLLAMA_API_KEY=  # only if using a remote Ollama server requiring auth
     ```

3. **Run the development server**
   ```sh
   npm run dev
   ```

4. **Build for production**
   ```sh
   npm run build
   ```

## Key Components

- **Dashboard**: Main event overview with real-time updates
- **Incidents**: Comprehensive incident management with filtering and search
- **Analytics**: AI-powered event analysis and reporting
- **Notifications**: Real-time notification system with drawer interface
- **AI Chat**: Intelligent assistant for event management support

## Customization

- Dashboard cards and analytics components: `src/components/` and `src/app/analytics/page.tsx`
- Notification system: `src/components/NotificationDrawer.tsx` and `src/contexts/NotificationContext.tsx`
- AI features: `src/components/AIChat.tsx` and related API endpoints
- Styling: Tailwind CSS configuration in `tailwind.config.js`

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes. Follow the existing code style and include tests for new features.

## License

MIT 
