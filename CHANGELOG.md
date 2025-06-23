# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created `CHANGELOG.md` to track project changes.

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