'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  ChartBarIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  BellIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import UserManagementModal from '@/components/UserManagementModal';
import CompanyCreationModal from '@/components/CompanyCreationModal';

interface Company {
  id: string;
  name: string;
  created_at?: string;
  users?: User[];
  primary_contact_name: string;
  primary_contact_email: string;
  subscription_plan: 'trial' | 'free' | 'pro' | 'enterprise';
  billing_status: 'active' | 'past_due' | 'cancelled';
  account_status: 'active' | 'suspended' | 'inactive';
  last_activity?: string;
  account_manager?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  company_id: string;
  company?: {
    id: string;
    name: string;
  };
}

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  artist_name: string;
  venue_name: string;
  venue_address: string;
  start_datetime: string;
  end_datetime: string;
  description: string;
  company_id: string;
  created_at: string;
  company?: {
    name: string;
  };
}

interface AuditLog {
  id: string;
  action: string;
  action_type: 'user' | 'company' | 'event' | 'system';
  performed_by: string;
  details: string;
  created_at: string;
  user?: User;
}

// Modal interfaces
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  companies: Company[];
  onSubmit: (userData: Partial<User>) => Promise<void>;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (companyData: Partial<Company>) => Promise<void>;
}

// Add new interface for company filters
interface CompanyFilters {
  search: string;
  subscription_plan: string[];
  account_status: string[];
  billing_status: string[];
}

