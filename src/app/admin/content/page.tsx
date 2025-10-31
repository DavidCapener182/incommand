import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { 
  DocumentTextIcon, 
  NewspaperIcon,
  BookOpenIcon,
  MegaphoneIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import CreateContentButton from './CreateContentButton';
import NewContentDialog from '@/components/admin/content/NewContentDialog'
import Link from 'next/link'
import { sa_listBlogPosts, sa_getContentStats } from '@/hooks/useSuperAdmin';

export default async function ContentPage() {
  const { user, role } = await getServerUser();
  if (!user) redirect('/login');
  if (role !== 'superadmin') redirect('/admin');

  // Fetch real content data
  const [contentStats, blogPosts] = await Promise.all([
    sa_getContentStats(),
    sa_listBlogPosts()
  ]);

  // Transform blog posts for display
  const recentPosts = (blogPosts || []).slice(0, 10).map((post: any) => ({
    id: post.id,
    title: post.title,
    type: post.type || 'blog',
    status: post.status || 'draft',
    views: post.views || 0,
    publishedAt: post.published_at
  }));

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage blog posts, documentation, and announcements</p>
          </div>
          <CreateContentButton />
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentStats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <NewspaperIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Published</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentStats.publishedPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drafts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentStats.draftPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Views</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentStats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <NewspaperIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blog Posts</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Create and manage blog posts for company updates and insights.</p>
            <div className="flex gap-2">
              <Link href="/admin/content?type=blog" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">View All</Link>
              <NewContentDialog />
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documentation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Manage knowledge base articles and user documentation.</p>
            <div className="flex gap-2">
              <Link href="/admin/content?type=documentation" className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm">View All</Link>
              <NewContentDialog />
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center mb-4">
              <MegaphoneIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Announcements</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Create system-wide announcements and important updates.</p>
            <div className="flex gap-2">
              <Link href="/admin/content?type=announcement" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm">View All</Link>
              <NewContentDialog />
            </div>
          </div>
        </div>

        {/* Recent Content */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Content</h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white">
                <option value="">All Types</option>
                <option value="blog">Blog Posts</option>
                <option value="documentation">Documentation</option>
                <option value="announcement">Announcements</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white">
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post: any) => (
                    <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2a57]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {post.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No content found. Create your first blog post to get started.
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

