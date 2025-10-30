"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function CreateContentButton() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<'blog' | 'documentation' | 'announcement'>('blog');
  const [status, setStatus] = React.useState<'draft' | 'published'>('draft');
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, status, content })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create content');
      setOpen(false);
      setTitle("");
      setContent("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create content');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
        Create Content
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg dark:bg-[#23408e] dark:text-white">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create Content</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white">
                    <option value="blog">Blog</option>
                    <option value="documentation">Documentation</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Content</label>
                <textarea className="w-full h-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-[#2d437a] dark:bg-[#1a2a57] dark:text-white" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your content here..." />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[#2d437a]">Cancel</button>
                <button disabled={submitting} type="submit" className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm">{submitting ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


