# Dashboard Feature Documentation

## Overview
The Dashboard is the central command center of inCommand, providing real-time event monitoring, incident tracking, and comprehensive event management capabilities. It serves as the primary interface for event control rooms and security teams.

## Core Features

### 1. Real-Time Event Overview
- **Current Event Display**: Shows active event details including name, venue, date, and type
- **Live Statistics**: Real-time counters for total incidents, open incidents, high-priority incidents, and closed incidents
- **Status Indicators**: Visual indicators with color-coded status and pulse animations for urgent updates
- **Event Timeline**: Current time display with countdown to next event milestone

### 2. Incident Management Integration
- **Quick Incident Creation**: One-click incident logging with pre-filled incident types
- **Incident Statistics**: Live updating counters with trend indicators
- **Priority-Based Filtering**: Filter incidents by type, status, or priority level
- **Real-Time Updates**: Automatic refresh of incident data via Supabase subscriptions

### 3. Interactive Dashboard Cards

#### Time & Schedule Card
- **Current Time Display**: Live clock with current time
- **Event Schedule**: Shows all event timings (doors open, support acts, main act)
- **Countdown Timer**: Time remaining until next scheduled event
- **Happening Now**: Real-time indicator of current event phase
- **Next Event Highlight**: Visual emphasis on upcoming milestones

#### Statistics Cards
- **Total Incidents**: Overall incident count with trend indicators
- **Open Incidents**: Active incidents requiring attention
- **High Priority**: Critical incidents needing immediate response
- **Closed Incidents**: Resolved incidents with completion rates
- **Clickable Filtering**: Click any stat card to filter incident table

#### Venue Occupancy Card
- **Live Attendance**: Current venue occupancy numbers
- **Capacity Percentage**: Visual progress bar showing venue fill level
- **Attendance Trends**: Historical attendance tracking
- **Modal Details**: Click to view detailed attendance analytics

#### Weather Information
- **Current Conditions**: Live weather data for venue location
- **Temperature & Conditions**: Real-time weather status
- **Forecast Integration**: Weather predictions for event planning
- **Location-Based**: Automatically pulls weather for event venue

#### What3Words Integration
- **Precise Location**: What3Words address for exact venue location
- **Interactive Map**: Click to open full-screen map view
- **Emergency Response**: Quick location sharing for emergency services
- **Mobile Optimized**: Enhanced mobile layout for field teams

#### Top Incident Types
- **Real-Time Analysis**: Live tracking of most common incident types
- **Visual Indicators**: Color-coded incident type badges
- **Quick Filtering**: Click incident type to filter main incident table
- **Trend Analysis**: Shows top 3 incident categories with counts

### 4. Advanced UI Features

#### Dark Mode Support
- **Automatic Theme Detection**: Respects system theme preferences
- **Manual Toggle**: User-controlled theme switching
- **Consistent Styling**: Maintains readability across all components
- **Professional Appearance**: Dark theme optimized for control room environments

#### Responsive Design
- **Mobile Optimization**: Fully responsive for tablets and smartphones
- **Desktop Layout**: Optimized for large screens and multiple monitors
- **Touch-Friendly**: Large touch targets for mobile devices
- **Adaptive Grid**: Dynamic layout adjustment based on screen size

#### Real-Time Notifications
- **Toast Notifications**: Non-intrusive incident alerts
- **Priority-Based Timing**: Extended display time for high-priority incidents
- **Deduplication**: Prevents duplicate notifications
- **Sound Alerts**: Optional audio notifications for critical incidents

### 5. Event Management

#### Event Creation
- **Quick Setup**: Streamlined event creation process
- **Template Support**: Pre-configured event templates
- **Venue Integration**: Automatic address and coordinate lookup
- **Schedule Management**: Support for multiple acts and timings

#### Multi-Tenancy
- **Company Isolation**: Complete data separation between organizations
- **User Permissions**: Role-based access control
- **Secure Data**: Company-specific data access only

### 6. Navigation & Controls

#### Floating Action Buttons
- **Quick Incident Creation**: Fast access to incident logging
- **Event Management**: Direct access to event controls
- **AI Chat**: Instant access to AI assistant
- **Responsive Positioning**: Adapts to screen size and orientation

