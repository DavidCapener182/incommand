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
  QuestionMarkCircleIcon,
  CodeBracketIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  CalculatorIcon,
  UserIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import UserManagementModal from '@/components/UserManagementModal';
import CompanyCreationModal from '@/components/CompanyCreationModal';
import EventPricingCalculator from '@/components/EventPricingCalculator';
import IconSidebar from '@/components/IconSidebar';

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
  avatar_url?: string; // Add avatar_url
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
  expected_attendance?: number;
  source_table?: string;
  is_current?: boolean;
  route_length?: number;
  assembly_point?: string;
  dispersal_point?: string;
  duration_days?: number;
  camping_available?: boolean;
  client_company?: string;
  event_purpose?: string;
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

// Development tracking interfaces
interface DevSession {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  description: string;
  category: 'development' | 'design' | 'testing' | 'planning' | 'research';
  hourly_rate: number;
  total_cost: number;
  created_at: string;
}

interface AIUsage {
  id: string;
  date: string;
  service: 'cursor' | 'openai' | 'claude' | 'perplexity' | 'other';
  usage_type: 'chat' | 'code_completion' | 'generation' | 'analysis';
  tokens_used?: number;
  cost: number;
  description: string;
  created_at: string;
}

interface DevMetrics {
  total_hours: number;
  total_dev_cost: number;
  total_ai_cost: number;
  total_subscription_cost: number;
  total_investment: number;
  sessions_count: number;
  avg_session_length: number;
  projected_monthly_revenue: number;
  break_even_subscribers: number;
  roi_timeline_months: number;
  total_paid_out: number; // new: sum of all paid out (subscriptions)
  total_dev_time_cost: number; // new: sum of all dev time (sessions)
}

interface SubscriptionCost {
  id: string;
  service_name: string;
  cost: number;
  billing_period: 'monthly' | 'yearly' | 'one-time';
  start_date: string;
  end_date?: string;
  description: string;
  created_at: string;
}

interface DevSettings {
  hourly_rate: number;
  subscription_price_monthly: number;
  subscription_price_yearly: number;
  per_event_price: number;
  target_subscribers: number;
  // Tiered pricing (5 tiers + arena premium)
  per_event_price_light: number;      // 1-3 events/month
  per_event_price_casual: number;     // 4-8 events/month
  per_event_price_regular: number;    // 9-15 events/month  
  per_event_price_frequent: number;   // 16-25 events/month
  per_event_price_enterprise: number; // 26+ events/month
  per_event_price_enterprise_arena: number; // 26+ events/month for venues 20k+ capacity
  // Cost estimates
  cost_per_customer_yearly: number;
  cost_per_event: number;
  // Subscriber projections for analysis
  subscribers_monthly: number;
  subscribers_yearly: number;
  subscribers_light: number;          // One-off events (1-3/month)
  subscribers_casual: number;         // 4-8 events/month
  subscribers_regular: number;        // 9-15 events/month
  subscribers_frequent: number;       // 16-25 events/month
  subscribers_enterprise: number;     // 26+ events/month
}

const navigation = [
  { name: 'Overview', icon: ChartBarIcon, id: 'overview' },
  { name: 'User Management', icon: UserGroupIcon, id: 'users' },
  { name: 'Companies', icon: BuildingOfficeIcon, id: 'companies' },
  { name: 'Events', icon: CalendarIcon, id: 'events' },
  { name: 'Pricing Calculator', icon: CalculatorIcon, id: 'pricing' },
  { name: 'Development Tracking', icon: CodeBracketIcon, id: 'development' },
  { name: 'Billing & Subscriptions', icon: CreditCardIcon, id: 'billing' },
  { name: 'Audit Logs', icon: ClipboardDocumentListIcon, id: 'audit' },
  { name: 'Platform Settings', icon: CogIcon, id: 'settings' },
  { name: 'Notifications', icon: BellIcon, id: 'notifications' },
  { name: 'Support', icon: QuestionMarkCircleIcon, id: 'support' },
];

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [usersGroupedByCompany, setUsersGroupedByCompany] = useState<Record<string, any[]>>({})
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Development tracking state
  const [devSessions, setDevSessions] = useState<DevSession[]>([]);
  const [subscriptionCosts, setSubscriptionCosts] = useState<SubscriptionCost[]>([]);
  const [devSettings, setDevSettings] = useState<DevSettings>({
    hourly_rate: 40,
    subscription_price_monthly: 487.5,
    subscription_price_yearly: 5000,
    per_event_price: 75, // Average of all tiers
    target_subscribers: 100,
    // Tiered pricing (5 tiers + arena premium)
    per_event_price_light: 150,      // Premium for light usage (1-3 events)
    per_event_price_casual: 125,     // High rate (4-8 events) 
    per_event_price_regular: 100,    // Standard rate (9-15 events)
    per_event_price_frequent: 75,    // Volume discount (16-25 events)
    per_event_price_enterprise: 50,  // Enterprise rate (26+ events)
    per_event_price_enterprise_arena: 75, // Arena premium (26+ events, 20k+ capacity)
    // Cost estimates
    cost_per_customer_yearly: 500, // Server, support, etc.
    cost_per_event: 5,              // Processing, storage per event
    // Subscriber projections for analysis
    subscribers_monthly: 20,         // Monthly subscription customers
    subscribers_yearly: 50,          // Yearly subscription customers
    subscribers_light: 30,           // One-off event customers (1-3/month)
    subscribers_casual: 15,          // Casual customers (4-8/month)
    subscribers_regular: 10,         // Regular customers (9-15/month)
    subscribers_frequent: 5,         // Frequent customers (16-25/month)
    subscribers_enterprise: 2        // Enterprise customers (26+/month)
  });

  // Auto-calculate monthly price based on yearly price with 17% discount
  const calculateMonthlyFromYearly = (yearlyPrice: number) => {
    return Math.round((yearlyPrice / 12) * 100) / 100; // Round to 2 decimal places
  };

  // Auto-calculate what the monthly plan price should be (17% higher than yearly equivalent)
  const calculateMonthlyPlanPrice = (yearlyPrice: number) => {
    return Math.round((yearlyPrice / 12) * 1.17 * 100) / 100; // Round to 2 decimal places
  };
  const [devMetrics, setDevMetrics] = useState<DevMetrics>({
    total_hours: 0,
    total_dev_cost: 0,
    total_ai_cost: 0,
    total_subscription_cost: 0,
    total_investment: 0,
    sessions_count: 0,
    avg_session_length: 0,
    projected_monthly_revenue: 0,
    break_even_subscribers: 0,
    roi_timeline_months: 0,
    total_paid_out: 0, // new: sum of all paid out (subscriptions)
    total_dev_time_cost: 0, // new: sum of all dev time (sessions)
  });
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    description: '',
    category: 'development' as const,
    hourly_rate: 15 // Will be updated from database
  });
  const [newSubscription, setNewSubscription] = useState<{
    service_name: string;
    cost: number;
    billing_period: 'monthly' | 'yearly' | 'one-time';
    start_date: string;
    end_date: string;
    description: string;
  }>({
    service_name: '',
    cost: 0,
    billing_period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: ''
  });

  // Add state for modal/expanded company
  // const [selectedCompanyUsers, setSelectedCompanyUsers] = useState<any[] | null>(null);
  // const [selectedCompanyEvents, setSelectedCompanyEvents] = useState<any[] | null>(null);
  // const [showUsersModal, setShowUsersModal] = useState(false);
  // const [showEventsModal, setShowEventsModal] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  // Add state for editing user/company
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchData()
    fetchDevData()
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (session?.user) {
          setCurrentUser(session.user);
          const superAdminEmails = [
            'david.capener@compactsecurity.co.uk',
            'capener182@gmail.com',
            'capener182@googlemail.com'
          ];
          const isSuper = superAdminEmails.includes(session.user.email || '');
          console.log('Setting super admin status:', isSuper);
          setIsSuperAdmin(isSuper);
        } else {
          setCurrentUser(null);
          setIsSuperAdmin(false);
        }
      }
    );

    // Also check immediately
    checkSuperAdmin();

    return () => {
      subscription.unsubscribe();
    };
  }, [])

  // Calculate pricing whenever yearly price changes
  const calculatePricing = (yearlyPrice: number) => {
    // Monthly price is yearly / 12 * 1.20 (20% premium to make yearly more attractive)
    const monthlyPrice = Math.round((yearlyPrice / 12) * 1.20 * 100) / 100;
    
    // Per-event pricing strategy based on monthly price
    // Break-even point: if someone uses 5 events/month, they should consider monthly subscription
    const breakEvenRate = monthlyPrice / 5; // Monthly subscription becomes attractive at 5 events
    
    // 5-tier per-event pricing
    const perEventLight = Math.round(breakEvenRate * 2.0 * 100) / 100;      // 200% - Very high for 1-3 events
    const perEventCasual = Math.round(breakEvenRate * 1.6 * 100) / 100;     // 160% - High for 4-8 events  
    const perEventRegular = Math.round(breakEvenRate * 1.3 * 100) / 100;    // 130% - Standard for 9-15 events
    const perEventFrequent = Math.round(breakEvenRate * 1.1 * 100) / 100;   // 110% - Small discount for 16-25 events
    const perEventEnterprise = Math.round(breakEvenRate * 0.9 * 100) / 100; // 90% - Volume discount for 26+ events
    
    // Enterprise premium for venues over 20,000 capacity (add 50% to all per-event rates)
    const perEventEnterpriseArena = Math.round(perEventEnterprise * 1.5 * 100) / 100;
    
    const perEventAverage = Math.round((perEventLight + perEventCasual + perEventRegular + perEventFrequent + perEventEnterprise) / 5 * 100) / 100;
    
    return {
      subscription_price_yearly: yearlyPrice,
      subscription_price_monthly: monthlyPrice,
      per_event_price: perEventAverage,
      per_event_price_light: perEventLight,
      per_event_price_casual: perEventCasual,
      per_event_price_regular: perEventRegular,
      per_event_price_frequent: perEventFrequent,
      per_event_price_enterprise: perEventEnterprise,
      per_event_price_enterprise_arena: perEventEnterpriseArena
    };
  };

  // Calculate initial pricing
  useEffect(() => {
    const initialPricing = calculatePricing(5000); // Default £5000 yearly
    setDevSettings(prev => ({ 
      ...prev, 
      ...initialPricing
    }));
  }, []) // Only run on initial load

  // Update newSession hourly rate when devSettings changes
  useEffect(() => {
    setNewSession(prev => ({
      ...prev,
      hourly_rate: devSettings.hourly_rate
    }));
  }, [devSettings.hourly_rate])

  const checkSuperAdmin = async () => {
    try {
      console.log('Checking super admin status...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        return;
      }
      
      if (user) {
        console.log('Current user email:', user.email); // Debug log
        setCurrentUser(user);
        // Check if user is super admin (you can adjust this logic)
        const superAdminEmails = [
          'david.capener@compactsecurity.co.uk',
          'capener182@gmail.com',
          'capener182@googlemail.com'
        ]; // Add your emails here
        const isSuper = superAdminEmails.includes(user.email || '');
        console.log('Is super admin:', isSuper); // Debug log
        setIsSuperAdmin(isSuper);
      } else {
        console.log('No user found');
        setCurrentUser(null);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch all users from profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('company', { ascending: true })
        .order('full_name', { ascending: true })
      console.log('DEBUG: usersData', usersData, 'usersError', usersError)
      if (usersError) {
        setError('Failed to fetch users')
        setLoading(false)
        return
      }
      // Fetch all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true })
      console.log('DEBUG: companiesData', companiesData, 'companiesError', companiesError)
      if (companiesError) {
        setError('Failed to fetch companies')
        setLoading(false)
        return
      }
      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })
      console.log('DEBUG: eventsData', eventsData, 'eventsError', eventsError)
      if (eventsError) {
        setError('Failed to fetch events')
        setLoading(false)
        return
      }
      setUsers(usersData || [])
      setCompanies(companiesData || [])
      setEvents(eventsData || [])
      setLoading(false)
    } catch (err) {
      setError('Unexpected error fetching admin data')
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

  // Development tracking functions
  const fetchDevData = async () => {
    try {
      // Fetch development sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('dev_sessions')
        .select('*')
        .order('date', { ascending: false });

      if (sessionsError && sessionsError.code !== 'PGRST116') {
        console.error('Error fetching dev sessions:', sessionsError);
      } else if (sessionsData) {
        setDevSessions(sessionsData);
      }

      // Fetch subscription costs
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscription_costs')
        .select('*')
        .order('start_date', { ascending: false });

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription costs:', subscriptionError);
      } else if (subscriptionData) {
        setSubscriptionCosts(subscriptionData);
      }

      // Fetch dev settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('dev_settings')
        .select('*');

      let currentSettings: DevSettings = {
        hourly_rate: 40,
        subscription_price_monthly: 25,
        subscription_price_yearly: 250,
        per_event_price: 15,
        target_subscribers: 100,
        // Tiered pricing defaults
        per_event_price_light: 150,
        per_event_price_casual: 125,
        per_event_price_regular: 100,
        per_event_price_frequent: 75,
        per_event_price_enterprise: 50,
        per_event_price_enterprise_arena: 75,
        // Cost estimates defaults
        cost_per_customer_yearly: 500,
        cost_per_event: 5,
        // Subscriber projections defaults
        subscribers_monthly: 20,
        subscribers_yearly: 50,
        subscribers_light: 30,
        subscribers_casual: 15,
        subscribers_regular: 10,
        subscribers_frequent: 5,
        subscribers_enterprise: 2
      };

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching dev settings:', settingsError);
      } else if (settingsData) {
        const settings = settingsData.reduce((acc, setting) => {
          acc[setting.setting_name] = setting.setting_value;
          return acc;
        }, {} as any);
        
        const yearlyPrice = settings.subscription_price_yearly || 250;
        const autoCalculatedMonthly = Math.round((yearlyPrice / 12) * 1.17 * 100) / 100;
        
        currentSettings = {
          hourly_rate: settings.hourly_rate || 40,
          subscription_price_monthly: autoCalculatedMonthly, // Auto-calculate from yearly
          subscription_price_yearly: yearlyPrice,
          per_event_price: settings.per_event_price || 15,
          target_subscribers: settings.target_subscribers || 100,
          // Tiered pricing defaults
          per_event_price_light: settings.per_event_price_light || 150,
          per_event_price_casual: settings.per_event_price_casual || 125,
          per_event_price_regular: settings.per_event_price_regular || 100,
          per_event_price_frequent: settings.per_event_price_frequent || 75,
          per_event_price_enterprise: settings.per_event_price_enterprise || 50,
          per_event_price_enterprise_arena: settings.per_event_price_enterprise_arena || 75,
          // Cost estimates defaults
          cost_per_customer_yearly: settings.cost_per_customer_yearly || 500,
          cost_per_event: settings.cost_per_event || 5,
          // Subscriber projections defaults
          subscribers_monthly: settings.subscribers_monthly || 20,
          subscribers_yearly: settings.subscribers_yearly || 50,
          subscribers_light: settings.subscribers_light || 30,
          subscribers_casual: settings.subscribers_casual || 15,
          subscribers_regular: settings.subscribers_regular || 10,
          subscribers_frequent: settings.subscribers_frequent || 5,
          subscribers_enterprise: settings.subscribers_enterprise || 2
        };
        setDevSettings(currentSettings);
      }

      // Calculate metrics with the current settings (no AI usage data)
      calculateDevMetricsWithSettings(sessionsData || [], subscriptionData || [], currentSettings);
    } catch (error) {
      console.error('Error fetching development data:', error);
    }
  };

  const calculateDevMetrics = (sessions: DevSession[], subscriptions: SubscriptionCost[] = []) => {
    calculateDevMetricsWithSettings(sessions, subscriptions, devSettings);
  };

  const calculateDevMetricsWithSettings = (sessions: DevSession[], subscriptions: SubscriptionCost[] = [], settings: DevSettings) => {
    const totalHours = sessions.reduce((sum, session) => sum + session.duration_hours, 0);
    // Recalculate total cost using current hourly rate instead of stored total_cost
    const totalDevCost = totalHours * settings.hourly_rate;
    const totalAiCost = 0; // We'll track AI costs through subscriptions instead
    
    // Calculate subscription costs (annualized for monthly/yearly, one-time as is)
    const totalSubscriptionCost = subscriptions.reduce((sum, sub) => {
      const cost = sub.cost;
      if (sub.billing_period === 'monthly') {
        // Calculate months from start_date to end_date or current date
        const startDate = new Date(sub.start_date);
        const endDate = sub.end_date ? new Date(sub.end_date) : new Date();
        const months = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return sum + (cost * months);
      } else if (sub.billing_period === 'yearly') {
        // Calculate years from start_date to end_date or current date
        const startDate = new Date(sub.start_date);
        const endDate = sub.end_date ? new Date(sub.end_date) : new Date();
        const years = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));
        return sum + (cost * years);
      } else {
        return sum + cost; // one-time
      }
    }, 0);
    
    const totalInvestment = totalDevCost + totalAiCost + totalSubscriptionCost;
    const avgSessionLength = sessions.length > 0 ? totalHours / sessions.length : 0;
    
    // Use provided settings for calculations
    const projectedMonthlyRevenue = settings.subscription_price_monthly * settings.target_subscribers;
    const breakEvenSubscribers = Math.ceil(totalInvestment / settings.subscription_price_monthly);
    const roiTimelineMonths = Math.ceil(totalInvestment / projectedMonthlyRevenue);

    const totalDevTimeCost = -1 * sessions.reduce((sum, session) => sum + session.total_cost, 0); // negative
    const totalPaidOut = -1 * subscriptions.reduce((sum, sub) => {
      const cost = sub.cost;
      if (sub.billing_period === 'monthly') {
        const startDate = new Date(sub.start_date);
        const endDate = sub.end_date ? new Date(sub.end_date) : new Date();
        const months = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return sum + (cost * months);
      } else if (sub.billing_period === 'yearly') {
        const startDate = new Date(sub.start_date);
        const endDate = sub.end_date ? new Date(sub.end_date) : new Date();
        const years = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));
        return sum + (cost * years);
      } else {
        return sum + cost;
      }
    }, 0); // negative

    setDevMetrics({
      total_hours: totalHours,
      total_dev_cost: totalDevCost,
      total_ai_cost: totalAiCost,
      total_subscription_cost: totalSubscriptionCost,
      total_investment: totalInvestment,
      sessions_count: sessions.length,
      avg_session_length: avgSessionLength,
      projected_monthly_revenue: projectedMonthlyRevenue,
      break_even_subscribers: breakEvenSubscribers,
      roi_timeline_months: roiTimelineMonths,
      total_paid_out: totalPaidOut,
      total_dev_time_cost: totalDevTimeCost,
    });
  };



  const saveAllData = async () => {
    try {
      // Update settings
      const settingsToUpdate = [
        { setting_name: 'hourly_rate', setting_value: devSettings.hourly_rate, description: 'Hourly rate for development work', updated_at: new Date().toISOString() },
        { setting_name: 'subscription_price_monthly', setting_value: devSettings.subscription_price_monthly, description: 'Monthly subscription price', updated_at: new Date().toISOString() },
        { setting_name: 'subscription_price_yearly', setting_value: devSettings.subscription_price_yearly, description: 'Yearly subscription price', updated_at: new Date().toISOString() },
        { setting_name: 'per_event_price', setting_value: devSettings.per_event_price, description: 'Average price per event', updated_at: new Date().toISOString() },
        { setting_name: 'per_event_price_light', setting_value: devSettings.per_event_price_light, description: 'Price per event for light users (1-5 events/month)', updated_at: new Date().toISOString() },
        { setting_name: 'per_event_price_regular', setting_value: devSettings.per_event_price_regular, description: 'Price per event for regular users (6-15 events/month)', updated_at: new Date().toISOString() },
        { setting_name: 'per_event_price_frequent', setting_value: devSettings.per_event_price_frequent, description: 'Price per event for frequent users (16-25 events/month)', updated_at: new Date().toISOString() },
        { setting_name: 'per_event_price_enterprise', setting_value: devSettings.per_event_price_enterprise, description: 'Price per event for enterprise users (26+ events/month)', updated_at: new Date().toISOString() },
        { setting_name: 'cost_per_customer_yearly', setting_value: devSettings.cost_per_customer_yearly, description: 'Annual cost per customer (infrastructure, support)', updated_at: new Date().toISOString() },
        { setting_name: 'cost_per_event', setting_value: devSettings.cost_per_event, description: 'Cost per event (processing, storage)', updated_at: new Date().toISOString() },
        { setting_name: 'target_subscribers', setting_value: devSettings.target_subscribers, description: 'Target number of subscribers for projections', updated_at: new Date().toISOString() }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('dev_settings')
          .upsert(setting, { 
            onConflict: 'setting_name',
            ignoreDuplicates: false 
          });
        if (error) throw error;
      }

      // Add new dev session if filled out
      if (newSession.start_time && newSession.end_time && newSession.description) {
        const startTime = new Date(`${newSession.date}T${newSession.start_time}`);
        let endTime = new Date(`${newSession.date}T${newSession.end_time}`);
        
        // If end time is earlier than start time, assume it's the next day
        if (endTime.getTime() <= startTime.getTime()) {
          endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        }
        
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const totalCost = durationHours * newSession.hourly_rate;

        const sessionData = {
          date: newSession.date,
          start_time: newSession.start_time,
          end_time: newSession.end_time,
          duration_hours: durationHours,
          description: newSession.description,
          category: newSession.category,
          hourly_rate: newSession.hourly_rate,
          total_cost: totalCost
        };

        const { error } = await supabase
          .from('dev_sessions')
          .insert([sessionData]);
        if (error) throw error;

        // Reset session form
        setNewSession({
          date: new Date().toISOString().split('T')[0],
          start_time: '',
          end_time: '',
          description: '',
          category: 'development',
          hourly_rate: devSettings.hourly_rate
        });
      }

      // Add new subscription if filled out
      if (newSubscription.service_name && newSubscription.cost > 0) {
        const subscriptionsToInsert = [newSubscription];

        // If this is a yearly subscription, also create a monthly equivalent for comparison
        if (newSubscription.billing_period === 'yearly') {
          // Calculate monthly equivalent with 17% discount (yearly is cheaper)
          const monthlyEquivalent = (newSubscription.cost / 12) * 1.17; // Add 17% to make yearly look better
          
          const monthlySubscription = {
            service_name: `${newSubscription.service_name} (Monthly Plan)`,
            cost: Math.round(monthlyEquivalent * 100) / 100, // Round to 2 decimal places
            billing_period: 'monthly' as const,
            start_date: newSubscription.start_date,
            end_date: newSubscription.end_date,
            description: `Monthly equivalent of ${newSubscription.service_name} yearly plan - shows yearly savings`
          };
          
          subscriptionsToInsert.push(monthlySubscription);
        }

        const { error } = await supabase
          .from('subscription_costs')
          .insert(subscriptionsToInsert);
        if (error) throw error;

        // Reset subscription form
        setNewSubscription({
          service_name: '',
          cost: 0,
          billing_period: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          description: ''
        });
      }

      await fetchDevData();
      alert('All data saved successfully!');
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert(`Error saving data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fixNegativeSessions = async () => {
    try {
      // Get all sessions from database
      const { data: sessions, error: fetchError } = await supabase
        .from('dev_sessions')
        .select('*');

      if (fetchError) throw fetchError;

      if (!sessions) {
        alert('No sessions found to fix');
        return;
      }

      const sessionsToFix = [];

      for (const session of sessions) {
        // Recalculate duration and cost for each session
        const startTime = new Date(`${session.date}T${session.start_time}`);
        let endTime = new Date(`${session.date}T${session.end_time}`);
        
        // If end time is earlier than start time, assume it's the next day
        if (endTime.getTime() <= startTime.getTime()) {
          endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        }
        
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const totalCost = durationHours * session.hourly_rate;

        // Only update if the values are different (negative or incorrect)
        if (session.duration_hours !== durationHours || session.total_cost !== totalCost) {
          sessionsToFix.push({
            id: session.id,
            duration_hours: durationHours,
            total_cost: totalCost
          });
        }
      }

      if (sessionsToFix.length === 0) {
        alert('No sessions need fixing - all durations are correct!');
        return;
      }

      // Update each session
      for (const sessionUpdate of sessionsToFix) {
        const { error: updateError } = await supabase
          .from('dev_sessions')
          .update({
            duration_hours: sessionUpdate.duration_hours,
            total_cost: sessionUpdate.total_cost
          })
          .eq('id', sessionUpdate.id);

        if (updateError) throw updateError;
      }

      alert(`Fixed ${sessionsToFix.length} sessions with incorrect duration/cost calculations!`);
      await fetchDevData(); // Refresh the UI
      
    } catch (error) {
      console.error('Error fixing negative sessions:', error);
      alert(`Error fixing sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const seedInitialData = async () => {
    try {
      // Historical development sessions based on our conversation history
      const initialSessions = [
        {
          date: '2024-12-10',
          start_time: '09:00',
          end_time: '12:00',
          duration_hours: 3.0,
          description: 'Initial InCommand setup, authentication, and basic structure',
          category: 'development',
          hourly_rate: 40,
          total_cost: 120
        },
        {
          date: '2024-12-11',
          start_time: '14:00',
          end_time: '18:30',
          duration_hours: 4.5,
          description: 'Staff management system development and database debugging',
          category: 'development',
          hourly_rate: 40,
          total_cost: 180
        },
        {
          date: '2024-12-12',
          start_time: '10:00',
          end_time: '13:00',
          duration_hours: 3.0,
          description: 'Company footer feature, admin fixes, and user company assignment',
          category: 'development',
          hourly_rate: 40,
          total_cost: 120
        },
        {
          date: '2024-12-13',
          start_time: '13:00',
          end_time: '20:00',
          duration_hours: 7.0,
          description: 'Complete callsign assignment interface redesign - modern card layout',
          category: 'design',
          hourly_rate: 40,
          total_cost: 280
        },
        {
          date: '2024-12-14',
          start_time: '15:00',
          end_time: '19:00',
          duration_hours: 4.0,
          description: 'Staff data integration, department management, and CRUD operations',
          category: 'development',
          hourly_rate: 40,
          total_cost: 160
        },
        {
          date: '2024-12-15',
          start_time: '11:00',
          end_time: '16:00',
          duration_hours: 5.0,
          description: 'UI improvements, spacing fixes, color palette updates, and responsive design',
          category: 'design',
          hourly_rate: 40,
          total_cost: 200
        },
        {
          date: '2024-12-16',
          start_time: '16:00',
          end_time: '18:30',
          duration_hours: 2.5,
          description: 'Available staff display, hover tooltips, and dropdown visibility fixes',
          category: 'development',
          hourly_rate: 40,
          total_cost: 100
        },
        {
          date: '2024-12-17',
          start_time: '14:00',
          end_time: '17:00',
          duration_hours: 3.0,
          description: 'Navigation cleanup, position card improvements, and unassign button redesign',
          category: 'development',
          hourly_rate: 40,
          total_cost: 120
        },
        {
          date: '2024-12-18',
          start_time: '10:00',
          end_time: '14:00',
          duration_hours: 4.0,
          description: 'Development tracking system implementation and admin panel features',
          category: 'development',
          hourly_rate: 40,
          total_cost: 160
        },
        {
          date: '2024-12-19',
          start_time: '15:00',
          end_time: '18:00',
          duration_hours: 3.0,
          description: 'Subscription management system and ROI calculations',
          category: 'development',
          hourly_rate: 40,
          total_cost: 120
        }
      ];

      const initialSubscriptions = [
        {
          service_name: 'Cursor Pro',
          cost: 20,
          billing_period: 'monthly',
          start_date: '2024-12-01',
          description: 'AI-powered code editor for development'
        },
        {
          service_name: 'ChatGPT Plus',
          cost: 20,
          billing_period: 'monthly',
          start_date: '2024-12-01',
          description: 'AI assistant for problem solving and documentation'
        },
        {
          service_name: 'GitHub Copilot',
          cost: 10,
          billing_period: 'monthly',
          start_date: '2024-12-01',
          description: 'AI pair programmer for code completion'
        }
      ];

      // Insert sessions
      const { error: sessionsError } = await supabase
        .from('dev_sessions')
        .insert(initialSessions);

      if (sessionsError) throw sessionsError;

      // Insert subscriptions
      const { error: subscriptionError } = await supabase
        .from('subscription_costs')
        .insert(initialSubscriptions);

      if (subscriptionError) throw subscriptionError;

      alert('Initial development data seeded successfully! Total: 38 hours, £1,520 dev cost, £150 subscription costs');
      fetchDevData();
    } catch (error) {
      console.error('Error seeding initial data:', error);
      setError('Failed to seed initial data');
    }
  };

  useEffect(() => {
    // Group users by company name (or 'No Company')
    const grouped: Record<string, any[]> = {};
    users.forEach(user => {
      const company = companies.find(c => c.id === user.company_id);
      const companyName = company ? company.name : 'No Company';
      if (!grouped[companyName]) grouped[companyName] = [];
      grouped[companyName].push(user);
    });
    setUsersGroupedByCompany(grouped);
    // REMOVE setCompanies(companiesWithCounts) to avoid overwriting companies
  }, [users, companies, events]);

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: { full_name: userData.full_name }
      });
      if (authError) throw authError;
      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: userData.email,
            full_name: userData.full_name,
            company_id: userData.company_id,
            role: userData.role
          }
        ]);
      if (profileError) throw profileError;
      await fetchData();
      setIsUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    }
  };

  const handleUpdateCompany = async (companyData: Partial<Company>) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: companyData.name })
        .eq('id', companyData.id);
      if (error) throw error;
      await fetchData();
      setIsCompanyModalOpen(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Failed to update company');
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
                <div key={i} className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
      <IconSidebar
        navigation={navigation}
        activeItem={activeSection}
        onItemClick={setActiveSection}
        title="Admin"
      />
      
      <main className="flex-1 ml-16 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and monitor your platform settings and data</p>
            </div>
          </div>

        {/* System Overview Card */}
        {activeSection === 'overview' && (
          <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 mb-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-blue-200">System Overview</h2>
            <p className="text-gray-600 dark:text-blue-100 mb-4">Welcome to the admin dashboard. Here you can manage companies, users, and view system statistics.</p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  <span className="font-semibold text-lg">Total Companies</span>
        </div>
                <span className="text-2xl font-bold">{companies.length}</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  <span className="font-semibold text-lg">Total Users</span>
                </div>
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  <span className="font-semibold text-lg">Total Events</span>
                </div>
                <span className="text-2xl font-bold">{events.length}</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  <span className="font-semibold text-lg">Active Events</span>
                </div>
                <span className="text-2xl font-bold">{events.filter(event => new Date(event.end_datetime) > new Date()).length}</span>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">User Management</h2>
                <p className="text-gray-600 dark:text-blue-100 text-sm">All users across inCommand platform sorted by company</p>
            </div>
            <button
                onClick={() => setIsUserModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors duration-200"
            >
                Add New User
            </button>
          </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{users.length}</div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Total Users</div>
        </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">{companies.length}</div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Companies</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {users.filter(user => user.role === 'admin' || user.role === 'superadmin').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Admins</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                  {users.filter(user => !user.company_id).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Unassigned</div>
              </div>
            </div>

            {/* Users grouped by company, but filtered if companyFilter is set */}
            <div className="space-y-6">
              {Object.entries(usersGroupedByCompany)
                .filter(([companyName, _]) => {
                  if (!companyFilter) return true;
                  const company = companies.find(c => c.id === companyFilter);
                  return company && company.name === companyName;
                })
                .sort(([companyA], [companyB]) => companyA.localeCompare(companyB))
                .map(([companyName, companyUsers]) => (
                  <div key={companyName} className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a]">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
                        <BuildingOfficeIcon className="h-5 w-5" />
                        {companyName} ({companyUsers.length} users)
                        {companyFilter && (
                          <button className="ml-4 text-xs text-blue-600 underline" onClick={() => setCompanyFilter(null)}>Clear filter</button>
                        )}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d437a]">
                        <thead className="bg-gray-50 dark:bg-[#1e3a5f]">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
                          {companyUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#1e3a5f]">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {user.avatar_url ? (
                                      <img
                                        src={user.avatar_url}
                                        alt={user.full_name || user.email || 'User'}
                                        className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-blue-100">
                                      {user.full_name || 'No name'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-blue-200">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'superadmin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  user.role === 'user' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}>
                                  {user.role || 'user'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-blue-200">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => {
                                    setSelectedUser(user);
                                    setIsUserModalOpen(true);
                }}
              >
                                  Edit
              </button>
                                <button
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  onClick={() => handleResendInvite(user.email)}
                                >
                                  Resend
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Companies Section */}
        {activeSection === 'companies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Company Management</h2>
                <p className="text-gray-600 dark:text-blue-100 text-sm">All companies on inCommand platform with comprehensive metrics</p>
              </div>
          <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
          >
                Add Company
          </button>
        </div>
        
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{companies.length}</div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Total Companies</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {companies.reduce((sum, company) => sum + users.filter(u => u.company_id === company.id).length, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Total Users</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {companies.reduce((sum, company) => sum + events.filter(e => e.company_id === company.id).length, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Total Events</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                  {companies.filter(company => (company.event_count || 0) > 0).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Active Companies</div>
              </div>
            </div>
            
            {/* Companies Table */}
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a]">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-200">All Companies</h3>
                <p className="text-sm text-gray-600 dark:text-blue-100">Companies sorted by activity and event count</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d437a]">
                  <thead className="bg-gray-50 dark:bg-[#1a2759]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Company Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Events</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#2d437a]">
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-blue-100">
                          No companies found
                        </td>
                      </tr>
                    ) : (
                      companies
                        .sort((a, b) => (b.event_count || 0) - (a.event_count || 0)) // Sort by event count descending
                        .map((company) => (
                        <tr
                          key={company.id}
                          className="hover:bg-gray-50 dark:hover:bg-[#1a2759] cursor-pointer"
                          onClick={() => {
                            setCompanyFilter(company.id);
                            setActiveSection('users');
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-blue-200">
                                {company.name}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-blue-200 font-mono">
                                ID: {company.id.substring(0, 8)}...
                              </div>
                              {(events.filter(e => e.company_id === company.id).length > 0) && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Active
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-blue-200">
                                {users.filter(u => u.company_id === company.id).length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-blue-100">
                                registered users
                              </div>
                              {(company.user_count || 0) > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                                     onClick={() => {
                                       setActiveSection('users');
                                       setCompanyFilter(company.id);
                                     }}>
                                  View users
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-blue-200">
                                {events.filter(e => e.company_id === company.id).length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-blue-100">
                                total events
                              </div>
                              {(company.event_count || 0) > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                                     onClick={() => {
                                       setActiveSection('events');
                                       setCompanyFilter(company.id);
                                     }}>
                                  View events
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 dark:text-blue-100">
                              {new Date(company.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-blue-200">
                              {new Date(company.created_at).toLocaleDateString() === new Date().toLocaleDateString() 
                                ? 'Today' 
                                : `${Math.floor((new Date().getTime() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedCompany(company);
                                  setIsCompanyModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => {
                                  console.log('View company details:', company.id)
                                  // Add view functionality
                                }}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-xs font-medium"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Events Section */}
        {activeSection === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Event Management</h2>
                <p className="text-gray-600 dark:text-blue-100 text-sm">All events grouped by company</p>
            </div>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{events.length}</div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Total Events</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {events.filter(event => event.event_type === 'Concert').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Concerts</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {events.filter(event => event.source_table === 'festival_events').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Festivals</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                  {events.filter(event => event.source_table === 'parade_events').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Parades</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-300">
                  {events.filter(event => event.source_table === 'corporate_events').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Corporate</div>
              </div>
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] p-4">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {events.filter(event => event.is_current).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-blue-100">Active Events</div>
              </div>
            </div>
            
            {/* Events grouped by company, but filtered if companyFilter is set */}
            {(companyFilter
              ? companies.filter(c => c.id === companyFilter)
              : companies
            ).map(company => {
              const companyEvents = events.filter(e => e.company_id === company.id);
              if (companyEvents.length === 0) return null;
              return (
                <div key={company.id} className="bg-white dark:bg-[#23408e] shadow-xl rounded-xl border border-gray-200 dark:border-[#2d437a] my-4">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a]">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
                      {company.name} ({companyEvents.length} events)
                      {companyFilter && (
                        <button className="ml-4 text-xs text-blue-600 underline" onClick={() => setCompanyFilter(null)}>Clear filter</button>
                      )}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d437a]">
                      <thead className="bg-gray-50 dark:bg-[#1a2759]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Event Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase tracking-wider">Venue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-[#2d437a]">
                        {companyEvents.map(event => (
                          <tr key={event.id}>
                            <td className="px-6 py-4">{event.event_name}</td>
                            <td className="px-6 py-4">{event.event_date || event.created_at}</td>
                            <td className="px-6 py-4">{event.event_type}</td>
                            <td className="px-6 py-4">{event.venue_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audit Logs Section */}
        {activeSection === 'audit' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Audit Logs</h2>
            
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
              {auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2d437a]">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Action</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Details</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 50).map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 dark:border-[#2d437a] hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors">
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{log.action}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.action_type === 'user' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              log.action_type === 'company' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              log.action_type === 'event' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-blue-100">{log.user?.full_name || log.performed_by}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-blue-100 max-w-xs truncate">{log.details}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-blue-100">
                            {new Date(log.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 dark:text-blue-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-blue-100">No audit logs available</p>
                  <p className="text-gray-500 dark:text-blue-300 text-sm mt-1">Audit logging may not be configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Platform Settings</h2>
            
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">System Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default User Role
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue={60}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Database Management</h3>
                  <div className="flex flex-wrap gap-4">
            <button 
              onClick={setupDatabase}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors duration-200"
            >
              Setup Database
            </button>
                    <button
                      onClick={() => fetchData()}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors duration-200"
                    >
                      Refresh All Data
            </button>
          </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">System Notifications</h2>
            
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-400 dark:text-blue-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-blue-100">Notification management coming soon</p>
                <p className="text-gray-500 dark:text-blue-300 text-sm mt-1">This section will allow you to manage system-wide notifications and alerts</p>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        {activeSection === 'support' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Support & Documentation</h2>
            
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
              <div className="text-center py-8">
                <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 dark:text-blue-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-blue-100">Admin support resources coming soon</p>
                <p className="text-gray-500 dark:text-blue-300 text-sm mt-1">This section will provide admin documentation and support tools</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Section */}
        {activeSection === 'billing' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Billing & Subscriptions</h2>
            
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6">
              <div className="text-center py-8">
                <CreditCardIcon className="h-12 w-12 text-gray-400 dark:text-blue-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-blue-100">Billing management coming soon</p>
                <p className="text-gray-500 dark:text-blue-300 text-sm mt-1">This section will provide subscription and billing management tools</p>
              </div>
            </div>
          </div>
        )}

        {/* Development Tracking Section - Super Admin Only */}
        {activeSection === 'development' && isSuperAdmin && (
          <div className="space-y-6">
            {/* Development Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Total Hours</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{devMetrics.total_hours.toFixed(1)}</span>
                <p className="text-sm text-gray-600 dark:text-blue-100">{devMetrics.sessions_count} sessions</p>
              </div>

              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Development Time Cost</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{devMetrics.total_dev_time_cost < 0 ? '-' : ''}£{Math.abs(devMetrics.total_dev_time_cost).toFixed(2)}</span>
                <p className="text-sm text-gray-600 dark:text-blue-100">Unpaid, tracked as negative (your time)</p>
              </div>

              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCardIcon className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Paid Out Costs</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{devMetrics.total_paid_out < 0 ? '-' : ''}£{Math.abs(devMetrics.total_paid_out).toFixed(2)}</span>
                <p className="text-sm text-gray-600 dark:text-blue-100">Expenses paid out (negative)</p>
              </div>

              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <ChartPieIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Total Investment</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{devMetrics.total_investment < 0 ? '-' : ''}£{Math.abs(devMetrics.total_investment).toFixed(2)}</span>
                <p className="text-sm text-gray-600 dark:text-blue-100">Total Investment (negative, sum of your time and paid out)</p>
              </div>
            </div>

            {/* Input Forms and Settings */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Log Development Session */}
                              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Log Development Session</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      value={newSession.category}
                      onChange={(e) => setNewSession(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    >
                      <option value="development">Development</option>
                      <option value="design">Design</option>
                      <option value="testing">Testing</option>
                      <option value="planning">Planning</option>
                      <option value="research">Research</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newSession.start_time}
                      onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newSession.end_time}
                      onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={newSession.description}
                    onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What did you work on?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Add Subscription */}
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Subscription</h3>
                {newSubscription.billing_period === 'yearly' && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Yearly Subscription:</strong> Adding a yearly subscription will automatically create both the yearly plan and a monthly equivalent (with 17% markup) to show the yearly savings advantage.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={newSubscription.service_name}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, service_name: e.target.value }))}
                      placeholder="e.g., Cursor Pro, ChatGPT Plus"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Period</label>
                    <select
                      value={newSubscription.billing_period}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, billing_period: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newSubscription.cost}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    />
                    {newSubscription.billing_period === 'yearly' && newSubscription.cost > 0 && (
                      <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">
                        Monthly equiv: £{(newSubscription.cost / 12).toFixed(2)}/month
                        <br />
                        Monthly plan will be: £{((newSubscription.cost / 12) * 1.17).toFixed(2)}/month (17% more)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newSubscription.start_date}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={newSubscription.description}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the service"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Save Button for Input Forms */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={saveAllData}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Save All Changes
              </button>
              <button
                onClick={fetchDevData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
              >
                Refresh Data
              </button>
              <button
                onClick={fixNegativeSessions}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
              >
                Fix Negative Sessions
              </button>
            </div>

            {/* Settings & Calculations */}
            <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Development & Pricing Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={devSettings.hourly_rate}
                    onChange={(e) => setDevSettings(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Subscription Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={devSettings.subscription_price_yearly}
                    onChange={(e) => {
                      const newYearlyPrice = parseFloat(e.target.value) || 0;
                      const newPricing = calculatePricing(newYearlyPrice);
                      setDevSettings(prev => ({ 
                        ...prev, 
                        ...newPricing
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">
                    Yearly equiv: £{(devSettings.subscription_price_yearly / 12).toFixed(2)}/month (15% savings vs monthly)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Subscription Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={devSettings.subscription_price_monthly}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">
                    Auto-calculated (Yearly ÷ 12 × 1.17) - 17% premium over yearly
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Subscribers</label>
                  <input
                    type="number"
                    value={devSettings.target_subscribers}
                    onChange={(e) => setDevSettings(prev => ({ ...prev, target_subscribers: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Tiered Pricing Display */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">6-Tier Per-Event Pricing Strategy</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <h5 className="font-semibold text-red-800 dark:text-red-200 mb-2 text-sm">Light (1-3/month)</h5>
                    <p className="text-lg font-bold text-red-900 dark:text-red-100">£{devSettings.per_event_price_light?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-red-600 dark:text-red-300 mb-2">Premium occasional rate</p>
                    <div className="text-xs text-red-700 dark:text-red-200 space-y-1">
                      <p><strong>Target:</strong> One-off events</p>
                      <p><strong>Strategy:</strong> High margin</p>
                      <p><strong>Convert:</strong> At 3+ events</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                    <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 text-sm">Casual (4-8/month)</h5>
                    <p className="text-lg font-bold text-orange-900 dark:text-orange-100">£{devSettings.per_event_price_casual?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 mb-2">Regular user rate</p>
                    <div className="text-xs text-orange-700 dark:text-orange-200 space-y-1">
                      <p><strong>Target:</strong> Small venues</p>
                      <p><strong>Strategy:</strong> Push subscription</p>
                      <p><strong>Convert:</strong> Monthly at 4 events</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">Regular (9-15/month)</h5>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">£{devSettings.per_event_price_regular?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">Standard business rate</p>
                    <div className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                      <p><strong>Target:</strong> Event companies</p>
                      <p><strong>Strategy:</strong> Subscription attractive</p>
                      <p><strong>Convert:</strong> Yearly plan</p>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm">Frequent (16-25/month)</h5>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">£{devSettings.per_event_price_frequent?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-green-600 dark:text-green-300 mb-2">Volume discount</p>
                    <div className="text-xs text-green-700 dark:text-green-200 space-y-1">
                      <p><strong>Target:</strong> Large venues</p>
                      <p><strong>Strategy:</strong> Retention focused</p>
                      <p><strong>Convert:</strong> Enterprise deals</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                    <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 text-sm">Enterprise (26+/month)</h5>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">£{devSettings.per_event_price_enterprise?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-300 mb-2">Best volume rate</p>
                    <div className="text-xs text-purple-700 dark:text-purple-200 space-y-1">
                      <p><strong>Target:</strong> Festivals, chains</p>
                      <p><strong>Strategy:</strong> Competitive pricing</p>
                      <p><strong>Convert:</strong> Custom contracts</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Arena Premium (20k+ capacity)</h5>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">£{devSettings.per_event_price_enterprise_arena?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Large venue premium</p>
                    <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                      <p><strong>Target:</strong> Arenas, stadiums</p>
                      <p><strong>Strategy:</strong> Premium for scale</p>
                      <p><strong>Convert:</strong> Multi-year deals</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <p><strong>Pricing Logic:</strong> Monthly subscription (£{devSettings.subscription_price_monthly?.toFixed(2)}) becomes attractive at 5 events. Yearly subscription (£{devSettings.subscription_price_yearly?.toFixed(2)}) offers 20% savings vs monthly.</p>
                </div>
              </div>

              {/* Subscriber Analysis Tool */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Subscriber Analysis - Set Your Projections</h4>
                
                {/* Subscription Customers */}
                <div className="mb-4">
                  <h5 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Subscription Customers</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Subscribers</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_monthly}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_monthly: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">£{devSettings.subscription_price_monthly}/month each</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Subscribers</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_yearly}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_yearly: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">£{devSettings.subscription_price_yearly}/year each</p>
                    </div>
                  </div>
                </div>

                {/* Per-Event Customers */}
                <div className="mb-4">
                  <h5 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Per-Event Customers</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">Light Users</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_light}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_light: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">£{devSettings.per_event_price_light?.toFixed(2)} × 2 events/month avg</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Casual Users</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_casual}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_casual: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">£{devSettings.per_event_price_casual?.toFixed(2)} × 6 events/month avg</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Regular Users</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_regular}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_regular: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">£{devSettings.per_event_price_regular?.toFixed(2)} × 12 events/month avg</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">Frequent Users</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_frequent}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_frequent: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">£{devSettings.per_event_price_frequent?.toFixed(2)} × 20 events/month avg</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Enterprise Users</label>
                      <input
                        type="number"
                        value={devSettings.subscribers_enterprise}
                        onChange={(e) => setDevSettings(prev => ({ ...prev, subscribers_enterprise: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">£{devSettings.per_event_price_enterprise?.toFixed(2)} × 30 events/month avg</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h5 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">Projected Monthly Revenue</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Monthly Subs:</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">£{(devSettings.subscribers_monthly * devSettings.subscription_price_monthly).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Yearly Subs:</p>
                      <p className="font-bold text-green-600 dark:text-green-400">£{(devSettings.subscribers_yearly * devSettings.subscription_price_yearly / 12).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Per-Event:</p>
                      <p className="font-bold text-orange-600 dark:text-orange-400">
                        £{((devSettings.subscribers_light * devSettings.per_event_price_light * 2) + 
                           (devSettings.subscribers_casual * devSettings.per_event_price_casual * 6) + 
                           (devSettings.subscribers_regular * devSettings.per_event_price_regular * 12) + 
                           (devSettings.subscribers_frequent * devSettings.per_event_price_frequent * 20) + 
                           (devSettings.subscribers_enterprise * devSettings.per_event_price_enterprise * 30)).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Total Monthly:</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                        £{((devSettings.subscribers_monthly * devSettings.subscription_price_monthly) + 
                           (devSettings.subscribers_yearly * devSettings.subscription_price_yearly / 12) + 
                           (devSettings.subscribers_light * devSettings.per_event_price_light * 2) + 
                           (devSettings.subscribers_casual * devSettings.per_event_price_casual * 6) + 
                           (devSettings.subscribers_regular * devSettings.per_event_price_regular * 12) + 
                           (devSettings.subscribers_frequent * devSettings.per_event_price_frequent * 20) + 
                           (devSettings.subscribers_enterprise * devSettings.per_event_price_enterprise * 30)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Profit Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
                  {/* Yearly Subscriber Profit */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Yearly Subscriber</h5>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">
                      £{(devSettings.subscription_price_yearly - devSettings.cost_per_customer_yearly).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {(((devSettings.subscription_price_yearly - devSettings.cost_per_customer_yearly) / devSettings.subscription_price_yearly) * 100).toFixed(1)}% margin
                    </p>
                  </div>

                  {/* Monthly Subscriber Profit */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Monthly Subscriber</h5>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      £{((devSettings.subscription_price_monthly * 12) - devSettings.cost_per_customer_yearly).toFixed(2)}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {((((devSettings.subscription_price_monthly * 12) - devSettings.cost_per_customer_yearly) / (devSettings.subscription_price_monthly * 12)) * 100).toFixed(1)}% margin
                    </p>
                  </div>

                  {/* Casual Per-Event User (6 events) */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                    <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Casual (6/month)</h5>
                    <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                      £{((devSettings.per_event_price_casual * 6 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 6 * 12)).toFixed(2)}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      {((((devSettings.per_event_price_casual * 6 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 6 * 12)) / (devSettings.per_event_price_casual * 6 * 12)) * 100).toFixed(1)}% margin
                    </p>
                  </div>

                  {/* Regular Per-Event User (12 events) */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Regular (12/month)</h5>
                    <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                      £{((devSettings.per_event_price_regular * 12 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 12 * 12)).toFixed(2)}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      {((((devSettings.per_event_price_regular * 12 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 12 * 12)) / (devSettings.per_event_price_regular * 12 * 12)) * 100).toFixed(1)}% margin
                    </p>
                  </div>

                  {/* Frequent Per-Event User (20 events) */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Frequent (20/month)</h5>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">
                      £{((devSettings.per_event_price_frequent * 20 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 20 * 12)).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {((((devSettings.per_event_price_frequent * 20 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 20 * 12)) / (devSettings.per_event_price_frequent * 20 * 12)) * 100).toFixed(1)}% margin
                    </p>
                  </div>

                  {/* Enterprise Per-Event User (30 events) */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Enterprise (30/month)</h5>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      £{((devSettings.per_event_price_enterprise * 30 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 30 * 12)).toFixed(2)}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      {((((devSettings.per_event_price_enterprise * 30 * 12) - devSettings.cost_per_customer_yearly - (devSettings.cost_per_event * 30 * 12)) / (devSettings.per_event_price_enterprise * 30 * 12)) * 100).toFixed(1)}% margin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Development Sessions */}
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Development Sessions</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {devSessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{session.description}</p>
                          <p className="text-sm text-gray-600 dark:text-blue-100">
                            {session.date} • {session.start_time} - {session.end_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">£{-1 * session.total_cost.toFixed(2)}</p>
                          <p className="text-sm text-gray-600 dark:text-blue-100">{session.duration_hours.toFixed(1)}h</p>
                        </div>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        session.category === 'development' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        session.category === 'design' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        session.category === 'testing' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        session.category === 'planning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {session.category}
                      </span>
                    </div>
                  ))}
                  {devSessions.length === 0 && (
                    <p className="text-gray-500 dark:text-blue-200 text-center py-8">No development sessions recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Active Subscriptions */}
              <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Active Subscriptions</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {subscriptionCosts.slice(0, 10).map((subscription) => (
                    <div key={subscription.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{subscription.service_name}</p>
                          <p className="text-sm text-gray-600 dark:text-blue-100">
                            Started: {subscription.start_date}
                          </p>
                          {subscription.description && (
                            <p className="text-xs text-gray-500 dark:text-blue-300 mt-1">{subscription.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{'-£' + Math.abs(subscription.cost).toFixed(2)}</p>
                          <p className="text-sm text-gray-600 dark:text-blue-100">{subscription.billing_period}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {subscriptionCosts.length === 0 && (
                    <p className="text-gray-500 dark:text-blue-200 text-center py-8">No subscriptions recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

                 {/* Non-Super Admin Message */}
         {activeSection === 'development' && !isSuperAdmin && (
           <div className="bg-white dark:bg-[#23408e] shadow-xl rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
             <div className="text-center">
               <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Access Restricted</h3>
               <p className="text-gray-600 dark:text-blue-100 mb-4">Development tracking is only available to super administrators.</p>
               <p className="text-sm text-gray-500 dark:text-blue-300 mb-4">
                 Current user: {currentUser?.email || 'Not loaded'}<br/>
                 Super admin status: {isSuperAdmin ? 'Yes' : 'No'}
               </p>
               <button
                 onClick={() => setIsSuperAdmin(true)}
                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
               >
                 Temporary Override (Debug)
               </button>
             </div>
           </div>
         )}

         {/* Pricing Calculator Section */}
         {activeSection === 'pricing' && (
           <EventPricingCalculator />
         )}

         {/* ...rest of the admin content... */}
        </div>
      </main>
    </div>
  )
}

export default AdminPage 