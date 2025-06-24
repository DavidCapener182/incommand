# WeatherCard Component Logic

## Purpose
Displays current weather information for a given location, including temperature, description, wind, and forecast. Hidden on mobile view.

## Props
- `lat` (number): Latitude of the location
- `lon` (number): Longitude of the location
- `locationName` (string): Name/address of the location
- `eventDate` (string): Date of the event
- `startTime` (string): Event start time
- `curfewTime` (string): Event curfew time

## Behavior
- Fetches current weather and hourly forecast using the provided coordinates and event times.
- Refreshes weather data every 5 minutes.
- Renders a loading state, error state, or weather details.
- On mobile (`md:hidden`), the card is hidden entirely.
- On desktop, shows icon, temperature, description, location, and wind info.

## Data Sources
- `/api/weather` for current weather
- `/api/hourly-forecast` for forecast

## UI
- Uses Heroicons for weather icons
- Responsive: hidden on mobile, full details on desktop

---

## Recent Improvements (June 2024)
- WeatherCard is now hidden on mobile for a cleaner dashboard layout.
- Dashboard card layout is optimized for both mobile and desktop. 