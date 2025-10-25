# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Step 7 - Build & Dependency Hygiene**: Comprehensive dependency cleanup and build optimization
  - Removed 543 unused packages from node_modules
  - Fixed 4 security vulnerabilities (3 moderate, 1 critical)
  - Enhanced build scripts for production, development, and CI/CD
  - Implemented automated dependency validation and monitoring
  - Created optimized Docker multi-stage builds
  - Added comprehensive build analysis and health check scripts
- Created `CHANGELOG.md` to track project changes.
- ProfileCard popup now appears as a dropdown below the profile photo, at full size, and always fully inside the screen.
- **Dashboard Enhancements**: Added "Last Updated" timestamp above incident table for real-time awareness
- **Venue Occupancy Critical State**: Implemented pulse animation and red border styling when capacity reaches 100%
- **Responsive KPI Grid**: Enhanced dashboard responsiveness with progressive grid layout (2→4→6→8 columns)
- **Incident Creation Modal Redesign**: Complete UI/UX overhaul with three-column responsive layout
- **Quick Add Bar**: Moved to full-width top section for better visibility and accessibility
- **Incident Type Chips**: Color-coded categories with search functionality and independent scrolling
- **Enhanced Form Components**: Styled selects with custom chevrons, improved textareas with light backgrounds
- **Sticky Footer Actions**: Red "Log Incident" button with icon, blue outline "Save as Draft", gray "Cancel"

### Changed
- **Dashboard Layout**: Reduced KPI card padding for better space utilization
- **Floating Button**: Fixed visibility when incident modal is open
- **Visual Hierarchy**: Replaced pastel panels with neutral cards and subtle left accents
- **Button Styling**: Updated all action buttons with modern design and proper contrast
- **Mobile Responsiveness**: Improved layout across all screen sizes with logical stacking

### Fixed
- **Independent Scrolling**: Incident type list now scrolls independently without affecting other form fields
- **Accessibility**: Added proper ARIA labels, keyboard navigation, and WCAG AA contrast compliance
- **TypeScript Safety**: Enhanced type safety across all components
- **Component Organization**: Better structure and maintainability

## [0.1.0] - 2024-07-29

### Added
- **Analytics Dashboard**: Introduced a new page at `/analytics` to provide deep insights into event data.
- **AI-Powered Debrief Summary**: Integrated with OpenAI to automatically generate detailed event debriefs, including an event overview, attendance analysis, a table of significant incidents, and actionable learning points.
- **Event Log Management**: Added functionality to the settings page for `admin` and `superadmin` users to view and delete individual logs for the current event.
- **Responsive Navigation**: The main navigation bar now collapses into a hamburger menu on tablet and mobile screen sizes to improve user experience on smaller devices.

### Changed
- Updated the `README.md` to reflect the latest features and setup instructions.

### Fixed
- Resolved numerous bugs related to API data fetching, including environment variable loading and incorrect request parameters.
- Corrected rendering issues on the analytics page, ensuring the debrief summary displays as a structured HTML report.
- Fixed layout issues with the navigation bar and various dashboard components. 