#### Sidebar Navigation
- **Collapsible Menu**: Space-efficient navigation
- **Quick Access**: Direct links to all major features
- **Role-Based Items**: Menu items based on user permissions
- **Visual Indicators**: Active page highlighting

### 7. Performance Features

#### Real-Time Data
- **Supabase Subscriptions**: Live data updates without page refresh
- **Efficient Querying**: Optimized database queries for fast loading
- **Connection Management**: Automatic reconnection handling
- **Memory Optimization**: Efficient memory usage for long-running sessions

#### Caching & Optimization
- **Local Storage**: Cached user preferences and settings
- **Image Optimization**: Compressed images for faster loading
- **Lazy Loading**: Components load as needed
- **Bundle Splitting**: Optimized JavaScript loading

## Technical Implementation

### State Management
- **React Hooks**: Modern state management with useState and useEffect
- **Context Providers**: Shared state across components
- **Real-Time Updates**: WebSocket connections for live data
- **Error Handling**: Graceful error states and recovery

### Data Integration
- **Supabase Integration**: Real-time database connections
- **API Integration**: External service connections (weather, geocoding)
- **Type Safety**: TypeScript for reliable data handling
- **Validation**: Input validation and sanitization

### Accessibility
- **ARIA Labels**: Screen reader compatibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling for modal dialogs

## User Workflows

### 1. Event Monitoring Workflow
1. View real-time event status on dashboard
2. Monitor incident statistics and trends
3. Respond to high-priority alerts
4. Track event timeline and milestones
5. Coordinate with team through integrated communications

### 2. Incident Response Workflow
1. Receive real-time incident notifications
2. Click incident type to filter relevant incidents
3. Access detailed incident information
4. Create follow-up incidents as needed
5. Monitor resolution status and trends

### 3. Event Setup Workflow
1. Create new event with venue details
2. Configure event schedule and timings
3. Set up staff assignments and callsigns
4. Monitor setup progress through dashboard
5. Transition to live event monitoring

## Integration Points

### External Services
- **Weather APIs**: Real-time weather data
- **Geocoding Services**: Address to coordinate conversion
- **What3Words API**: Precise location services
- **AI Services**: OpenAI integration for insights

### Internal Systems
- **Incident Management**: Direct integration with incident logging
- **Staff Management**: Callsign and assignment tracking
- **Analytics**: Data feeding into analytics dashboard
- **Reporting**: Real-time data for end-of-event reports

## Customization Options

### Dashboard Layout
- **Card Arrangement**: Customizable card positioning
- **Display Preferences**: Show/hide specific dashboard elements
- **Theme Selection**: Light/dark mode preferences
- **Refresh Intervals**: Configurable data update frequencies

### Notification Settings
- **Alert Thresholds**: Customizable priority levels
- **Sound Preferences**: Audio alert configuration
- **Display Duration**: Notification timing preferences
- **Filtering Options**: Selective notification types

## Best Practices

### Performance
- **Regular Cleanup**: Periodic clearing of old subscriptions
- **Efficient Queries**: Use appropriate database indexes
- **Memory Management**: Proper component unmounting
- **Network Optimization**: Minimize unnecessary API calls

### Security
- **Data Validation**: Always validate user inputs
- **Permission Checks**: Verify user access rights
- **Secure Communications**: HTTPS for all API calls
- **Session Management**: Proper authentication handling

### User Experience
- **Consistent Feedback**: Visual confirmation of all actions
- **Error Recovery**: Clear error messages and recovery options
- **Progressive Enhancement**: Graceful degradation for slow connections
- **Accessibility**: Maintain accessibility standards throughout

## Future Enhancements

### Planned Features
- **Custom Dashboard Layouts**: User-configurable card arrangements
- **Advanced Filtering**: More sophisticated incident filtering options
- **Predictive Analytics**: AI-powered incident prediction
- **Integration Expansion**: Additional third-party service integrations

### Performance Improvements
- **Enhanced Caching**: More aggressive caching strategies
- **Offline Support**: Limited offline functionality
- **Real-Time Optimization**: Further real-time performance improvements
- **Mobile App**: Native mobile application development