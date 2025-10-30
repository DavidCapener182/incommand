import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CalendarIcon,
  CreditCardIcon,
  LifebuoyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { sa_listCompanies, sa_listUsers, sa_listEvents, sa_billingOverview, sa_supportTickets, sa_systemMetrics } from '@/hooks/useSuperAdmin';
import CompanyEditDialogButton from '@/components/admin/companies/CompanyEditDialogButton'
import EventDetailsRow from '@/components/admin/events/EventDetailsRow'
import NewTicketFab from '@/components/admin/support/NewTicketFab'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  // Fetch all data in parallel with error handling
  let companies: any[] = [];
  let users: any[] = [];
  let events: any[] = [];
  let billing: any = { invoices: [], subscriptions: [], transactions: [] };
  let supportTickets: any[] = [];
  let metrics: any = { totalCompanies: 0, totalUsers: 0, totalEvents: 0, systemHealth: 'operational' };

  try {
    const results = await Promise.allSettled([
      sa_listCompanies(),
      sa_listUsers(),
      sa_listEvents(),
      sa_billingOverview(),
      sa_supportTickets(),
      sa_systemMetrics()
    ]);

    if (results[0].status === 'fulfilled') {
      companies = results[0].value;
      console.log('SuperAdminDashboard: Companies fetched:', companies.length);
    } else {
      console.error('Error fetching companies:', results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
      users = results[1].value;
      console.log('SuperAdminDashboard: Users fetched:', users.length);
    } else {
      console.error('Error fetching users:', results[1].reason);
    }

    if (results[2].status === 'fulfilled') {
      events = results[2].value;
      console.log('SuperAdminDashboard: Events fetched:', events.length);
    } else {
      console.error('Error fetching events:', results[2].reason);
    }

    if (results[3].status === 'fulfilled') billing = results[3].value;
    else console.error('Error fetching billing:', results[3].reason);

    if (results[4].status === 'fulfilled') supportTickets = results[4].value;
    else console.error('Error fetching support tickets:', results[4].reason);

    if (results[5].status === 'fulfilled') metrics = results[5].value;
    else console.error('Error fetching metrics:', results[5].reason);
  } catch (error) {
    console.error('Error in SuperAdminDashboard:', error);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Back Office Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">System administration and management</p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">System Health</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">Operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Management Section */}
      <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Companies</h2>
          <Link href="/admin/companies" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Manage Companies
          </Link>
        </div>
        
        {companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {(company as any).subscription_plan || 'trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (company as any).account_status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {(company as any).account_status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/admin/companies/${company.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">View</Link>
                      {/* Client edit dialog */}
                      <CompanyEditDialogButton id={company.id} name={company.name} plan={(company as any).subscription_plan} status={(company as any).account_status} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new company.</p>
          </div>
        )}
      </div>

      {/* Recent Events Section */}
      <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Events</h2>
        
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.slice(0, 5).map((event) => (
              <EventDetailsRow key={event.id} event={event as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No events found</h3>
          </div>
        )}
      </div>

      {/* Support Tickets Section */}
      <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Support Tickets</h2>
        
        {supportTickets.length > 0 ? (
          <div className="space-y-4">
            {supportTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2a57] rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title || 'Support Ticket'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {ticket.companies?.name} • {ticket.status || 'Open'}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <LifebuoyIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No support tickets found</h3>
          </div>
        )}
      </div>
      {/* Floating FAB for new ticket */}
      <NewTicketFab companies={companies.map(c => ({ id: c.id, name: c.name }))} />
    </div>
  );
}

