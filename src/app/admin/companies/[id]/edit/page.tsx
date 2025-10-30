"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function EditCompanyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [plan, setPlan] = React.useState<'trial' | 'basic' | 'premium'>('trial');
  const [status, setStatus] = React.useState<'active' | 'inactive'>('active');

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/companies/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setName(json.company.name);
        setPlan(json.company.subscription_plan || 'trial');
        setStatus(json.company.account_status || 'active');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/companies/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subscription_plan: plan, account_status: status })
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to save');
      return;
    }
    router.push(`/admin/companies/${params.id}`);
    router.refresh();
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a]">
      <h1 className="text-2xl font-bold mb-4">Edit Company</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Subscription plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white">
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
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
        <div className="flex justify-end gap-2">
          <a href={`/admin/companies/${params.id}`} className="px-3 py-2 rounded-md border border-gray-300 dark:border-[#2d437a]">Cancel</a>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
}