const navigation = [
  { name: 'Overview', icon: ChartBarIcon, id: 'overview' },
  { name: 'User Management', icon: UserGroupIcon, id: 'users' },
  { name: 'Companies', icon: BuildingOfficeIcon, id: 'companies' },
  { name: 'Events', icon: CalendarIcon, id: 'events' },
  { name: 'Billing & Subscriptions', icon: CreditCardIcon, id: 'billing' },
  { name: 'Audit Logs', icon: ClipboardDocumentListIcon, id: 'audit' },
  { name: 'Platform Settings', icon: CogIcon, id: 'settings' },
  { name: 'Notifications', icon: BellIcon, id: 'notifications' },
  { name: 'Support', icon: QuestionMarkCircleIcon, id: 'support' },
];

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const [companyFilters, setCompanyFilters] = useState<CompanyFilters>({
    search: '',
    subscription_plan: [],
    account_status: [],
    billing_status: []
  });
  const [sortConfig, setSortConfig] = useState<{column: string; direction: 'asc' | 'desc'} | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching data...')
      
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
      
      if (companiesError) {
        console.error('Error fetching companies:', companiesError)
        setError('Failed to fetch companies')
        return
      }

      console.log('Companies data:', companiesData)

      // Fetch all users/profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        setError('Failed to fetch users')
        return
      }

      console.log('Users data:', usersData)

      // Group users by company
      const companiesWithUsers = companiesData?.map(company => ({
        ...company,
        users: usersData?.filter(user => user.company_id === company.id) || []
      })) || []

      // Add users without company to "No Company" group
      const usersWithoutCompany = usersData?.filter(user => !user.company_id) || []
      if (usersWithoutCompany.length > 0) {
        companiesWithUsers.push({
          id: 'no-company',
          name: 'No Company',
          users: usersWithoutCompany
        })
      }

      console.log('Companies with users:', companiesWithUsers)

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
      
      if (eventsError) {
        console.error('Error fetching events:', eventsError)
        setError('Failed to fetch events')
        return
      }

      console.log('Events data:', eventsData)

      setCompanies(companiesWithUsers)
      setUsers(usersData || [])
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error in fetchData:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (companyData: Partial<Company>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single()

      if (error) throw error

      // Log the action
      await supabase.from('audit_logs').insert([{
        action: `Created company: ${companyData.name}`,
        action_type: 'company',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        details: JSON.stringify(data)
      }])

      await fetchData()
      setIsCompanyModalOpen(false)
    } catch (error) {
      console.error('Error creating company:', error)
    }
  }

  const handleUpdateUser = async (userData: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', userData.id)
        .select()
        .single()

      if (error) throw error

      // Log the action
      await supabase.from('audit_logs').insert([{
        action: `Updated user: ${userData.email}`,
        action_type: 'user',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        details: JSON.stringify(data)
      }])

      await fetchData()
      setIsUserModalOpen(false)
      setSelectedUser(undefined)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      // Log the action
      await supabase.from('audit_logs').insert([{
        action: `Deleted event: ${events.find(e => e.id === eventId)?.event_name}`,
        action_type: 'event',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        details: `Event ID: ${eventId}`
      }])

      await fetchData()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleResendInvite = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      alert('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invite:', error);
      alert('Failed to resend invitation');
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role');
    }
  };

  const handleUpdateUserCompany = async (userId: string, newCompanyId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: newCompanyId })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating user company:', error);
      setError('Failed to update user company');
    }
  };

  const setupDatabase = async () => {
    try {
      setError(null);
      const response = await fetch('/api/setup-database', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set up database');
      }

      const result = await response.json();
      console.log('Database setup result:', result);
      
      // Refresh the data after setup
      await fetchData();
    } catch (error) {
      console.error('Error setting up database:', error);
      setError(error instanceof Error ? error.message : 'Failed to set up database');
    }
  };

  // Add sorting function
  const handleSort = (column: string) => {
    setSortConfig(current => {
      if (current?.column === column) {
        return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  };

  // Add filter function
  const filteredCompanies = companies.filter(company => {
    const searchLower = companyFilters.search.toLowerCase();
    const matchesSearch = 
      company.name.toLowerCase().includes(searchLower) ||
      company.primary_contact_name?.toLowerCase().includes(searchLower) ||
      company.primary_contact_email?.toLowerCase().includes(searchLower);

    const matchesSubscription = 
      companyFilters.subscription_plan.length === 0 ||
      companyFilters.subscription_plan.includes(company.subscription_plan);

    const matchesStatus = 
      companyFilters.account_status.length === 0 ||
      companyFilters.account_status.includes(company.account_status);

    const matchesBilling = 
      companyFilters.billing_status.length === 0 ||
      companyFilters.billing_status.includes(company.billing_status);

    return matchesSearch && matchesSubscription && matchesStatus && matchesBilling;
  });

  // Add sorting logic
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (!sortConfig) return 0;

    const { column, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    switch (column) {
      case 'name':
        return modifier * a.name.localeCompare(b.name);
      case 'users':
        return modifier * ((a.users?.length || 0) - (b.users?.length || 0));
      case 'created_at':
        return modifier * (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      default:
        return 0;
    }
  });

  // Pagination
  const paginatedCompanies = sortedCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);

  // Bulk actions
  const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete') => {
    try {
      for (const companyId of selectedCompanies) {
        switch (action) {
          case 'suspend':
            await supabase
              .from('companies')
              .update({ account_status: 'suspended' })
              .eq('id', companyId);
            break;
          case 'activate':
            await supabase
              .from('companies')
              .update({ account_status: 'active' })
              .eq('id', companyId);
            break;
          case 'delete':
            await supabase
              .from('companies')
              .delete()
              .eq('id', companyId);
            break;
        }
      }
      await fetchData();
      setSelectedCompanies([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Super Admin</p>
                <p className="text-xs text-gray-500">View Profile</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="py-8 px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                {navigation.find(item => item.id === activeSection)?.name || 'Overview'}
              </h1>
              <button
                onClick={setupDatabase}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Setup Database
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor your platform settings and data
            </p>
          </div>

          {/* Quick Stats */}
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Companies</dt>
                        <dd className="text-lg font-medium text-gray-900">{companies.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                        <dd className="text-lg font-medium text-gray-900">{events.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {events.filter(event => new Date(event.end_datetime) > new Date()).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Sections */}
          <div className="bg-white shadow rounded-lg">
            {activeSection === 'overview' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">System Overview</h2>
                <div className="prose max-w-none">
                  <p>Welcome to the admin dashboard. Here you can manage companies, users, and view system statistics.</p>
                </div>
              </div>
            )}

            {activeSection === 'companies' && (
              <div className="p-6">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h2 className="text-lg font-medium text-gray-900">Companies</h2>
                    <p className="mt-2 text-sm text-gray-700">Manage and monitor all companies in the system.</p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
                    <button
                      onClick={() => setIsCompanyModalOpen(true)}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                      Add Company
                    </button>
                    {selectedCompanies.length > 0 && (
                      <div className="inline-flex rounded-md shadow-sm">
                        <button
                          onClick={() => handleBulkAction('suspend')}
                          className="inline-flex items-center rounded-l-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Suspend Selected
                        </button>
                        <button
                          onClick={() => handleBulkAction('activate')}
                          className="inline-flex items-center border-t border-b border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Activate Selected
                        </button>
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="inline-flex items-center rounded-r-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={companyFilters.search}
                      onChange={(e) => setCompanyFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Search companies..."
                    />
                  </div>
                  {/* Add more filter inputs here */}
                </div>

                {/* Company Table */}
                <div className="mt-8 flex flex-col">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                                <input
                                  type="checkbox"
                                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300"
                                  checked={selectedCompanies.length === paginatedCompanies.length}
                                  onChange={(e) => {
                                    setSelectedCompanies(
                                      e.target.checked
                                        ? paginatedCompanies.map(company => company.id)
                                        : []
                                    );
                                  }}
                                />
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                                onClick={() => handleSort('name')}
                              >
                                Company Name
                                {sortConfig?.column === 'name' && (
                                  <span className="ml-2">
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Primary Contact
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                                onClick={() => handleSort('users')}
                              >
                                Users
                                {sortConfig?.column === 'users' && (
                                  <span className="ml-2">
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Subscription
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Status
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                                onClick={() => handleSort('created_at')}
                              >
                                Joined
                                {sortConfig?.column === 'created_at' && (
                                  <span className="ml-2">
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {paginatedCompanies.map((company) => (
                              <tr key={company.id}>
                                <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                                  <input
                                    type="checkbox"
                                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300"
                                    checked={selectedCompanies.includes(company.id)}
                                    onChange={(e) => {
                                      setSelectedCompanies(prev =>
                                        e.target.checked
                                          ? [...prev, company.id]
                                          : prev.filter(id => id !== company.id)
                                      );
                                    }}
                                  />
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                  {company.name}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <div>{company.primary_contact_name || 'Not Set'}</div>
                                  <div className="text-xs">{company.primary_contact_email || 'No email'}</div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {company.users?.length || 0}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    company.subscription_plan === 'enterprise' 
                                      ? 'bg-purple-100 text-purple-800'
                                      : company.subscription_plan === 'pro'
                                      ? 'bg-green-100 text-green-800'
                                      : company.subscription_plan === 'trial'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {company.subscription_plan 
                                      ? company.subscription_plan.charAt(0).toUpperCase() + company.subscription_plan.slice(1)
                                      : 'Free'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    company.account_status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : company.account_status === 'suspended'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {company.account_status 
                                      ? company.account_status.charAt(0).toUpperCase() + company.account_status.slice(1)
                                      : 'Active'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-4">
                                    <button
                                      onClick={() => {/* TODO: View company details */}}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => {/* TODO: Edit company */}}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, sortedCompanies.length)}
                      </span>{' '}
                      of <span className="font-medium">{sortedCompanies.length}</span> companies
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <div className="space-x-4">
                    <button
                      onClick={() => setIsUserModalOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add User
                    </button>
                    <button
                      onClick={setupDatabase}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Setup Database
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No companies found. Click "Setup Database" to initialize the system.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {companies.map((company) => (
                      <div key={company.id} className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
                        </div>
                        {company.users && company.users.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {company.users.map((user) => (
                                  <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {user.full_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                      <select
                                        value={user.role}
                                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Super Admin</option>
                                      </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                      <div className="flex justify-end items-center">
                                        <button
                                          onClick={() => handleResendInvite(user.email)}
                                          className="text-indigo-600 hover:text-indigo-900"
                                        >
                                          Resend Invite
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-6 py-4 text-center text-gray-500">
                            No users in this company yet.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <UserManagementModal
                  isOpen={isUserModalOpen}
                  onClose={() => setIsUserModalOpen(false)}
                  refreshData={fetchData}
                />
              </div>
            )}

            {activeSection === 'events' && (
              <div className="p-6">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h2 className="text-lg font-medium text-gray-900">Events</h2>
                    <p className="mt-2 text-sm text-gray-700">A list of all events across all companies.</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-col">
                  <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Event Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artist</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Venue</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {events.map((event) => (
                            <tr key={event.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                {event.event_name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {event.event_type}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {event.artist_name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {event.venue_name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {companies.find(c => c.id === event.company_id)?.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(event.start_datetime).toLocaleString()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                                      handleDeleteEvent(event.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder sections for other tabs */}
            {activeSection === 'billing' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Billing & Subscriptions</h2>
                <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
              </div>
            )}

            {activeSection === 'audit' && (
              <div className="p-6">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h2 className="text-lg font-medium text-gray-900">Audit Logs</h2>
                    <p className="mt-2 text-sm text-gray-700">System-wide audit trail of all actions.</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-col">
                  <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performed By</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {auditLogs.map((log) => (
                              <tr key={log.id}>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.action}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    log.action_type === 'user' ? 'bg-blue-100 text-blue-800' :
                                    log.action_type === 'company' ? 'bg-green-100 text-green-800' :
                                    log.action_type === 'event' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {log.action_type}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {log.user?.full_name || 'System'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Platform Settings</h2>
                <div className="mt-6 space-y-8">
                  {/* Email Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          id="userCreation"
                        />
                        <label htmlFor="userCreation" className="ml-3 text-sm text-gray-700">
                          Send email when new users are created
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          id="eventCreation"
                        />
                        <label htmlFor="eventCreation" className="ml-3 text-sm text-gray-700">
                          Send email when new events are created
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Security</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          id="twoFactor"
                        />
                        <label htmlFor="twoFactor" className="ml-3 text-sm text-gray-700">
                          Require two-factor authentication for all users
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          id="passwordPolicy"
                        />
                        <label htmlFor="passwordPolicy" className="ml-3 text-sm text-gray-700">
                          Enforce strong password policy
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Audit Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Audit Logging</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          id="auditAll"
                        />
                        <label htmlFor="auditAll" className="ml-3 text-sm text-gray-700">
                          Log all user actions
                        </label>
                      </div>
                      <div>
                        <label htmlFor="retentionPeriod" className="block text-sm text-gray-700">
                          Log retention period (days)
                        </label>
                        <input
                          type="number"
                          id="retentionPeriod"
                          className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          defaultValue={90}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
              </div>
            )}

            {activeSection === 'support' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Support</h2>
                <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPage 