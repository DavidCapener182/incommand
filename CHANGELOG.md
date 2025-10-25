# Changelog

All notable changes to this project will be documented in this file.  
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
### Added
- **Suggestions Box:** Added interactive feedback form on `/updates` page for feature requests and improvements.
- **Security Enhancement:** Hidden incident creation FAB on marketing pages to prevent unauthorized access.
- Placeholder for upcoming improvements and refinements.

---

## [1.0.0-beta.1] – 2025-10-25

### Added
- **Performance Optimisation:** Major build and dependency cleanup improving load times and reliability.
- **Accessibility & SEO Enhancements:** Full WCAG 2.1 AA compliance, improved screen reader support, ARIA landmarks, and complete SEO metadata (OpenGraph, Twitter Cards, sitemap, robots.txt).
- **Public Updates Page:** Introduced `/updates` page to showcase all platform improvements.
- **Dashboard Improvements:**
  - Added “Last Updated” timestamp above incident tables for better situational awareness.
  - New responsive KPI grid (2 → 4 → 6 → 8 columns).
  - Venue occupancy critical state with animated pulse and red border at 100 % capacity.
- **Incident Creation Experience:**
  - Completely redesigned three-column responsive modal layout.
  - Improved “Quick Add” bar with full-width top placement for better accessibility.
  - Added colour-coded incident type chips with search and independent scrolling.
  - Enhanced form components with refined selects, chevrons, and lighter text areas.
  - New sticky footer actions — **Log Incident**, **Save as Draft**, **Cancel**.
- **ProfileCard Popup:** Updated to appear as a dropdown beneath the profile image, always fully visible.
- **General Enhancements:** Added comprehensive build analysis, improved CI/CD scripts, and optimised Docker builds.

### Changed
- **Dashboard Layout:** Reduced KPI card padding and refined visual hierarchy for improved readability.
- **Button Styling:** Updated all action buttons for higher contrast and accessibility compliance.
- **Mobile Responsiveness:** Improved grid stacking and alignment across all screen sizes.
- **Visual Design:** Replaced pastel panels with neutral cards and subtle accent bars.
- **Security & Reliability:** Updated to latest secure Next.js version (v14.2.33) and optimised production build.

### Fixed
- **Independent Scrolling:** Incident type lists now scroll independently without affecting other inputs.
- **Accessibility:** Added complete ARIA labelling, keyboard navigation, and improved focus states.
- **TypeScript Safety:** Strengthened type definitions for improved stability.
- **Component Organisation:** Refactored for clarity and maintainability.
- **Build Process:** Resolved dependency issues, optimised separation between development and production packages.

---

## [0.1.0] – 2025-04-10

### Added
- **Analytics Dashboard:** New `/analytics` page providing detailed event insights.
- **AI-Powered Debrief Summary:** Automatically generates structured event reports using OpenAI.
- **Event Log Management:** Tools for admin and superadmin roles to review or delete event logs.
- **Responsive Navigation:** Collapsible hamburger menu for tablet and mobile users.

### Changed
- Updated `README.md` with latest setup and feature documentation.

### Fixed
- Resolved API data-fetching and environment variable issues.
- Corrected layout bugs on analytics and dashboard pages.
- Fixed navigation rendering across all screen sizes.