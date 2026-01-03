'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  InformationCircleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CloudIcon,
  PencilIcon,
  SunIcon,
  TableCellsIcon,
  PlusIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PlayCircleIcon,
  LightBulbIcon,
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

// --- OPENAI AI COMPONENT ---

const AIOpsAssistant = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');

    // Construct context from glossary items to ground the AI
    const context = glossaryItems.map(i => `${i.title}: ${i.description}`).join('\n');
    const systemPrompt = `
      You are an expert Event Operations Manager and Trainer for a large venue.
      You are helping a staff member who needs operational guidance or definition clarification.
      
      Use the following Platform Glossary as your knowledge base:
      ${context}
      
      Key Guidelines:
      1. If they describe an incident (e.g., "fight", "fire", "medical"), tell them exactly what to log in the "Headline", "Facts", and "Actions" fields based on the Structured Template.
      2. Emphasize JESIP/JDM principles (Joint Decision Making, Shared Awareness) if relevant.
      3. Keep answers concise, professional, and actionable. Use bullet points.
      4. If the question is simple (e.g. "What is Ejection?"), just define it clearly.
    `;

    try {
      // Use OpenAI API instead of Gemini
      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          model: 'gpt-4o-mini', // Using a cost-effective model
          temperature: 0.7,
          max_tokens: 500
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "Unable to generate advice. Please consult your supervisor.";
      setResponse(text);
    } catch (e) {
      setResponse("Connection to Ops Command failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-[#23408e] rounded-3xl shadow-2xl p-1 overflow-hidden">
      <div className="bg-white/10 backdrop-blur-lg rounded-[22px] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 text-white">
          <div className="p-2 bg-yellow-400/20 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-yellow-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Ops Command AI</h3>
            <p className="text-blue-200 text-sm">Ask for operational guidance or clarifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'I have a report of a lost child at Gate 3. How should I log this?' or 'What does JESIP mean?'"
              className="w-full h-24 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-400 p-4 text-sm shadow-inner resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAsk();
                }
              }}
            />
            <div className="absolute bottom-3 right-3">
              <button 
                onClick={handleAsk}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 bg-[#23408e] hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
              >
                {loading ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : (
                  <>
                    Analyze & Advise <SparklesIcon className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {response && (
            <div className="bg-white rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-[#23408e] flex-shrink-0 mt-1" />
                <div className="prose prose-sm prose-blue max-w-none">
                  <p className="text-gray-800 whitespace-pre-line leading-relaxed font-medium">{response}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Helper for accordion toggle
  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const getExpandedContent = (title: string) => {
    const contentMap: { [key: string]: React.ReactNode } = {
      'Incident': (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p><strong>Definition:</strong> An event or occurrence that requires reporting or action, such as an ejection, medical issue, or security concern.</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Common Types</p>
            <div className="flex flex-wrap gap-2">
              {['Medical', 'Security', 'Ejection', 'Equipment Failure', 'Weather'].map(t => (
                <span key={t} className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>Must be logged with strict timestamps and actions taken.</span>
          </div>
        </div>
      ),
      'Ejection': (
        <div className="space-y-3">
          <p><strong>Definition:</strong> The act of removing a person from the venue due to rule violations or safety concerns.</p>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Critical Steps</p>
            <ul className="space-y-2">
              {[
                'Document specific reason for ejection',
                'Record person details (if available)',
                'Note level of resistance/cooperation',
                'Log IDs of all security staff involved'
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
      'Venue Occupancy': (
        <div className="space-y-3">
          <p><strong>Definition:</strong> Real-time tracking of people count for safety compliance.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <span className="font-bold text-blue-800 block mb-1">Methods</span>
              Scanning, Clickers, Overhead Cameras
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <span className="font-bold text-amber-800 block mb-1">Safety</span>
              Automated threshold alerts at 80%, 90%, 100% capacity.
            </div>
          </div>
        </div>
      ),
    };
    
    return contentMap[title] || (
      <div className="text-sm text-gray-600">
        <p>Detailed documentation and operational procedures regarding <strong>{title}</strong>.</p>
        <p className="mt-2 text-xs text-gray-500">Please refer to the detailed operational manual for specific protocols.</p>
      </div>
    );
  };

  // Filter glossary based on search
  const filteredGlossary = glossaryItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] font-sans pb-24">
        
      {/* Hero Header */}
      <div className="bg-[#23408e] text-white pt-10 pb-20 px-6 sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl animate-pulse delay-700" />
          
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-sm">
                <LightBulbIcon className="w-4 h-4 text-yellow-300" />
                Knowledge Base
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Help Center & Operational Glossary</h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Master the platform with definitions, standards, and operational guidance designed for high-pressure environments.
              </p>
            </div>
            <Button variant="secondary" asChild size="lg" className="hidden md:flex shadow-xl">
                <Link href="/help/tutorial">
                  Start Interactive Tutorial
                </Link>
              </Button>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 space-y-10">
          
        {/* AI Assistant Section */}
        <AIOpsAssistant />

        {/* Feature Cards Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Capabilities</h2>
            </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FeatureCard 
                icon={ExclamationTriangleIcon} 
                title="Incident Tracking" 
              desc="Report and track incidents in real time with detailed, timestamped logging."
              color="text-amber-500"
              bg="bg-amber-50"
              delay="0"
              />
              <FeatureCard 
                icon={UsersIcon} 
                title="Occupancy & Safety" 
              desc="Monitor venue capacity, flow rates, and safety density metrics live." 
              color="text-blue-500"
              bg="bg-blue-50"
              delay="100"
              />
              <FeatureCard 
                icon={DocumentTextIcon} 
                title="Automated Reporting" 
              desc="Generate JESIP-compliant post-event reports instantly." 
              color="text-green-500"
              bg="bg-green-50"
              delay="200"
              />
              <FeatureCard 
                icon={ChartBarIcon} 
              title="Analytics Engine" 
              desc="Data-driven insights for staffing deployment and decision making." 
              color="text-purple-500"
              bg="bg-purple-50"
              delay="300"
              />
              <FeatureCard 
                icon={CloudIcon} 
              title="Cloud Synchronization" 
              desc="Secure, real-time database updates across all devices via Supabase." 
              color="text-sky-500"
              bg="bg-sky-50"
              delay="400"
              />
              <FeatureCard 
                icon={LockClosedIcon} 
                title="Secure Access" 
              desc="Role-based authentication, audit logging, and data encryption." 
              color="text-indigo-500"
              bg="bg-indigo-50"
              delay="500"
              />
            </div>
          </div>

        {/* Logging Standards - Enhanced Visuals */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logging Standards</h2>
            </div>

          <div className="bg-white dark:bg-[#1a2a57] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2d437a] overflow-hidden">
            {/* Banner */}
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#15192c] dark:to-[#1a2a57] p-6 border-b border-gray-100 dark:border-[#2d437a]">
              <div className="flex items-start gap-5">
                <div className="hidden sm:flex h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                  <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-serif italic">
                      &ldquo;If it ain&apos;t written down, it didn&apos;t happen.&rdquo;
                    </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-3xl">
                      Incident logs are legal documents. They may be used in licensing reviews, investigations, or court. 
                    Adhering to these standards ensures your logs are <strong>defensible</strong>, <strong>professional</strong>, and <strong>accurate</strong>.
                    </p>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-[#2d437a]">
                
                {/* Left: The Template */}
              <div className="p-6 md:p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" /> 
                  Structured Template
                  </h3>
                <div className="space-y-4">
                  <TemplateField 
                    label="Headline" 
                    desc="≤15 words, factual summary" 
                    example="Medical incident at North Gate - person collapsed" 
                    delay="0"
                  />
                  <TemplateField 
                    label="Source" 
                    desc="Who/what reported it" 
                    example="R3, CCTV, Security Team" 
                    delay="100"
                  />
                  <TemplateField 
                    label="Facts" 
                    desc="Objective observations only" 
                    example="15:03 - Person collapsed. Crowd of ~20 present." 
                    delay="200"
                  />
                  <TemplateField 
                    label="Actions" 
                    desc="What was done & by whom" 
                    example="R3 called medical. Area cordoned off." 
                    delay="300"
                  />
                  <TemplateField 
                    label="Outcome" 
                    desc="Current status/result" 
                    example="Transported to medical tent. Incident closed." 
                    delay="400"
                  />
                  </div>
                </div>

                {/* Right: Language Guide */}
              <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-[#15192c]/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <PencilSquareIcon className="h-5 w-5 text-blue-500" /> 
                  Language Guidelines
                  </h3>
                  
                <div className="space-y-8">
                  <div className="bg-white dark:bg-[#1a2a57] p-5 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-bold mb-4 uppercase tracking-wider">
                      <CheckCircleIcon className="h-4 w-4" /> Best Practice
                      </span>
                    <ul className="space-y-3">
                      <GuidelineItem type="good" text="Specific times" example="15:03" />
                      <GuidelineItem type="good" text="Exact locations" example="North Gate Turnstile 2" />
                      <GuidelineItem type="good" text="Measurable facts" example="approx. 3 meters" />
                      </ul>
                    </div>

                  <div className="bg-white dark:bg-[#1a2a57] p-5 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold mb-4 uppercase tracking-wider">
                      <ExclamationTriangleIcon className="h-4 w-4" /> Avoid
                      </span>
                    <ul className="space-y-3">
                      <GuidelineItem type="bad" text="Emotional words" example="Chaotic, Terrible" />
                      <GuidelineItem type="bad" text="Opinions" example="I think, Unfortunately" />
                      <GuidelineItem type="bad" text="Vague terms" example="Huge, A while ago" />
                      </ul>
                  </div>
                </div>
              </div>

              </div>
            </div>
          </div>

        {/* Glossary Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Glossary</h2>
              </div>
              
            {/* Animated Search Bar */}
            <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                placeholder="Search definitions..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#2d437a] rounded-xl bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm group-hover:shadow-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGlossary.length > 0 ? (
                filteredGlossary.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  title={item.title}
                  icon={getIconComponent(item.icon)}
                  isOpen={openAccordion === `item-${idx}`}
                  onClick={() => toggleAccordion(`item-${idx}`)}
                >
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.description}</p>
                              {getExpandedContent(item.title)}
                  </div>
                </AccordionItem>
                ))
              ) : (
              <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-[#1a2a57] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2d437a]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-[#233566] mb-4">
                  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search terms.</p>
                <button 
                    onClick={() => setSearchTerm('')}
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Clear search
                </button>
                </div>
              )}
            </div>
          </div>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS & HELPERS ---

const FeatureCard = ({ icon: Icon, title, desc, color, bg, delay }: any) => (
  <div 
    className={`flex items-start p-5 rounded-2xl bg-white dark:bg-[#1a2a57] border border-gray-100 dark:border-[#2d437a] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`flex-shrink-0 mr-4 p-3 rounded-xl ${bg} dark:bg-opacity-10`}>
      <Icon className={`h-6 w-6 ${color}`} />
    </div>
    <div>
      <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const TemplateField = ({ label, desc, example, delay }: any) => (
  <div 
    className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 pb-4 border-b border-gray-100 dark:border-[#2d437a] last:border-0 last:pb-0"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[80px] pt-0.5">{label}</span>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{desc}</p>
      <div className="inline-block px-2 py-1 bg-gray-100 dark:bg-[#15192c] rounded text-xs text-blue-600 dark:text-blue-400 font-mono">
        &quot;{example}&quot;
      </div>
    </div>
  </div>
);

const GuidelineItem = ({ type, text, example }: any) => (
  <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
    <span className={`mt-0.5 font-bold ${type === 'good' ? 'text-green-500' : 'text-red-500'}`}>
      {type === 'good' ? '✓' : '✕'}
    </span>
    <div>
      <span className="font-medium mr-1">{text}</span>
      <span className="text-gray-400 dark:text-gray-500">(&quot;{example}&quot;)</span>
    </div>
  </li>
);

const AccordionItem = ({ title, children, isOpen, onClick, icon }: any) => (
  <div className="border border-gray-200 dark:border-[#2d437a] rounded-xl bg-white dark:bg-[#1a2a57] overflow-hidden transition-all duration-200 hover:border-blue-300">
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 text-left bg-white dark:bg-[#1a2a57] hover:bg-gray-50 dark:hover:bg-[#233566] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-[#233566] text-gray-500 dark:text-gray-400'}`}>
          {icon}
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
      </div>
      <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <div 
      className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
    >
      <div className="p-4 pt-0 border-t border-gray-100 dark:border-[#2d437a] bg-gray-50/50 dark:bg-[#15192c]/50">
        <div className="pt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const getIconComponent = (iconName: string) => {
  const iconClass = "h-5 w-5";
  switch (iconName) {
    case 'report_problem': return <ExclamationTriangleIcon className={iconClass} />;
    case 'logout': return <ArrowRightOnRectangleIcon className={iconClass} />;
    case 'people': return <UsersIcon className={iconClass} />;
    case 'dashboard': return <HomeIcon className={iconClass} />;
    case 'description': return <DocumentTextIcon className={iconClass} />;
    case 'analytics': return <ChartBarIcon className={iconClass} />;
    case 'cloud': return <CloudIcon className={iconClass} />;
    case 'edit': return <PencilIcon className={iconClass} />;
    case 'wb_sunny': return <SunIcon className={iconClass} />;
    case 'table_chart': return <TableCellsIcon className={iconClass} />;
    case 'add_alert': return <PlusIcon className={iconClass} />;
    case 'event': return <CalendarDaysIcon className={iconClass} />;
    case 'settings': return <Cog6ToothIcon className={iconClass} />;
    case 'lock': return <LockClosedIcon className={iconClass} />;
    case 'api': return <CpuChipIcon className={iconClass} />;
    case 'clock': return <ClockIcon className={iconClass} />;
    case 'pencil': return <PencilSquareIcon className={iconClass} />;
    case 'shield': return <ShieldCheckIcon className={iconClass} />;
    case 'eye': return <EyeIcon className={iconClass} />;
    default: return <InformationCircleIcon className={iconClass} />;
  }
};

const glossaryItems = [
  { title: 'Incident', icon: 'report_problem', description: 'An event or occurrence that requires reporting or action, such as an ejection, medical issue, or security concern.' },
  { title: 'Ejection', icon: 'logout', description: 'The act of removing a person from the venue due to rule violations or safety concerns.' },
  { title: 'Venue Occupancy', icon: 'people', description: 'The number of people currently present in the venue, tracked for safety and compliance.' },
  { title: 'Dashboard', icon: 'dashboard', description: 'The main interface where users can view analytics, reports, and current event status.' },
  { title: 'Report', icon: 'description', description: 'A summary or detailed account of incidents, analytics, or other relevant data.' },
  { title: 'Analytics', icon: 'analytics', description: 'Statistical and visual representations of incidents, trends, and other key metrics.' },
  { title: 'Supabase', icon: 'cloud', description: 'The backend service used for authentication, database, and API management in this app.' },
  { title: 'Signature', icon: 'edit', description: 'A digital signature collected for verification or authorization purposes.' },
  { title: 'Weather Card', icon: 'wb_sunny', description: 'A component displaying current weather information relevant to the event or venue.' },
  { title: 'Incident Table', icon: 'table_chart', description: 'A table listing all reported incidents with details and status.' },
  { title: 'Incident Creation Modal', icon: 'add_alert', description: 'A popup form for reporting new incidents.' },
  { title: 'Event Creation Modal', icon: 'event', description: 'A popup form for creating new events in the system.' },
  { title: 'Settings', icon: 'settings', description: 'A section where users can configure their preferences and account details.' },
  { title: 'Authentication', icon: 'lock', description: 'The process of verifying user identity to access the app.' },
  { title: 'API', icon: 'api', description: 'Application Programming Interface, used for communication between the frontend and backend.' },
  { title: 'Contemporaneous Logging', icon: 'clock', description: 'Logging incidents in real-time as they occur, providing the most accurate and legally defensible records.' },
  { title: 'Retrospective Logging', icon: 'pencil', description: 'Logging incidents after a delay, requiring justification for the timing difference.' },
  { title: 'Amendment', icon: 'edit', description: 'A non-destructive correction to an existing log entry, preserving the original while tracking changes.' },
  { title: 'Audit Trail', icon: 'shield', description: 'Complete record of all changes to log entries, including who made changes and when.' },
  { title: 'JESIP', icon: 'shield', description: 'Joint Emergency Services Interoperability Principles - UK standards for emergency service coordination.' },
  { title: 'JDM', icon: 'shield', description: 'Joint Doctrine Manual - Professional standards for incident management and documentation.' },
  { title: 'Structured Template', icon: 'description', description: 'Professional logging format with specific fields: Headline, Source, Facts, Actions, and Outcome.' },
  { title: 'Factual Language', icon: 'eye', description: 'Objective, verifiable statements without opinions, emotions, or speculation.' },
];

export default HelpPage;