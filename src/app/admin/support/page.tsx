import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { sa_supportTickets } from '@/hooks/useSuperAdmin';
import NewTicketFab from '@/components/admin/support/NewTicketFab'
import Link from 'next/link'
import { 
  LifebuoyIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SupportPage() {
  const { user, role } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  const supportTickets = await sa_supportTickets();

  // Calculate stats from real data
  const totalTickets = supportTickets.length;
  const openTickets = supportTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = supportTickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length;
  
  const supportStats = {
    totalTickets,
    openTickets,
    resolvedTickets,
    averageResponseTime: 0, // Would need to calculate from ticket timestamps
    customerSatisfaction: 0 // Would need rating data
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage support tickets and customer service across all companies</p>
          </div>
          <NewTicketFab companies={[]} />
        </div>

        {/* Support Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <LifebuoyIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supportStats.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supportStats.openTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supportStats.resolvedTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supportStats.averageResponseTime}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{supportStats.customerSatisfaction}/5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Open Tickets</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Tickets that need immediate attention</p>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{supportStats.openTickets}</div>
            <Link href="/admin/support?filter=open" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">View Open Tickets</Link>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">High Priority</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Urgent tickets requiring immediate response</p>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {supportTickets.filter((t: any) => t.priority === 'high' || t.priority === 'urgent').length}
            </div>
            <Link href="/admin/support?priority=high" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm">View High Priority</Link>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Time</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Average time to first response</p>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{supportStats.averageResponseTime}h</div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              View Metrics
            </button>
          </div>
        </div>

        {/* Support Tickets Table */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Support Tickets</h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white">
                <option value="">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                {supportTickets.length > 0 ? supportTickets.slice(0, 20).map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2a57]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        #{ticket.id}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {ticket.title || 'Support Ticket'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {ticket.companies?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'open' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : ticket.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {(ticket.status || 'open').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (ticket.priority || 'medium') === 'high' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : (ticket.priority || 'medium') === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {ticket.assigned_to || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1">
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No support tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
