# inCommand (Compact Event Control)

## Overview

inCommand is an event control dashboard built with Next.js and Supabase. It features multi-tenancy, user profiles, event/incident management, role-based permissions, and a modern, responsive UI.

## Key Features
- **Multi-Tenancy**: Company isolation for users and events.
- **Event & Incident Management**: Create, view, and manage events and incidents with role-based permissions.
- **Photo Attachments**: Upload and preview incident photos (with audit logging).
- **User Profiles**: Display user roles and profile information.
- **Dashboard Cards**:
  - **Venue Occupancy**: Live stats and progress bar.
  - **Weather Card**: Current weather and forecast for the venue location.
  - **What3Words Map Card**: Clickable card with What3Words logo. Opens a fullscreen modal map for the venue or searched location. API key required (see below).
  - **Placeholder Card**: Reserved for future features, styled to match the dashboard.
- **Live Map Modal**: Click the What3Words card to open a fullscreen map modal. Close button is positioned to avoid overlapping the profile picture or menu.
- **Responsive Layout**: Cards are aligned in a 4-card row, matching heights and spacing.

## Setup

1. **Install dependencies**
   ```sh
   npm install
   ```
2. **Environment Variables**
   - Copy `.env.example` to `.env.local` and fill in your Supabase and API keys.
   - Add your What3Words API key:
     ```
     WHAT3WORDS_API_KEY=your_w3w_key_here
     ```
3. **Run the app**
   ```sh
   npm run dev
   ```

## What3Words Integration
- The What3Words card uses the official SDK and API key (server-side only).
- Clicking the card opens a fullscreen modal with the What3Words map for the venue or searched location.
- The close button is outside the modal box for better UX.

## Customization
- The placeholder card can be replaced with any future feature or integration.
- Card layout and styling can be adjusted in `src/components/Dashboard.tsx`.

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

## License
MIT 