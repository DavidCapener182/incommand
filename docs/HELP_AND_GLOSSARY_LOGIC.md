# Help & Glossary Logic

## Purpose
Provides users with guidance, definitions, and explanations for app features and terminology.

## Key Features
- Help page: Describes app sections, workflows, and common actions
- Glossary: Defines key terms (e.g., incident, report, analytics, callsign)
- Recent Improvements: Summarizes the latest UI/UX and logic changes

## UI
- Static content, styled cards/sections
- Linked from navigation or footer

---

## Recent Improvements (June 2024)

- **Usage-Based Incident Type Sorting:**
  - Incident type buttons in the Incident Creation Modal are now sorted by how often you use them (per device/browser). Most-used types appear at the top left for faster access.
- **Responsive Card Layouts:**
  - On mobile, the WeatherCard is hidden and the Venue Occupancy and What3Words cards fill the row, each taking up half the width and half the height for a compact view.
  - On desktop, all three cards are shown in a 3-column layout.
- **Venue Occupancy Modal:**
  - Clicking the Venue Occupancy card (on any device) opens a detailed modal with attendance timeline and stats.
  - The venue icon is hidden on mobile for a cleaner look.
- **What3Words Card:**
  - The What3Words logo is now larger and fills the card for better visibility on mobile.
- **Incident Log Table Improvements:**
  - On mobile, the "Type" column is always centered, even for multi-line types (e.g., "Missing Child/Person").
  - On desktop, the Occurrence and Action columns are truncated with ellipsis if too long, so the Status column is always visible. Full text is available on hover.
- **General UI/UX:**
  - All cards and tables are fully responsive and optimized for both mobile and desktop use.
  - Quick actions and context-aware logic are improved for incident creation and management.

---

## Glossary (Updated)

- **Incident Type Sorting:** The order of incident type buttons adapts to your usage, making frequent actions faster.
- **Venue Occupancy Modal:** A popup showing real-time and historical attendance data, accessible by clicking the Venue Occupancy card.
- **What3Words:** A geolocation system using three-word addresses. The logo is now more prominent in the dashboard.
- **Truncation:** Long text in tables is shortened with an ellipsis (...) to keep layouts clean; hover to see the full text.
- **Quick Actions:** Contextual buttons for common actions, shown or hidden based on the selected incident type.
- **Responsive Design:** The app adapts layouts and visibility of elements for optimal use on both mobile and desktop devices. 