import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeOpenIcon,
  PhoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { getServerUser } from '@/lib/auth/getServerUser';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';

type QuoteStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'lost';
type ActivityType = 'call' | 'email' | 'meeting' | 'demo';
type ActivityStatus = 'pending' | 'completed';
type CampaignStatus = 'active' | 'planning' | 'completed';

type QuoteRecord = {
  id: string;
  companyName: string;
  contactName: string;
  stage: QuoteStage;
  status: QuoteStatus;
  monthlyEstimate: number;
  annualEstimate: number;
  probability: number;
  featureAddOns: string[];
  createdAt: string;
  updatedAt: string;
};

type CampaignRecord = {
  id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  budget: number;
  spendToDate: number;
  leadsGenerated: number;
  conversions: number;
};

type ActivityRecord = {
  id: string;
  type: ActivityType;
  owner: string;
  company: string;
  contact: string;
  dueDate: string;
  status: ActivityStatus;
  notes?: string;
};

type CrmDashboardData = {
  quotes: QuoteRecord[];
  campaigns: CampaignRecord[];
  activities: ActivityRecord[];
};

type RawRecord = Record<string, unknown>;

function isSupabaseClient(value: unknown): value is SupabaseClient<Database> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'from' in value &&
    typeof (value as { from?: unknown }).from === 'function'
  );
}

const DEFAULT_QUOTES: QuoteRecord[] = [
  {
    id: 'quote-001',
    companyName: 'Metro Events Group',
    contactName: 'Samantha Lee',
    stage: 'negotiation',
    status: 'sent',
    monthlyEstimate: 4800,
    annualEstimate: 57600,
    probability: 65,
    featureAddOns: ['AI Insights', 'Advanced Analytics'],
    createdAt: '2024-01-11T09:30:00Z',
    updatedAt: '2024-02-18T15:42:00Z',
  },
  {
    id: 'quote-002',
    companyName: 'Lakeside Venues',
    contactName: 'Jordan Smith',
    stage: 'proposal',
    status: 'draft',
    monthlyEstimate: 3200,
    annualEstimate: 38400,
    probability: 45,
    featureAddOns: ['Mobile Ops Toolkit'],
    createdAt: '2024-02-05T11:10:00Z',
    updatedAt: '2024-02-16T09:15:00Z',
  },
  {
    id: 'quote-003',
    companyName: 'Summit Live Productions',
    contactName: 'Priya Nair',
    stage: 'qualified',
    status: 'sent',
    monthlyEstimate: 5600,
    annualEstimate: 67200,
    probability: 35,
    featureAddOns: ['Incident Command Center', 'Vendor Accreditation'],
    createdAt: '2024-02-12T14:22:00Z',
    updatedAt: '2024-02-17T18:05:00Z',
  },
];

const DEFAULT_CAMPAIGNS: CampaignRecord[] = [
  {
    id: 'campaign-001',
    name: 'Spring Venue Modernisation',
    channel: 'Email Nurture',
    status: 'active',
    budget: 15000,
    spendToDate: 6200,
    leadsGenerated: 54,
    conversions: 11,
  },
  {
    id: 'campaign-002',
    name: 'Arena Safety Webinar Series',
    channel: 'Webinar',
    status: 'planning',
    budget: 9000,
    spendToDate: 1200,
    leadsGenerated: 18,
    conversions: 3,
  },
  {
    id: 'campaign-003',
    name: 'AI Operations Launch',
    channel: 'Paid Social',
    status: 'completed',
    budget: 12000,
    spendToDate: 11800,
    leadsGenerated: 76,
    conversions: 19,
  },
];

const DEFAULT_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'activity-001',
    type: 'demo',
    owner: 'Alex Martinez',
    company: 'Metro Events Group',
    contact: 'Samantha Lee',
    dueDate: '2024-02-21',
    status: 'pending',
    notes: 'Finalize integration walkthrough and pricing review.',
  },
  {
    id: 'activity-002',
    type: 'call',
    owner: 'Jamie Chen',
    company: 'Summit Live Productions',
    contact: 'Priya Nair',
    dueDate: '2024-02-20',
    status: 'completed',
    notes: 'Shared AI insights one-pager and confirmed next steps.',
  },
  {
    id: 'activity-003',
    type: 'email',
    owner: 'Alex Martinez',
    company: 'Lakeside Venues',
    contact: 'Jordan Smith',
    dueDate: '2024-02-19',
    status: 'pending',
    notes: 'Send tailored onboarding plan with staffing module overview.',
  },
];

function isPlainObject(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStage(value: unknown): QuoteStage {
  if (typeof value !== 'string') return 'lead';
  const normalised = value.toLowerCase() as QuoteStage;
  const allowed: QuoteStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  return allowed.includes(normalised) ? normalised : 'lead';
}

function parseQuoteStatus(value: unknown): QuoteStatus {
  if (typeof value !== 'string') return 'draft';
  const normalised = value.toLowerCase() as QuoteStatus;
  const allowed: QuoteStatus[] = ['draft', 'sent', 'accepted', 'lost'];
  return allowed.includes(normalised) ? normalised : 'draft';
}

function parseActivityType(value: unknown): ActivityType {
  if (typeof value !== 'string') return 'call';
  const normalised = value.toLowerCase() as ActivityType;
  const allowed: ActivityType[] = ['call', 'email', 'meeting', 'demo'];
  return allowed.includes(normalised) ? normalised : 'call';
}

function parseActivityStatus(value: unknown): ActivityStatus {
  if (typeof value !== 'string') return 'pending';
  const normalised = value.toLowerCase() as ActivityStatus;
  const allowed: ActivityStatus[] = ['pending', 'completed'];
  return allowed.includes(normalised) ? normalised : 'pending';
}

function parseCampaignStatus(value: unknown): CampaignStatus {
  if (typeof value !== 'string') return 'planning';
  const normalised = value.toLowerCase() as CampaignStatus;
  const allowed: CampaignStatus[] = ['active', 'planning', 'completed'];
  return allowed.includes(normalised) ? normalised : 'planning';
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function parseString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return fallback;
}

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function normaliseQuote(raw: unknown, fallbackId: string): QuoteRecord {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_QUOTES[0], id: fallbackId };
  }

  const featureAddOns = ensureArray(raw.feature_add_ons ?? raw.featureAddOns);
  const createdAt = parseString(raw.created_at ?? raw.createdAt, new Date().toISOString());
  const updatedAt = parseString(raw.updated_at ?? raw.updatedAt, createdAt);

  return {
    id: parseString(raw.id, fallbackId) || fallbackId,
    companyName: parseString(raw.company_name ?? raw.companyName, 'Unknown Company'),
    contactName: parseString(raw.contact_name ?? raw.contactName, 'Unknown Contact'),
    stage: parseStage(raw.stage),
    status: parseQuoteStatus(raw.status),
    monthlyEstimate: parseNumber(raw.monthly_estimate ?? raw.monthlyEstimate),
    annualEstimate: parseNumber(raw.annual_estimate ?? raw.annualEstimate),
    probability: Math.min(Math.max(parseNumber(raw.probability, 25), 0), 100),
    featureAddOns,
    createdAt,
    updatedAt,
  };
}

function normaliseCampaign(raw: unknown, fallbackId: string): CampaignRecord {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_CAMPAIGNS[0], id: fallbackId };
  }

  return {
    id: parseString(raw.id, fallbackId) || fallbackId,
    name: parseString(raw.name, 'Untitled Campaign'),
    channel: parseString(raw.channel, 'Unknown'),
    status: parseCampaignStatus(raw.status),
    budget: parseNumber(raw.budget, 0),
    spendToDate: parseNumber(raw.spend_to_date ?? raw.spendToDate, 0),
    leadsGenerated: Math.max(0, Math.round(parseNumber(raw.leads_generated ?? raw.leadsGenerated, 0))),
    conversions: Math.max(0, Math.round(parseNumber(raw.conversions, 0))),
  };
}

function normaliseActivity(raw: unknown, fallbackId: string): ActivityRecord {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_ACTIVITIES[0], id: fallbackId };
  }

  return {
    id: parseString(raw.id, fallbackId) || fallbackId,
    type: parseActivityType(raw.type),
    owner: parseString(raw.owner, 'Unassigned'),
    company: parseString(raw.company, 'Unknown Company'),
    contact: parseString(raw.contact, 'Unknown Contact'),
    dueDate: parseString(raw.due_date ?? raw.dueDate, new Date().toISOString().slice(0, 10)),
    status: parseActivityStatus(raw.status),
    notes: raw.notes && typeof raw.notes === 'string' ? raw.notes : undefined,
  };
}

async function loadCrmData(): Promise<CrmDashboardData> {
  const { role, supabase } = await getServerUser();
  if (role !== 'superadmin') {
    return { quotes: [], campaigns: [], activities: [] };
  }

  const supabaseClient = isSupabaseClient(supabase) ? supabase : null;

  const safeSelect = async (table: string): Promise<unknown[]> => {
    try {
      if (!supabaseClient) return [];
      const { data } = await supabaseClient.from(table as any).select('*');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`CRM dashboard: falling back to defaults for ${table} due to`, error);
      return [];
    }
  };

  const [rawQuotes, rawCampaigns, rawActivities] = await Promise.all([
    safeSelect('crm_quotes'),
    safeSelect('crm_campaigns'),
    safeSelect('crm_activities'),
  ]);

  const quotes = (rawQuotes.length > 0 ? rawQuotes : DEFAULT_QUOTES).map((item, index) =>
    normaliseQuote(item, `quote-${index + 1}`),
  );
  const campaigns = (rawCampaigns.length > 0 ? rawCampaigns : DEFAULT_CAMPAIGNS).map((item, index) =>
    normaliseCampaign(item, `campaign-${index + 1}`),
  );
  const activities = (rawActivities.length > 0 ? rawActivities : DEFAULT_ACTIVITIES).map((item, index) =>
    normaliseActivity(item, `activity-${index + 1}`),
  );

  return { quotes, campaigns, activities };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatProbability(value: number): string {
  return `${Math.round(value)}%`;
}

