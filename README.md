# inCommand (Event Control)

## June 2025: Group Chat & Mobile Drawer Overhaul

### Group Chat UI/UX Improvements
- **Sidebar Drawer (Mobile):**
  - Drawer now starts directly below the app bar (inCommand logo) using `top-[64px]` and `h-[calc(100vh-64px)]`.
  - Overlay and drawer never overlap the app bar; always match the visible chat window area.
  - No more top-0 or h-full on mobile drawer/overlay; all offsets are consistent and responsive.
  - Drawer content matches desktop sidebar, including event header, group lists, and add group button.
  - Selecting a group closes the drawer and opens the chat.
- **Overlay:**
  - Semi-transparent overlay covers the app when drawer is open, blocks interaction, and closes drawer on tap.
- **Chat Window & Drawer Polish:**
  - Drawer and overlay always perfectly aligned with chat area.
  - No border radius on top of drawer for true mobile UX.
  - Only one panel visible/interactable at a time on mobile.
- **General Group Chat Enhancements:**
  - Sidebar hierarchy, active state, and quick access improvements.
  - Chat header with member list, tooltips, and improved accessibility.
  - Message window bubble styling, date/time, read receipts, avatars, and mentions dropdown.
  - Input bar accessibility, keyboard shortcuts, and dynamic info tooltips.
  - Toast notifications for new messages, with click-to-jump and deduplication.
  - Responsive design for both desktop and mobile, including floating action button and member modal.

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
- **Venue Occupancy**: Live stats with progress bar and clickable modal for detailed view
- **Weather Card**: Current weather and forecast for venue location (responsive design)
- **What3Words Map Card**: Clickable card opening fullscreen modal map with enhanced mobile layout
- **Current Event Card**: Integrated AI insights with cycling paragraphs and navigation controls
- **Responsive Navigation**: Collapsible hamburger menu for mobile devices

### Enhanced User Experience
- **Incident Creation Modal**: 
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
- **Accessibility**: Improved ARIA labels and keyboard navigation
- **State Management**: Proper context management for notifications and UI states

## Recent Major Updates (June 2025)

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
