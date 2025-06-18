# inCommand Event Control Dashboard

A modern event control dashboard for real-time incident management, analytics, and professional reporting. Built with Next.js, Supabase, and OpenAI integration.

## Features

- **Real-time Incident Logging:** Log, track, and manage security and event incidents with live updates.
- **Quick Input for Event Timings:** Instantly log key event timings (e.g., Doors Open, Venue Clear, Staff Briefed) with smart auto-fill.
- **Analytics Dashboard:** Visualize incidents, crowd/occupancy, response times, ejection/refusal patterns, location-based analytics, personnel, compliance, and custom AI insights.
- **End-of-Event Reporting:** Auto-fills key event timings and incident summaries for professional PDF export and compliance.
- **Supabase Integration:** Secure authentication, real-time data, and cloud database.
- **OpenAI Integration:** AI-powered incident summaries and insights.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DavidCapener182/incommand.git
   cd incommand
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   - Copy `.env.example` to `.env.local` and fill in:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
     - `OPENAI_API_KEY`

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Main Pages & Components

- **Dashboard:**
  - Overview of incidents, occupancy, weather, and key stats.
  - Real-time incident table and quick access to analytics and reports.

- **Incident Creation Modal:**
  - Log new incidents with detailed fields.
  - **Quick Input:** Type phrases like "doors open", "venue clear", or "staff briefed and in position" to auto-fill all relevant fields (type, occurrence, action, callsign).

- **Analytics Page:**
  - Visual charts for incidents, crowd flow, response times, and more.
  - AI Insights section cycles through OpenAI-generated summaries.

- **End-of-Event Report:**
  - Auto-fills Head of Security, Event Name, Main Act, and all key timings (Doors Open, Showdown, Venue Clear, Staff Briefed) from incident logs.
  - Summarizes and lists incidents (excluding Sit Rep and Attendance).
  - Upload incident report, sign (type or scribble), and download as PDF.

## Quick Input for Event Timings

- **Supported phrases:**
  - `doors open`, `doors green`, `venue open` → Event Timing: Doors Open, Action: The venue is now open and customers are entering, Callsign: A1
  - `venue clear` → Event Timing: Venue is clear of public, Action: Venue Clear, Callsign: A1
  - `showdown` → Event Timing: Showdown, Action: The show has ended, Callsign: PM
  - `staff briefed`, `staff briefed and in position` → Timings: Staff fully briefed and in position ready for doors, Action: Logged, Callsign: A1

- **How it works:**
  - Enter the phrase in the Quick Input box in the New Incident modal.
  - The form will auto-fill all required fields for that event timing.
  - On submission, the incident is saved and the timing is available for reports.

## End-of-Event Report Auto-Fill

- **Timings:**
  - Extracts times for Doors Open, Showdown, Venue Clear, and Staff Briefed from the relevant incidents (Event Timing or Timings type, matching occurrence).
- **Incidents:**
  - Summarizes and lists all incidents (excluding Sit Rep and Attendance) with time, title, and details.
- **PDF Export:**
  - Download a professional PDF of the report, including signature and uploaded files.

## Contribution

Pull requests and issues are welcome! Please open an issue to discuss major changes first.

## License

MIT License. See [LICENSE](LICENSE) for details. 