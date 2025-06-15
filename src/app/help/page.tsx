import React from 'react';

const glossary = [
  { term: 'Incident', definition: 'An event or occurrence that requires reporting or action, such as an ejection, medical issue, or security concern.' },
  { term: 'Ejection', definition: 'The act of removing a person from the venue due to rule violations or safety concerns.' },
  { term: 'Venue Occupancy', definition: 'The number of people currently present in the venue, tracked for safety and compliance.' },
  { term: 'Dashboard', definition: 'The main interface where users can view analytics, reports, and current event status.' },
  { term: 'Report', definition: 'A summary or detailed account of incidents, analytics, or other relevant data.' },
  { term: 'Analytics', definition: 'Statistical and visual representations of incidents, trends, and other key metrics.' },
  { term: 'Supabase', definition: 'The backend service used for authentication, database, and API management in this app.' },
  { term: 'Signature', definition: 'A digital signature collected for verification or authorization purposes.' },
  { term: 'Weather Card', definition: 'A component displaying current weather information relevant to the event or venue.' },
  { term: 'Incident Table', definition: 'A table listing all reported incidents with details and status.' },
  { term: 'Incident Creation Modal', definition: 'A popup form for reporting new incidents.' },
  { term: 'Event Creation Modal', definition: 'A popup form for creating new events in the system.' },
  { term: 'Settings', definition: 'A section where users can configure their preferences and account details.' },
  { term: 'Authentication', definition: 'The process of verifying user identity to access the app.' },
  { term: 'API', definition: 'Application Programming Interface, used for communication between the frontend and backend.' },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Help & Glossary</h1>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">About This App</h2>
        <p className="mb-4">
          <strong>Compact Event Control</strong> is a comprehensive platform designed to help event staff and security teams manage incidents, monitor venue occupancy, and generate detailed reports and analytics. The app streamlines the process of incident reporting, data collection, and analysis, ensuring a safer and more organized event experience.
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Report and track incidents in real time</li>
          <li>Monitor venue occupancy and safety metrics</li>
          <li>Generate and export detailed reports</li>
          <li>Access analytics for data-driven decision making</li>
          <li>Secure authentication and user management</li>
        </ul>
        <p>
          For further assistance, please contact your system administrator or refer to the documentation provided by your organization.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-2">Glossary of Terms</h2>
        <div className="bg-white rounded shadow p-4">
          <dl>
            {glossary.map(({ term, definition }) => (
              <div key={term} className="mb-4">
                <dt className="font-bold text-lg">{term}</dt>
                <dd className="ml-4 text-gray-700">{definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
} 