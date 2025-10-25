import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import MarketingNavigation from '@/components/MarketingNavigation';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default async function UpdatesPage() {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const changelog = fs.readFileSync(changelogPath, 'utf8');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <MarketingNavigation />
      
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              What&apos;s New at InCommand
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay up to date with the latest features, improvements, and updates across the InCommand platform.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <article className="prose prose-lg prose-slate max-w-none">
              <ReactMarkdown>{changelog}</ReactMarkdown>
            </article>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
