"use client"

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
      <div className="min-h-screen bg-gray-100 dark:bg-[#101c36] py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-[#23408e] rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-[#23408e] rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
                  <div className="h-4 bg-gray-200 dark:bg-[#2d437a] rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-[#2d437a] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#101c36] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex flex-col shadow-lg z-10">
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
          <div className="flex items-center space-x-2">
            <CogIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2 py-4 px-2">
          {navigation.map(item => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors w-full text-left
                  ${active ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Manage and monitor your platform settings and data</h1>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-5 py-2 rounded-lg shadow transition-colors duration-200">Setup Database</button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 flex flex-col items-start transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              <span className="font-semibold text-lg">Total Companies</span>
            </div>
            <span className="text-2xl font-bold">{companies.length}</span>
          </div>
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 flex flex-col items-start transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              <span className="font-semibold text-lg">Total Users</span>
            </div>
            <span className="text-2xl font-bold">{users.length}</span>
          </div>
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 flex flex-col items-start transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              <span className="font-semibold text-lg">Total Events</span>
            </div>
            <span className="text-2xl font-bold">{events.length}</span>
          </div>
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 flex flex-col items-start transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              <span className="font-semibold text-lg">Active Events</span>
            </div>
            <span className="text-2xl font-bold">{events.filter(event => new Date(event.end_datetime) > new Date()).length}</span>
          </div>
        </div>
        {/* System Overview Card */}
        <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-blue-200">System Overview</h2>
          <p className="text-gray-600 dark:text-blue-100">Welcome to the admin dashboard. Here you can manage companies, users, and view system statistics.</p>
        </div>
        {/* ...rest of the admin content... */}
      </main>
    </div>
  )
}

export default AdminPage 