export default async function CrmPage() {
  const { user, role } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  const { quotes, campaigns, activities } = await loadCrmData();

  const totalPipeline = quotes.reduce((total, quote) => total + quote.annualEstimate, 0);
  const weightedPipeline = quotes.reduce((total, quote) => total + quote.annualEstimate * (quote.probability / 100), 0);
  const averageDealSize = quotes.length > 0 ? totalPipeline / quotes.length : 0;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;

  const stageDistribution = quotes.reduce<Record<QuoteStage, number>>(
    (acc, quote) => ({ ...acc, [quote.stage]: (acc[quote.stage] ?? 0) + 1 }),
    { lead: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 },
  );

  const upcomingActivities = activities.filter((activity) => activity.status === 'pending');
  const completedActivities = activities.filter((activity) => activity.status === 'completed');

  return (
    <SuperAdminLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue &amp; CRM Intelligence</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Track pipeline performance, marketing impact, and sales execution across every venue operator account.
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
          >
            <ArrowPathIcon className="mr-2 h-5 w-5" /> Sync CRM Data
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Pipeline</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPipeline)}</p>
              </div>
              <CurrencyDollarIcon className="h-10 w-10 text-blue-500" />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-200">
              Weighted impact: {formatCurrency(weightedPipeline)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Deal Size</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(averageDealSize)}</p>
              </div>
              <ArrowTrendingUpIcon className="h-10 w-10 text-indigo-500" />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-200">
              Based on {quotes.length} active opportunities
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Campaigns</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{activeCampaigns}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-emerald-500" />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-200">
              Marketing programs currently influencing pipeline
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Next Actions</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{upcomingActivities.length}</p>
              </div>
              <ClockIcon className="h-10 w-10 text-amber-500" />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-200">
              {completedActivities.length} activities completed this week
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Pipeline</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Monitor velocity across the end-to-end venue acquisition funnel.
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {quotes.length} opportunities
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {(Object.entries(stageDistribution) as [QuoteStage, number][]).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-gray-200"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">{stage}</p>
                    <p className="mt-3 text-2xl font-bold">{count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{count === 1 ? 'Opportunity' : 'Opportunities'}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                        Stage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                        Estimate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                        Probability
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="bg-white text-sm dark:bg-[#23408e]">
                        <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900 dark:text-white">
                          <div>{quote.companyName}</div>
                          <p className="text-xs text-gray-500 dark:text-gray-300">{quote.contactName}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 capitalize text-gray-700 dark:text-gray-200">{quote.stage}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-gray-200">Revenue Ops</td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-gray-200">
                          {formatCurrency(quote.annualEstimate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-gray-200">
                          {formatProbability(quote.probability)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-500 dark:text-gray-300">
                          {new Date(quote.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marketing Programs</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Campaign performance with clear ROI attribution across the buyer journey.
                  </p>
                </div>
                <Link
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Manage campaigns
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {campaigns.map((campaign) => {
                  const progress = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spendToDate / campaign.budget) * 100)) : 0;
                  return (
                    <div key={campaign.id} className="rounded-lg border border-gray-200 p-4 dark:border-[#2d437a]">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-300">
                            {campaign.channel} · {campaign.status}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {campaign.conversions} conversions · {campaign.leadsGenerated} leads
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-[#1a2a57]">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-300">
                          <span>Spend {formatCurrency(campaign.spendToDate)}</span>
                          <span>Budget {formatCurrency(campaign.budget)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Action Centre</h2>
                <span className="flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  <CheckCircleIcon className="mr-1 h-4 w-4" /> {completedActivities.length} done
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Prioritised outreach to keep every prospective partner moving forward.
              </p>

              <ul className="mt-6 space-y-4">
                {activities.map((activity) => {
                  const iconMap: Record<ActivityType, JSX.Element> = {
                    call: <PhoneIcon className="h-5 w-5 text-blue-500" />,
                    email: <EnvelopeOpenIcon className="h-5 w-5 text-indigo-500" />,
                    meeting: <UserGroupIcon className="h-5 w-5 text-purple-500" />,
                    demo: <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />,
                  };

                  return (
                    <li key={activity.id} className="rounded-lg border border-gray-200 p-4 dark:border-[#2d437a]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1a2a57]">
                          {iconMap[activity.type]}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {activity.company}
                                <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                                  {activity.type}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{activity.contact}</p>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                              Due {new Date(activity.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          {activity.notes ? (
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">{activity.notes}</p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                                activity.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
                              }`}
                            >
                              {activity.status}
                            </span>
                            <button
                              type="button"
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                            >
                              Open record
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2d437a] dark:bg-[#23408e]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Revenue Copilot</h2>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  Beta
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Intelligent forecasting blends marketing signals, pipeline health, and operations readiness to surface the most
                winnable opportunities.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>• Weighted pipeline confidence: {formatProbability((weightedPipeline / Math.max(totalPipeline, 1)) * 100)}</li>
                <li>• Next best action: Prioritise <strong>{upcomingActivities[0]?.company ?? 'new outreach'}</strong> with a guided demo.</li>
                <li>• Campaign attribution: {activeCampaigns} programs influencing current top-of-funnel activity.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminLayout>
  );
}
