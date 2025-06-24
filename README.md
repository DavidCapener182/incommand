# inCommand (Compact Event Control)

## Overview.

inCommand is an event control dashboard built with Next.js and Supabase. It features multi-tenancy, user profiles, event/incident management, role-based permissions, and a modern, responsive UI.

## Key Features
- **Multi-Tenancy**: Company isolation for users and events.
- **Event & Incident Management**: Create, view, and manage events and incidents with role-based permissions.
- **Photo Attachments**: Upload and preview incident photos (with audit logging).
- **User Profiles**: Display user roles and profile information.
- **Analytics Dashboard**: A dedicated page for event analytics, including:
    - **AI-Powered Debrief Summary**: Automatically generates a comprehensive debrief report, including an event overview, attendance analysis, a table of significant incidents, and key learning points.
    - **Incident Heatmap**: Visualizes incident locations to identify hotspots.
    - **Performance Metrics**: Tracks key performance indicators for the event.
    - **Predictive Insights**: Offers AI-based predictions for future incidents.
- **Dashboard Cards**:
  - **Venue Occupancy**: Live stats and progress bar. Card is now clickable to open a detailed modal.
  - **Weather Card**: Current weather and forecast for the venue location. Hidden on mobile for a cleaner layout.
  - **What3Words Map Card**: Clickable card with What3Words logo (now larger on mobile). Opens a fullscreen modal map for the venue or searched location.
- **Responsive Navigation**: The navigation bar collapses into a hamburger menu on smaller screens (tablets and mobile devices) to ensure a clean layout.
- **Live Map Modal**: Click the What3Words card to open a fullscreen map modal.
- **Incident Creation Modal**: Incident type buttons are sorted by usage (per device/browser), and the grid always maintains its shape. Quick actions and context-aware logic are improved. Attendance quick input is pre-filled. Form resets fully on close.
- **Incident Log Table**: Type column is always centered on mobile, and occurrence/action columns are truncated on desktop to keep the status column visible. Fully responsive and visually consistent.

## Recent Improvements (June 2024)
- Usage-based incident type sorting in the Incident Creation Modal
- Responsive dashboard/card layout for mobile and desktop
- WeatherCard hidden on mobile, What3Words and Venue Occupancy cards optimized for mobile
- Venue Occupancy card opens modal on click
- Log table truncation and type/status alignment improvements
- General UI/UX and accessibility enhancements

## Setup

1. **Install dependencies**
   ```sh
   npm install
   ```
2. **Environment Variables**
   - Copy `.env.example` to `.env.local` and fill in your Supabase, OpenAI, and other API keys.
   - You will need `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY`.
3. **Run the app**
   ```sh
   npm run dev
   ```

## Customization
- The dashboard cards and analytics components can be adjusted in `src/components/` and `src/app/analytics/page.tsx`.

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

## License
MIT 
