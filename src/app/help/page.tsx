import React from 'react';
import Link from 'next/link';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HelpPage = () => {
  const getExpandedContent = (title: string) => {
    const contentMap: { [key: string]: React.ReactNode } = {
      'Incident': (
        <div>
          <p><strong>Definition:</strong> An event or occurrence that requires reporting or action, such as an ejection, medical issue, or security concern.</p>
          <p><strong>Types:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Medical incidents (injuries, health emergencies)</li>
            <li>Security incidents (theft, violence, disturbances)</li>
            <li>Ejection incidents (rule violations, disruptive behavior)</li>
            <li>Equipment failures or safety hazards</li>
            <li>Weather-related incidents</li>
          </ul>
          <p><strong>Reporting Requirements:</strong> All incidents must be logged with accurate timestamps, detailed descriptions, and follow-up actions taken.</p>
        </div>
      ),
      'Ejection': (
        <div>
          <p><strong>Definition:</strong> The act of removing a person from the venue due to rule violations or safety concerns.</p>
          <p><strong>Process:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Document the reason for ejection</li>
            <li>Record the person's details (if available)</li>
            <li>Note any resistance or cooperation</li>
            <li>Log security involvement if required</li>
            <li>Follow up with venue management</li>
          </ul>
          <p><strong>Legal Considerations:</strong> Ensure all ejections are documented thoroughly as they may be subject to legal review.</p>
        </div>
      ),
      'Venue Occupancy': (
        <div>
          <p><strong>Definition:</strong> The number of people currently present in the venue, tracked for safety and compliance.</p>
          <p><strong>Monitoring Methods:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Manual headcounts at key locations</li>
            <li>Ticket scanning data integration</li>
            <li>Security checkpoint monitoring</li>
            <li>Camera-based crowd analysis</li>
          </ul>
          <p><strong>Safety Thresholds:</strong> Track against maximum capacity limits and alert when approaching dangerous levels.</p>
        </div>
      ),
      'Dashboard': (
        <div>
          <p><strong>Definition:</strong> The main interface where users can view analytics, reports, and current event status.</p>
          <p><strong>Key Features:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Real-time incident monitoring</li>
            <li>Weather conditions and forecasts</li>
            <li>Venue occupancy tracking</li>
            <li>Staff assignments and status</li>
            <li>Quick access to reporting tools</li>
          </ul>
          <p><strong>Customization:</strong> Dashboard can be customized based on user role and preferences.</p>
        </div>
      ),
      'Report': (
        <div>
          <p><strong>Definition:</strong> A summary or detailed account of incidents, analytics, or other relevant data.</p>
          <p><strong>Report Types:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Incident reports (individual events)</li>
            <li>Summary reports (event overviews)</li>
            <li>Analytics reports (trends and patterns)</li>
            <li>Compliance reports (regulatory requirements)</li>
            <li>Custom reports (user-defined parameters)</li>
          </ul>
          <p><strong>Export Formats:</strong> PDF, Excel, CSV, and direct database integration available.</p>
        </div>
      ),
      'Analytics': (
        <div>
          <p><strong>Definition:</strong> Statistical and visual representations of incidents, trends, and other key metrics.</p>
          <p><strong>Analytics Features:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Incident trend analysis</li>
            <li>Peak activity identification</li>
            <li>Staff performance metrics</li>
            <li>Venue utilization patterns</li>
            <li>Predictive risk assessment</li>
          </ul>
          <p><strong>Visualization:</strong> Charts, graphs, and heat maps help identify patterns and areas for improvement.</p>
        </div>
      ),
      'Supabase': (
        <div>
          <p><strong>Definition:</strong> The backend service used for authentication, database, and API management in this app.</p>
          <p><strong>Key Features:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>User authentication and authorization</li>
            <li>Real-time database updates</li>
            <li>File storage and management</li>
            <li>API endpoint management</li>
            <li>Row Level Security (RLS) policies</li>
          </ul>
          <p><strong>Benefits:</strong> Provides scalable, secure backend infrastructure with real-time capabilities.</p>
        </div>
      ),
      'Signature': (
        <div>
          <p><strong>Definition:</strong> A digital signature collected for verification or authorization purposes.</p>
          <p><strong>Use Cases:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Incident acknowledgment by witnesses</li>
            <li>Staff training completion verification</li>
            <li>Equipment handover confirmations</li>
            <li>Safety protocol acknowledgments</li>
            <li>Legal document authentication</li>
          </ul>
          <p><strong>Security:</strong> Digital signatures are cryptographically secured and legally binding.</p>
        </div>
      ),
      'Weather Card': (
        <div>
          <p><strong>Definition:</strong> A component displaying current weather information relevant to the event or venue.</p>
          <p><strong>Information Displayed:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Current temperature and conditions</li>
            <li>Hourly and daily forecasts</li>
            <li>Weather alerts and warnings</li>
            <li>UV index and air quality</li>
            <li>Wind speed and direction</li>
          </ul>
          <p><strong>Impact Assessment:</strong> Weather data helps assess potential risks to outdoor events and crowd safety.</p>
        </div>
      ),
      'Incident Table': (
        <div>
          <p><strong>Definition:</strong> A table listing all reported incidents with details and status.</p>
          <p><strong>Table Features:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Sortable columns (time, type, status)</li>
            <li>Filtering and search capabilities</li>
            <li>Real-time updates</li>
            <li>Bulk action support</li>
            <li>Export functionality</li>
          </ul>
          <p><strong>Data Display:</strong> Shows incident number, type, time, location, status, and assigned staff.</p>
        </div>
      ),
      'Incident Creation Modal': (
        <div>
          <p><strong>Definition:</strong> A popup form for reporting new incidents.</p>
          <p><strong>Form Fields:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Incident type selection</li>
            <li>Location and time details</li>
            <li>Description and severity</li>
            <li>Witness information</li>
            <li>Immediate actions taken</li>
          </ul>
          <p><strong>AI Assistance:</strong> Smart suggestions and auto-completion help ensure accurate reporting.</p>
        </div>
      ),
      'Event Creation Modal': (
        <div>
          <p><strong>Definition:</strong> A popup form for creating new events in the system.</p>
          <p><strong>Required Information:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Event name and description</li>
            <li>Date and time range</li>
            <li>Venue details and capacity</li>
            <li>Staff assignments</li>
            <li>Safety protocols and procedures</li>
          </ul>
          <p><strong>Templates:</strong> Pre-configured templates available for common event types.</p>
        </div>
      ),
      'Settings': (
        <div>
          <p><strong>Definition:</strong> Configuration options for customizing the application experience.</p>
          <p><strong>Settings Categories:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>User preferences and notifications</li>
            <li>System configuration options</li>
            <li>Security and access controls</li>
            <li>Integration settings</li>
            <li>Backup and restore options</li>
          </ul>
          <p><strong>Role-Based Access:</strong> Settings visibility depends on user permissions and role.</p>
        </div>
      ),
      'Authentication': (
        <div>
          <p><strong>Definition:</strong> The process of verifying user identity and granting system access.</p>
          <p><strong>Authentication Methods:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Email and password login</li>
            <li>Single Sign-On (SSO) integration</li>
            <li>Multi-factor authentication (MFA)</li>
            <li>Biometric authentication</li>
            <li>Social login options</li>
          </ul>
          <p><strong>Security Features:</strong> Session management, password policies, and audit logging.</p>
        </div>
      ),
      'API': (
        <div>
          <p><strong>Definition:</strong> Application Programming Interface - the system that allows different software components to communicate.</p>
          <p><strong>API Features:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>RESTful endpoints for data access</li>
            <li>Real-time WebSocket connections</li>
            <li>Authentication and authorization</li>
            <li>Rate limiting and throttling</li>
            <li>Comprehensive documentation</li>
          </ul>
          <p><strong>Integration:</strong> Enables third-party systems to integrate with inCommand for enhanced functionality.</p>
        </div>
      ),
      'Contemporaneous Logging': (
        <div>
          <p><strong>Definition:</strong> Logging incidents in real-time as they occur, providing the most accurate and legally defensible records.</p>
          <p><strong>Benefits:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Maximum accuracy and detail retention</li>
            <li>Legal defensibility in court proceedings</li>
            <li>Immediate availability for follow-up actions</li>
            <li>Reduced risk of memory errors or omissions</li>
            <li>Enhanced credibility with stakeholders</li>
          </ul>
          <p><strong>Best Practice:</strong> Always log incidents as soon as possible after they occur, ideally within minutes.</p>
        </div>
      ),
      'Retrospective Logging': (
        <div>
          <p><strong>Definition:</strong> Logging incidents after a delay, requiring justification for the timing difference.</p>
          <p><strong>When Used:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Technical system failures preventing immediate logging</li>
            <li>Emergency situations requiring immediate response</li>
            <li>Staff unavailability during peak operations</li>
            <li>Complex incidents requiring investigation first</li>
            <li>Follow-up information gathering</li>
          </ul>
          <p><strong>Documentation Requirements:</strong> Must include clear justification for the delay and timestamp of when the incident actually occurred.</p>
        </div>
      ),
      'Amendment': (
        <div>
          <p><strong>Definition:</strong> A non-destructive correction to an existing log entry, preserving the original while tracking changes.</p>
          <p><strong>Amendment Process:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Original entry remains visible</li>
            <li>Amendment clearly marked and timestamped</li>
            <li>Author of amendment recorded</li>
            <li>Reason for amendment documented</li>
            <li>Full audit trail maintained</li>
          </ul>
          <p><strong>Legal Protection:</strong> Amendments preserve the integrity of the original record while allowing necessary corrections.</p>
        </div>
      ),
      'Audit Trail': (
        <div>
          <p><strong>Definition:</strong> Complete record of all changes to log entries, including who made changes and when.</p>
          <p><strong>Audit Trail Components:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>User identification and authentication</li>
            <li>Timestamp of all modifications</li>
            <li>Before and after values</li>
            <li>Reason for changes</li>
            <li>System-generated verification codes</li>
          </ul>
          <p><strong>Compliance:</strong> Essential for legal proceedings, regulatory compliance, and internal investigations.</p>
        </div>
      ),
      'JESIP': (
        <div>
          <p><strong>Definition:</strong> Joint Emergency Services Interoperability Principles - UK standards for emergency service coordination.</p>
          <p><strong>JESIP Principles:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Co-location of command teams</li>
            <li>Shared situational awareness</li>
            <li>Joint decision making</li>
            <li>Shared communications</li>
            <li>Unified command structure</li>
          </ul>
          <p><strong>Application:</strong> Ensures effective coordination between police, fire, ambulance, and other emergency services during major incidents.</p>
        </div>
      ),
      'JDM': (
        <div>
          <p><strong>Definition:</strong> Joint Decision Making - collaborative decision-making process involving multiple stakeholders during emergency situations.</p>
          <p><strong>JDM Process:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Identify all relevant stakeholders</li>
            <li>Share critical information and intelligence</li>
            <li>Assess risks and available options</li>
            <li>Reach consensus on best course of action</li>
            <li>Implement decisions with clear accountability</li>
          </ul>
          <p><strong>Benefits:</strong> Reduces single-point-of-failure risks, improves decision quality, and ensures all perspectives are considered.</p>
        </div>
      ),
      'Structured Template': (
        <div>
          <p><strong>Definition:</strong> Standardized format for logging incidents that ensures consistency, completeness, and legal defensibility.</p>
          <p><strong>Template Components:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Headline (≤15 words, factual summary)</li>
            <li>Source (who/what reported the incident)</li>
            <li>Time and location details</li>
            <li>Description of what happened</li>
            <li>Actions taken and outcomes</li>
            <li>Follow-up requirements</li>
          </ul>
          <p><strong>Benefits:</strong> Ensures no critical information is missed, improves report quality, and maintains professional standards.</p>
        </div>
      ),
      'Factual Language': (
        <div>
          <p><strong>Definition:</strong> Objective, precise language used in incident reporting that avoids opinion, speculation, or emotional language.</p>
          <p><strong>Characteristics:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Specific, measurable details</li>
            <li>Objective observations only</li>
            <li>Present tense for current events</li>
            <li>Past tense for completed actions</li>
            <li>Clear, unambiguous statements</li>
          </ul>
          <p><strong>Examples:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>✅ "Person collapsed at 14:30 near north gate"</li>
            <li>❌ "Person seemed very ill and fell down"</li>
            <li>✅ "Security team responded within 2 minutes"</li>
            <li>❌ "Security team was really quick to help"</li>
          </ul>
          <p><strong>Legal Importance:</strong> Factual language ensures reports are admissible in court and maintain professional credibility.</p>
        </div>
      )
    };
    
    return contentMap[title] || <p>Additional information not available.</p>;
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300 pb-24" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="max-w-6xl mx-auto text-gray-900 dark:text-gray-100 p-6 md:p-10" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="card-depth mb-10 p-6">
          <div className="pb-6">
            <div className="flex items-center gap-3">
              <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Help &amp; Glossary</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Quick answers, definitions, and how-to guidance</p>
              </div>
              <Button asChild>
                <Link href="/help/tutorial">
                  Open Tutorial
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="card-depth mb-12 p-6">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              About This App
            </h2>
          </div>
          <div>
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
            <div className="bg-blue-50 dark:bg-[#1a2a57] dark:text-blue-100 p-4 rounded-xl border border-blue-200 dark:border-[#2d437a]">
              <p className="text-base leading-relaxed">
                For further assistance, please contact your system administrator or refer to the documentation provided by your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Logging Standards Section */}
        <div className="card-depth mb-12 p-6">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              Professional Logging Standards
            </h2>
          </div>
          <div>
          
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
            <div className="card-depth-subtle p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-green-600" />
                  Structured Logging Template
                </h3>
              </div>
              <div>
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
            </div>

            {/* Best Practices */}
            <div className="card-depth-subtle p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  Best Practices
                </h3>
              </div>
              <div>
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
          </div>

          {/* Language Guidelines */}
          <div className="card-depth mb-6 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                Language Guidelines
              </h3>
            </div>
            <div>
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
          </div>

          {/* Compliance Standards */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#451a03] dark:to-[#7c2d12] border border-amber-200 dark:border-[#92400e] p-6 rounded-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
                JESIP & JDM Compliance
              </h3>
            </div>
            <div>
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
          </div>
          </div>
        </div>

        <div className="card-depth p-6">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-blue-100 flex items-center gap-2">
              <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              Glossary of Terms
            </h2>
          </div>
          <div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {glossaryItems.map(({ title, description, icon }, idx) => (
                <div key={idx} className="card-depth-subtle p-4">
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      {getIconComponent(icon)}
                      <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-200">{title}</h3>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-blue-100 leading-relaxed text-sm line-clamp-3">{description}</p>
                    <div className="mt-3">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={`item-${idx}`} className="border-none">
                          <AccordionTrigger className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm font-medium hover:no-underline">
                            Read more
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <div className="text-sm text-gray-600 dark:text-blue-100 space-y-2">
                              {getExpandedContent(title)}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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