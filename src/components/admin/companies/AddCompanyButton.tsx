"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { getAllPlans, type PlanCode } from '@/config/PricingConfig';

export default function AddCompanyButton() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [plan, setPlan] = React.useState<PlanCode>('starter');
  const [status, setStatus] = React.useState<'active' | 'inactive'>('active');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const plans = getAllPlans();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subscription_plan: plan, account_status: status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create company');
      setOpen(false);
      setName("");
      setPlan('starter');
      setStatus('active');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Add Company</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-[#23408e] dark:text-white">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create Company</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Enter the new company&apos;s details.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Company name</label>
                <input
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Compact Security Services"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Subscription plan</label>
                  <select value={plan} onChange={(e) => setPlan(e.target.value as PlanCode)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white">
                    {plans.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[#2d437a]">Cancel</button>
                <button disabled={submitting} type="submit" className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm">
                  {submitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


