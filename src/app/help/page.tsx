import React from 'react';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl p-6 md:p-10 border border-gray-200 dark:border-[#2d437a]">
        <header className="mb-10 border-b border-gray-200 dark:border-[#2d437a] pb-6">
          <div className="flex items-center gap-3">
            <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Help &amp; Glossary</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Quick answers, definitions, and how-to guidance</p>
            </div>
          </div>
        </header>
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
            <span className="material-icons text-blue-600 dark:text-blue-300">info</span>
            About This App
          </h2>
          <p className="text-lg leading-relaxed mb-4 text-gray-800 dark:text-gray-100">
            InCommand Event Control is a comprehensive platform designed to help event staff and security teams manage incidents, monitor venue occupancy, and generate detailed reports and analytics. The app streamlines the process of incident reporting, data collection, and analysis, ensuring a safer and more organized event experience.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 mb-6">
            <li className="flex items-start">
              <span className="material-icons text-green-500 dark:text-green-400 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg text-gray-800 dark:text-gray-100">Report and track incidents in real time</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 dark:text-green-400 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg text-gray-800 dark:text-gray-100">Monitor venue occupancy and safety metrics</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 dark:text-green-400 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg text-gray-800 dark:text-gray-100">Generate and export detailed reports</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 dark:text-green-400 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg text-gray-800 dark:text-gray-100">Access analytics for data-driven decision making</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 dark:text-green-400 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg text-gray-800 dark:text-gray-100">Secure authentication and user management</span>
            </li>
          </ul>
          <p className="text-base leading-relaxed bg-blue-50 dark:bg-[#1a2a57] dark:text-blue-100 p-4 rounded-xl border border-blue-200 dark:border-[#2d437a]">
            For further assistance, please contact your system administrator or refer to the documentation provided by your organization.
          </p>
        </section>
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
            <span className="material-icons text-blue-600 dark:text-blue-300">menu_book</span>
            Glossary of Terms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {glossaryItems.map(({ title, description, icon }, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#2d437a] text-gray-900 dark:text-gray-100 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-[#3451a1]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-icons text-blue-700 dark:text-blue-300`}>{icon}</span>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-200 mb-0">{title}</h3>
                </div>
                <p className="text-gray-600 dark:text-blue-100 leading-relaxed text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const glossaryItems = [
  { title: 'Incident', icon: 'report_problem', description: 'An event or occurrence that requires reporting or action, such as an ejection, medical issue, or security concern.' },
  { title: 'Ejection', icon: 'logout', description: 'The act of removing a person from the venue due to rule violations or safety concerns.' },
  { title: 'Venue Occupancy', icon: 'people', description: 'The number of people currently present in the venue, tracked for safety and compliance.' },
  { title: 'Dashboard', icon: 'dashboard', description: 'The main interface where users can view analytics, reports, and current event status.' },
  { title: 'Report', icon: 'description', description: 'A summary or detailed account of incidents, analytics, or other relevant data.' },
  { title: 'Analytics', icon: 'analytics', description: 'Statistical and visual representations of incidents, trends, and other key metrics.' },
  { title: 'Supabase', icon: 'cloud', description: 'The backend service used for authentication, database, and API management in this app.' },
  { title: 'Signature', icon: 'edit', description: 'A digital signature collected for verification or authorization purposes.' },
  { title: 'Weather Card', icon: 'wb_sunny', description: 'A component displaying current weather information relevant to the event or venue.' },
  { title: 'Incident Table', icon: 'table_chart', description: 'A table listing all reported incidents with details and status.' },
  { title: 'Incident Creation Modal', icon: 'add_alert', description: 'A popup form for reporting new incidents.' },
  { title: 'Event Creation Modal', icon: 'event', description: 'A popup form for creating new events in the system.' },
  { title: 'Settings', icon: 'settings', description: 'A section where users can configure their preferences and account details.' },
  { title: 'Authentication', icon: 'lock', description: 'The process of verifying user identity to access the app.' },
  { title: 'API', icon: 'api', description: 'Application Programming Interface, used for communication between the frontend and backend.' },
];

export default HelpPage; 