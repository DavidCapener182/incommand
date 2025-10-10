import React from 'react';
import { 
  InformationCircleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CloudIcon,
  PencilIcon,
  SunIcon,
  TableCellsIcon,
  PlusIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 pb-24">
      <div className="max-w-6xl mx-auto bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-sm rounded-2xl p-6 md:p-10 border border-gray-200 dark:border-[#2d437a]">
        <header className="mb-10 border-b border-gray-200 dark:border-[#2d437a] pb-6 sticky top-0 bg-white z-10">
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
            <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            About This App
          </h2>
          <p className="text-lg leading-relaxed mb-4 text-gray-800 dark:text-gray-100">
            InCommand Event Control is a comprehensive platform designed to help event staff and security teams manage incidents, monitor venue occupancy, and generate detailed reports and analytics. The app streamlines the process of incident reporting, data collection, and analysis, ensuring a safer and more organized event experience.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 mb-6">
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
              <span className="text-lg text-gray-800 dark:text-gray-100">Report and track incidents in real time</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
              <span className="text-lg text-gray-800 dark:text-gray-100">Monitor venue occupancy and safety metrics</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
              <span className="text-lg text-gray-800 dark:text-gray-100">Generate and export detailed reports</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
              <span className="text-lg text-gray-800 dark:text-gray-100">Access analytics for data-driven decision making</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
              <span className="text-lg text-gray-800 dark:text-gray-100">Secure authentication and user management</span>
            </li>
          </ul>
          <p className="text-base leading-relaxed bg-blue-50 dark:bg-[#1a2a57] dark:text-blue-100 p-4 rounded-xl border border-blue-200 dark:border-[#2d437a]">
            For further assistance, please contact your system administrator or refer to the documentation provided by your organization.
          </p>
        </section>

        {/* Logging Standards Section */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 mb-6 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            Professional Logging Standards
          </h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1a2a57] dark:to-[#1e3a8a] p-6 rounded-xl border border-blue-200 dark:border-[#2d437a] mb-6">
            <div className="flex items-start gap-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  &ldquo;If it ain&apos;t written down, it didn&apos;t happen&rdquo;
                </h3>
                <p className="text-blue-700 dark:text-blue-100">
                  All incident logs are legal documents that may be used in licensing reviews, investigations, or court proceedings. 
                  Following these standards ensures your logs are professional, auditable, and legally defensible.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Structured Template Guide */}
            <div className="bg-white dark:bg-[#2d437a] p-6 rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-green-600" />
                Structured Logging Template
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">📝 Headline (≤15 words)</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">Brief, factual summary</p>
                  <p className="text-xs text-green-600 dark:text-green-400 italic">
                    ✅ &ldquo;Medical incident at north gate - person collapsed&rdquo;<br/>
                    ❌ &ldquo;Terrible medical emergency happened&rdquo;
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📍 Source</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Who or what reported this</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                    ✅ &ldquo;R3, CCTV North Gate, Security Team&rdquo;<br/>
                    ❌ &ldquo;Someone told me&rdquo;
                  </p>
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">👁️ Facts Observed</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">What was actually observed - no opinions</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    ✅ &ldquo;15:03 - Person collapsed near gate. Crowd of ~20 people present&rdquo;<br/>
                    ❌ &ldquo;It was chaotic and scary&rdquo;
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">⚡ Actions Taken</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">What was done and by whom</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                    ✅ &ldquo;R3 called medical at 15:04. Security established crowd control&rdquo;<br/>
                    ❌ &ldquo;We handled it quickly&rdquo;
                  </p>
                </div>
                
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">🎯 Outcome</h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">Current status or final result</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 italic">
                    ✅ &ldquo;Person transported to medical tent. Incident ongoing&rdquo;<br/>
                    ❌ &ldquo;Everything is fine now&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-white dark:bg-[#2d437a] p-6 rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                Best Practices
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ClockIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-blue-100 mb-1">Real-time Logging</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Log incidents as they happen. Use &ldquo;Retrospective&rdquo; only when necessary with clear justification.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <EyeIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-blue-100 mb-1">Factual Language Only</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Avoid opinions, emotions, or speculation. Stick to verifiable facts: who, what, where, when.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <PencilSquareIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-blue-100 mb-1">Amendments, Not Edits</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Original logs are never deleted. Create amendments to correct errors, with clear reasons.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-blue-100 mb-1">Legal Standards</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Logs must be court-ready. Follow JESIP/JDM principles for professional incident management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Language Guidelines */}
          <div className="bg-white dark:bg-[#2d437a] p-6 rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              Language Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                  ✅ Use These
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Specific times: &ldquo;15:03&rdquo;, &ldquo;3:15 PM&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Exact locations: &ldquo;North gate&rdquo;, &ldquo;Stage left&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Measurable quantities: &ldquo;20 people&rdquo;, &ldquo;3 meters&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Direct observations: &ldquo;Person appeared unconscious&rdquo;</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                  ❌ Avoid These
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Emotional language: &ldquo;chaotic&rdquo;, &ldquo;terrible&rdquo;, &ldquo;awful&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Opinions: &ldquo;thankfully&rdquo;, &ldquo;unfortunately&rdquo;, &ldquo;I think&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Vague terms: &ldquo;massive&rdquo;, &ldquo;huge&rdquo;, &ldquo;very big&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Speculation: &ldquo;probably&rdquo;, &ldquo;maybe&rdquo;, &ldquo;seems like&rdquo;</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Compliance Standards */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#451a03] dark:to-[#7c2d12] p-6 rounded-xl border border-amber-200 dark:border-[#92400e]">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
              JESIP & JDM Compliance
            </h3>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              Our logging system aligns with Joint Emergency Services Interoperability Principles (JESIP) and 
              Joint Doctrine Manual (JDM) standards for professional incident management.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white dark:bg-[#92400e] rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">📋 Audit Trail</h4>
                <p className="text-amber-700 dark:text-amber-300">Complete chain of custody with timestamps and authorship</p>
              </div>
              <div className="p-3 bg-white dark:bg-[#92400e] rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">🔒 Immutability</h4>
                <p className="text-amber-700 dark:text-amber-300">Original entries preserved, amendments tracked</p>
              </div>
              <div className="p-3 bg-white dark:bg-[#92400e] rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⚖️ Legal Ready</h4>
                <p className="text-amber-700 dark:text-amber-300">Court-ready documentation for 7-year retention</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            Glossary of Terms
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {glossaryItems.map(({ title, description, icon }, idx) => (
              <div key={idx} className="rounded-xl border p-4 flex flex-col shadow-sm hover:shadow-md transition bg-white dark:bg-[#2d437a] text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  {getIconComponent(icon)}
                  <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-200 mb-0">{title}</h3>
                </div>
                <p className="text-gray-600 dark:text-blue-100 leading-relaxed text-sm line-clamp-3">{description}</p>
                <div className="mt-auto pt-3">
                  <button className="text-blue-600 text-sm hover:underline" aria-label={`Read more about ${title}`}>Read more</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Helper function to get icon component
const getIconComponent = (iconName: string) => {
  const iconClass = "h-5 w-5 text-blue-700 dark:text-blue-300";
  
  switch (iconName) {
    case 'report_problem':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'logout':
      return <ArrowRightOnRectangleIcon className={iconClass} />;
    case 'people':
      return <UsersIcon className={iconClass} />;
    case 'dashboard':
      return <HomeIcon className={iconClass} />;
    case 'description':
      return <DocumentTextIcon className={iconClass} />;
    case 'analytics':
      return <ChartBarIcon className={iconClass} />;
    case 'cloud':
      return <CloudIcon className={iconClass} />;
    case 'edit':
      return <PencilIcon className={iconClass} />;
    case 'wb_sunny':
      return <SunIcon className={iconClass} />;
    case 'table_chart':
      return <TableCellsIcon className={iconClass} />;
    case 'add_alert':
      return <PlusIcon className={iconClass} />;
    case 'event':
      return <CalendarDaysIcon className={iconClass} />;
    case 'settings':
      return <Cog6ToothIcon className={iconClass} />;
    case 'lock':
      return <LockClosedIcon className={iconClass} />;
    case 'api':
      return <CpuChipIcon className={iconClass} />;
    case 'clock':
      return <ClockIcon className={iconClass} />;
    case 'pencil':
      return <PencilSquareIcon className={iconClass} />;
    case 'shield':
      return <ShieldCheckIcon className={iconClass} />;
    case 'eye':
      return <EyeIcon className={iconClass} />;
    default:
      return <InformationCircleIcon className={iconClass} />;
  }
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
  { title: 'Contemporaneous Logging', icon: 'clock', description: 'Logging incidents in real-time as they occur, providing the most accurate and legally defensible records.' },
  { title: 'Retrospective Logging', icon: 'pencil', description: 'Logging incidents after a delay, requiring justification for the timing difference.' },
  { title: 'Amendment', icon: 'edit', description: 'A non-destructive correction to an existing log entry, preserving the original while tracking changes.' },
  { title: 'Audit Trail', icon: 'shield', description: 'Complete record of all changes to log entries, including who made changes and when.' },
  { title: 'JESIP', icon: 'shield', description: 'Joint Emergency Services Interoperability Principles - UK standards for emergency service coordination.' },
  { title: 'JDM', icon: 'shield', description: 'Joint Doctrine Manual - Professional standards for incident management and documentation.' },
  { title: 'Structured Template', icon: 'description', description: 'Professional logging format with specific fields: Headline, Source, Facts, Actions, and Outcome.' },
  { title: 'Factual Language', icon: 'eye', description: 'Objective, verifiable statements without opinions, emotions, or speculation.' },
];

export default HelpPage; 