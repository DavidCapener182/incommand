import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { 
  CogIcon, 
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  ServerIcon,
  GlobeAltIcon,
  DatabaseIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

export default async function SettingsPage() {
  const { user, role } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Configure global system settings, security, and maintenance options</p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Configure authentication, authorization, and security policies</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Password Policy</span>
                <span className="text-gray-900 dark:text-white">Strong</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">2FA Required</span>
                <span className="text-green-600 dark:text-green-400">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Session Timeout</span>
                <span className="text-gray-900 dark:text-white">24 hours</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              Configure Security
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Manage system notifications and alerts</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Email Alerts</span>
                <span className="text-green-600 dark:text-green-400">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">System Errors</span>
                <span className="text-green-600 dark:text-green-400">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Maintenance</span>
                <span className="text-yellow-600 dark:text-yellow-400">Scheduled</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
              Configure Notifications
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <KeyIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Manage API keys and external integrations</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Supabase</span>
                <span className="text-green-600 dark:text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Payment Gateway</span>
                <span className="text-green-600 dark:text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Email Service</span>
                <span className="text-green-600 dark:text-green-400">Active</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
              Manage API Keys
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <ServerIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Server Configuration</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Configure server settings and performance</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Environment</span>
                <span className="text-gray-900 dark:text-white">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Log Level</span>
                <span className="text-gray-900 dark:text-white">Info</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Cache TTL</span>
                <span className="text-gray-900 dark:text-white">300s</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm">
              Configure Server
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <GlobeAltIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Domain & SSL</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Manage domain settings and SSL certificates</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Primary Domain</span>
                <span className="text-gray-900 dark:text-white">incommand.uk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">SSL Status</span>
                <span className="text-green-600 dark:text-green-400">Valid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Expires</span>
                <span className="text-gray-900 dark:text-white">2024-12-15</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm">
              Manage Domain
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <DatabaseIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Database configuration and maintenance</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Connection Pool</span>
                <span className="text-gray-900 dark:text-white">20/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Last Backup</span>
                <span className="text-gray-900 dark:text-white">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Size</span>
                <span className="text-gray-900 dark:text-white">2.4 GB</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
              Manage Database
            </button>
          </div>
        </div>

        {/* System Maintenance */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center mb-6">
            <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">System Maintenance</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Maintenance Mode</h4>
              <form action="/api/admin/system-settings" method="post" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Maintenance Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Temporarily disable public access for maintenance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input name="maintenance_mode" type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <button type="submit" className="ml-4 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[#2d437a]">Save</button>
              </form>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Health</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Database Health</span>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">API Health</span>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Storage Health</span>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Feature Flags</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Advanced Analytics</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enable advanced analytics dashboard</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Beta Features</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enable experimental features for testing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Maintenance Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Send notifications about scheduled maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}


