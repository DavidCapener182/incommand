'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { 
  CalculatorIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  account_code: string;
  description: string;
  amount: number;
  currency: string;
}

interface LedgerMetrics {
  totalCredits: number;
  totalDebits: number;
  outstandingInvoices: number;
  paymentFailures: number;
  net: number;
}

interface LedgerData {
  entries: LedgerEntry[];
  metrics: LedgerMetrics;
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function AccountingLedgerPage() {
  const [ledgerData, setLedgerData] = useState<LedgerData>({
    entries: [],
    metrics: {
      totalCredits: 0,
      totalDebits: 0,
      outstandingInvoices: 0,
      paymentFailures: 0,
      net: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      router.replace('/login');
      return;
    }
    if (role !== 'superadmin') {
      setLoading(false);
      router.replace('/admin');
      return;
    }

    async function loadLedgerData() {
      try {
        // For superadmin, we might need to pass an organizationId or handle differently
        const res = await fetch('/api/accounting/ledger?organizationId=all');
        if (res.ok) {
          const data = await res.json();
          setLedgerData(data);
        }
      } catch (error) {
        console.error('Failed to fetch ledger data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLedgerData();
  }, [authLoading, user, role, router]);

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading ledger data...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounting Ledger</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage ledger entries, credits, debits, and financial transactions</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/accounting/ledger/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Entry
            </Link>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export
            </button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{ledgerData.metrics.totalCredits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Debits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{ledgerData.metrics.totalDebits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  ledgerData.metrics.net >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  £{ledgerData.metrics.net.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{ledgerData.metrics.outstandingInvoices.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ledger Entries</h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white">
                <option value="">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                {ledgerData.entries.length > 0 ? (
                  ledgerData.entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2a57]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.type === 'credit'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                        {entry.account_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {entry.description}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        entry.type === 'credit'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {entry.type === 'credit' ? '+' : '-'}£{Number(entry.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 uppercase">
                        {entry.currency || 'GBP'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No ledger entries found. Create your first entry to get started.
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
