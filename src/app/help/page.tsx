import React from 'react';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-10">
        <header className="mb-10 border-b pb-6">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center">
            <span className="material-icons text-blue-600 mr-3 text-5xl">help_outline</span>
            Help &amp; Glossary
          </h1>
        </header>
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-700 mb-6 flex items-center">
            <span className="material-icons text-blue-500 mr-2">info</span>
            About This App
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            InCommand Event Control is a comprehensive platform designed to help event staff and security teams manage incidents, monitor venue occupancy, and generate detailed reports and analytics. The app streamlines the process of incident reporting, data collection, and analysis, ensuring a safer and more organized event experience.
          </p>
          <ul className="list-none space-y-3 pl-0 mb-6">
            <li className="flex items-start">
              <span className="material-icons text-green-500 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg">Report and track incidents in real time</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg">Monitor venue occupancy and safety metrics</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg">Generate and export detailed reports</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg">Access analytics for data-driven decision making</span>
            </li>
            <li className="flex items-start">
              <span className="material-icons text-green-500 mr-3 mt-1">check_circle_outline</span>
              <span className="text-lg">Secure authentication and user management</span>
            </li>
          </ul>
          <p className="text-lg leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-200">
            For further assistance, please contact your system administrator or refer to the documentation provided by your organization.
          </p>
        </section>
        <section>
          <h2 className="text-3xl font-semibold text-gray-700 mb-8 flex items-center">
            <span className="material-icons text-blue-500 mr-2">menu_book</span>
            Glossary of Terms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Incident</h3>
              <p className="text-gray-600 leading-relaxed">An event or occurrence that requires reporting or action, such as an ejection, medical issue, or security concern.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Ejection</h3>
              <p className="text-gray-600 leading-relaxed">The act of removing a person from the venue due to rule violations or safety concerns.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Venue Occupancy</h3>
              <p className="text-gray-600 leading-relaxed">The number of people currently present in the venue, tracked for safety and compliance.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">The main interface where users can view analytics, reports, and current event status.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Report</h3>
              <p className="text-gray-600 leading-relaxed">A summary or detailed account of incidents, analytics, or other relevant data.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Analytics</h3>
              <p className="text-gray-600 leading-relaxed">Statistical and visual representations of incidents, trends, and other key metrics.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Supabase</h3>
              <p className="text-gray-600 leading-relaxed">The backend service used for authentication, database, and API management in this app.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Signature</h3>
              <p className="text-gray-600 leading-relaxed">A digital signature collected for verification or authorization purposes.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Weather Card</h3>
              <p className="text-gray-600 leading-relaxed">A component displaying current weather information relevant to the event or venue.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Incident Table</h3>
              <p className="text-gray-600 leading-relaxed">A table listing all reported incidents with details and status.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Incident Creation Modal</h3>
              <p className="text-gray-600 leading-relaxed">A popup form for reporting new incidents.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Event Creation Modal</h3>
              <p className="text-gray-600 leading-relaxed">A popup form for creating new events in the system.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Settings</h3>
              <p className="text-gray-600 leading-relaxed">A section where users can configure their preferences and account details.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Authentication</h3>
              <p className="text-gray-600 leading-relaxed">The process of verifying user identity to access the app.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">API</h3>
              <p className="text-gray-600 leading-relaxed">Application Programming Interface, used for communication between the frontend and backend.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpPage; 