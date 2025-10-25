import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import { PageWrapper } from '@/components/layout/PageWrapper';
import MarketingNavigation from '@/components/MarketingNavigation';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default async function UpdatesPage() {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const changelog = fs.readFileSync(changelogPath, 'utf8');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white text-blue-900">
      <MarketingNavigation />
      <PageWrapper>
        <section className="max-w-4xl mx-auto py-20 px-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#23408e] mb-4">What&apos;s New at InCommand</h1>
          <p className="text-blue-700 mb-10 text-lg">See the latest improvements, enhancements, and fixes across the InCommand platform.</p>
          <article className="prose prose-blue max-w-none">
            <ReactMarkdown>{changelog}</ReactMarkdown>
          </article>
        </section>
      </PageWrapper>
      <MarketingFooter />
    </div>
  );
}
