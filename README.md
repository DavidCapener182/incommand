# inCommand (Compact Event Control)

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

### Notification System Overhaul
- **Smart Toast System**: Eliminated duplicate notifications with intelligent deduplication
- **Notification Drawer**: Complete activity feed with AI insights and real-time updates
- **Persistent Tracking**: localStorage-based read notification management
- **Enhanced UX**: Proper positioning, animations, and user feedback

### AI Integration Expansion
- **OpenAI-Powered Summaries**: Comprehensive event analysis using GPT-4o-mini
- **Intelligent Chat Assistant**: Context-aware AI support with conversation history
- **Dynamic Insights**: Auto-rotating AI insights with manual navigation controls
- **Attendance Intelligence**: AI analysis of venue capacity patterns and peak times

### UI/UX Improvements
- **Floating Action Buttons**: Context-aware visibility management
- **Enhanced Typography**: Bold text formatting and improved readability
- **Responsive Design**: Mobile-first approach with optimized layouts
- **Visual Consistency**: Unified design language across all components
- **Polished Login Page**: Modern, accessible login page with improved CTA flow, restored solid blue background, and mobile-friendly design
- **Accessibility & Mobile Enhancements**: Improved keyboard navigation, focus states, and touch targets across all major screens

### Performance & Reliability
- **Build Stability**: Resolved persistent webpack and module loading issues
- **API Optimization**: Improved error handling and response times
- **Real-time Reliability**: Enhanced subscription management and connection stability
- **Production Deployment**: Automated Vercel deployment with proper CI/CD

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
