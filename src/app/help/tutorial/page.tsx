'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpenIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MapIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
  CpuChipIcon,
  ArrowUpIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- OPENAI AI COMPONENTS ---

const AIScenarioTrainer = () => {
  const [scenario, setScenario] = useState<string>('');
  const [userLog, setUserLog] = useState('');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'idle' | 'generating' | 'evaluating'>('idle');

  const generateScenario = async () => {
    setMode('generating');
    setLoading(true);
    setScenario('');
    setFeedback('');
    setUserLog('');

    try {
      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a training scenario generator for event operations. Generate realistic, brief incident scenarios for training purposes.'
            },
            {
              role: 'user',
              content: 'Generate a short, realistic incident scenario for a large music festival or stadium event. Examples: Lost child, minor medical issue, crowd congestion, or credential issue. Keep it under 2 sentences. Do not include the solution.'
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.8,
          max_tokens: 150
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate scenario');
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "Scenario generation failed.";
      setScenario(text);
    } catch (e) {
      setScenario("Failed to connect to training server.");
    } finally {
      setLoading(false);
      setMode('idle');
    }
  };

  const evaluateLog = async () => {
    if (!userLog.trim()) return;

    setMode('evaluating');
    setLoading(true);

    try {
      const prompt = `
        You are a strict Event Control Room Supervisor evaluating a trainee's incident log.
        
        Scenario: "${scenario}"
        Trainee's Log: "${userLog}"
        
        Evaluate based on these criteria:
        1. Factual & Objective (No emotions/opinions)
        2. Clarity (Who, What, Where, When, Actions Taken)
        3. Professionalism
        
        Provide a brief critique (2-3 sentences) and a score out of 10. Start with the score.
      `;

      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a strict Event Control Room Supervisor evaluating trainee incident logs. Be concise and professional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 300
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate');
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "Evaluation failed.";
      setFeedback(text);
    } catch (e) {
      setFeedback("Failed to evaluate log.");
    } finally {
      setLoading(false);
      setMode('idle');
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <SparklesIcon className="w-24 h-24 text-indigo-600" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">AI Trainer</span>
          <h3 className="font-bold text-gray-900 dark:text-white">Scenario Simulator</h3>
        </div>
        {!scenario ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Test your logging skills with AI-generated real-world scenarios.</p>
            <Button onClick={generateScenario} disabled={loading} className="gap-2">
              {loading ? 'Initializing...' : 'Start Training Session'} <PlayCircleIcon className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-[#15192c] p-4 rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Scenario</p>
              <p className="text-gray-900 dark:text-white font-medium">{scenario}</p>
            </div>
            {!feedback ? (
              <>
                <div>
                  <textarea
                    value={userLog}
                    onChange={(e) => setUserLog(e.target.value)}
                    placeholder="Type your incident log here (e.g., '14:05 - Medical incident reported at...')"
                    className="w-full h-24 rounded-xl border border-gray-200 dark:border-[#2d437a] p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-[#1a2a57] dark:text-white resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={evaluateLog} disabled={loading || !userLog.trim()} className="flex-1">
                    {loading ? 'Grading...' : 'Submit Log'}
                  </Button>
                  <Button variant="outline" onClick={generateScenario} disabled={loading}>
                    Skip <ArrowPathIcon className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 animate-in zoom-in-95">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-900 dark:text-green-100 text-sm mb-1">Supervisor Feedback</h4>
                    <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-line">{feedback}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
                  <Button onClick={generateScenario} variant="outline" size="sm" className="w-full bg-white dark:bg-[#15192c]">
                    Next Scenario
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SectionSummary = ({ text }: { text: string }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a tutorial summarizer. Create concise, impactful key takeaways from tutorial sections.'
            },
            {
              role: 'user',
              content: `Summarize this tutorial section into one single impactful "Key Takeaway" sentence for an event operator: ${text}`
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 100
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await res.json();
      const summaryText = data.choices?.[0]?.message?.content || "Summary unavailable.";
      setSummary(summaryText);
    } catch {
      setSummary("Could not generate summary.");
    } finally {
      setLoading(false);
    }
  };

  if (summary) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2 animate-in fade-in">
        <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span><strong>Key Takeaway:</strong> {summary}</span>
      </div>
    );
  }

  return (
    <button 
      onClick={handleSummarize} 
      disabled={loading}
      className="ml-auto p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      title="Generate AI Summary"
    >
      <SparklesIcon className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
    </button>
  );
};

// --- SECTION COMPONENT (UPDATED) ---

function Section({ id, title, icon: Icon, children, rawText }: { id: string; title: string; icon: any; children: React.ReactNode, rawText?: string }) {
  return (
    <section 
      id={id} 
      className="scroll-mt-24 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      <div className="bg-white dark:bg-[#1a2a57] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2d437a] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2d437a] bg-gray-50/50 dark:bg-[#15192c]/50 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{title}</h2>
          {/* AI Summarizer Button */}
          {rawText && <SectionSummary text={rawText} />}
        </div>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </section>
  );
}

// --- MAIN TUTORIAL PAGE ---

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('introduction');

  // Simple scroll spy effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' } 
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const menuItems = [
    { id: 'introduction', label: 'Introduction', icon: BookOpenIcon },
    { id: 'dashboard', label: 'Dashboard Overview', icon: PresentationChartLineIcon },
    { id: 'events', label: 'Event Management', icon: MapIcon },
    { id: 'incidents', label: 'Incident Management', icon: ExclamationTriangleIcon },
    { id: 'quickadd', label: 'Quick Add & AI', icon: SparklesIcon },
    { id: 'attendance', label: 'Attendance', icon: UserGroupIcon },
    { id: 'reports', label: 'Reports', icon: DocumentChartBarIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
    { id: 'mobile', label: 'Mobile View', icon: DevicePhoneMobileIcon },
    { id: 'support', label: 'Support', icon: QuestionMarkCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] font-sans pb-24">
      
      {/* Hero Header */}
      <div className="bg-[#23408e] text-white pt-10 pb-20 px-6 sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl animate-pulse delay-700" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-sm">
                <PlayCircleIcon className="w-4 h-4 text-yellow-300" />
                Training Module
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Platform Tutorial</h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                A complete guided walkthrough of InCommand&apos;s features, workflows, and best practices.
              </p>
            </div>
            <Button variant="secondary" asChild size="lg" className="hidden md:flex shadow-xl">
              <Link href="/help">
                Back to Help Center
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sticky Table of Contents */}
          <nav className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 bg-white dark:bg-[#1a2a57] rounded-2xl shadow-lg border border-gray-100 dark:border-[#2d437a] p-2 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2d437a] mb-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contents</h2>
              </div>
              <ul className="space-y-0.5">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <a 
                      href={`#${item.id}`}
                      className={`
                        group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${activeSection === item.id 
                          ? 'bg-[#23408e] text-white shadow-md' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#233566]'
                        }
                      `}
                    >
                      <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                      {item.label}
                      {activeSection === item.id && (
                        <ChevronRightIcon className="w-3 h-3 ml-auto text-white/70" />
                      )}
                    </a>
                </li>
              ))}
            </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-2">
            
            <Section 
              id="introduction" 
              title="Introduction" 
              icon={BookOpenIcon}
              rawText="InCommand is a comprehensive platform for live event control, combining incident logging, team coordination, analytics, and real‑time risk awareness."
            >
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  InCommand is a comprehensive platform for live event control, combining incident logging, team coordination,
                analytics, and real‑time risk awareness. This tutorial guides new users through the core features
                and operational best practices.
              </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="sm">
                  <Link href="/settings/events">Create Event</Link>
                </Button>
                  <Button asChild variant="secondary" size="sm">
                  <Link href="/incidents">Log Incident</Link>
                </Button>
                  <Button asChild variant="ghost" size="sm">
                  <Link href="/">View Dashboard</Link>
                </Button>
                </div>
              </div>
            </Section>

            <Section 
              id="dashboard" 
              title="Dashboard Overview" 
              icon={PresentationChartLineIcon}
              rawText="The dashboard provides a live operational picture. It aggregates data from all modules to give you immediate situational awareness. Keep filters minimal during peak operations."
            >
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The dashboard provides a <strong className="text-gray-900 dark:text-white">live operational picture</strong>. 
                It aggregates data from all modules to give you immediate situational awareness.
              </p>
              
              <div className="relative group cursor-pointer mb-6 rounded-xl overflow-hidden border border-gray-200 dark:border-[#2d437a] shadow-lg">
                <div className="aspect-video bg-gray-100 dark:bg-[#15192c] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <Image 
                    src="/assets/help/dashboard-overview.png" 
                    alt="Dashboard Interface showing widgets and charts" 
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full border border-white/20">
                    Figure 1.1: Main Command Dashboard
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 className="font-bold text-blue-800 dark:text-blue-200 text-sm mb-2 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" /> Best Practice
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Keep filters minimal during peak operations. Use the &quot;Critical Only&quot; toggle when incident volume is high to focus on priority 1 issues.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#1a2a57] p-4 rounded-xl border border-gray-100 dark:border-[#2d437a]">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">Key Metrics</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Active Incidents (Open/Pending)</li>
                    <li>Venue Occupancy %</li>
                    <li>High Priority Alerts</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section 
              id="incidents" 
              title="Incident Management" 
              icon={ExclamationTriangleIcon}
              rawText="The core of InCommand. Create, update, and resolve incidents with a complete audit trail. Always adhere to Green Guide standards when logging safety-critical issues."
            >
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The core of InCommand. Create, update, and resolve incidents with a complete audit trail.
              </p>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 mb-6">
                <div className="flex items-start gap-3">
                  <BookOpenIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm mb-1">Green Guide Integration</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      When selecting an incident type, the system provides concise best‑practice hints derived from the Green Guide. 
                      Look for the <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mx-1"></span> indicator for safety-critical guidance.
                    </p>
                    <a href="#" className="inline-block mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                      Open Green Guide Reference (PDF) →
                    </a>
                  </div>
                </div>
              </div>
              {/* NEW AI SCENARIO TRAINER */}
              <AIScenarioTrainer />
            </Section>

            <Section id="quickadd" title="Quick Add & AI Tools" icon={SparklesIcon} rawText="Natural Language Logging allows you to type or say logs in plain English, which the AI automatically categorizes and structures.">
              <div className="flex flex-col-reverse md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold mb-3">
                    <SparklesIcon className="w-3.5 h-3.5" /> AI Powered
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Natural Language Logging</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    Instead of filling out complex forms, simply type or say: <br/>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-[#15192c] p-1 rounded">&quot;Medical incident at Gate 4, male 40s chest pain, medic dispatched&quot;</span>.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    The AI will automatically:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4 list-disc list-inside">
                    <li>Categorize as &quot;Medical&quot;</li>
                    <li>Set location to &quot;Gate 4&quot;</li>
                    <li>Extract severity (High)</li>
                    <li>Parse details into structured fields</li>
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <Image 
                    src="/assets/help/quick-add.png" 
                    alt="AI Quick Add Demo" 
                    width={800}
                    height={450}
                    className="rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-md w-full" 
                  />
              </div>
              </div>
            </Section>

            <Section id="attendance" title="Attendance & Occupancy" icon={UserGroupIcon} rawText="Real-time capacity monitoring ensures compliance with safety regulations. Data can be ingested from manual clickers or automated counters.">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Real-time capacity monitoring ensures compliance with safety regulations. 
                Data can be ingested from manual clickers, turnstile APIs, or camera counters.
              </p>
              <div className="bg-white dark:bg-[#15192c] border border-gray-200 dark:border-[#2d437a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Venue Capacity</span>
                  <span className="text-xs font-bold text-green-600">82% (Safe)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">12,450</div>
                    <div className="text-gray-500">In Venue</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">450</div>
                    <div className="text-gray-500">Last 15m</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">15,000</div>
                    <div className="text-gray-500">Capacity</div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Other Sections (Simplified for brevity but maintaining style) */}
            <Section id="reports" title="Reports" icon={DocumentChartBarIcon}>
              <p className="text-gray-600 dark:text-gray-300">
                Generate post-event reports (PDF/CSV) that comply with licensing authorities. 
                Includes automated summary statistics, incident heatmaps, and full chronologies.
              </p>
            </Section>

            <Section id="settings" title="Settings" icon={Cog6ToothIcon}>
              <p className="text-gray-600 dark:text-gray-300">
                Configure your organization profile, manage user roles, customize incident types, and set up notification preferences.
              </p>
            </Section>

            <Section id="mobile" title="Mobile View" icon={DevicePhoneMobileIcon}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-[#15192c] rounded-full">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Field-Ready Design</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    The platform is fully responsive. Field teams can log incidents, view tasks, and receive alerts on any smartphone without installing an app. Offline mode syncs data once connection is restored.
                  </p>
                </div>
              </div>
            </Section>

            <Section id="support" title="Support & Contact" icon={QuestionMarkCircleIcon}>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Need operational assistance?</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-6">
                  Our support team is available 24/7 for critical event issues.
                </p>
                <div className="flex justify-center gap-3">
                  <Button size="sm">Contact Support</Button>
                  <Button variant="secondary" size="sm">System Status</Button>
                </div>
              </div>
            </Section>

          </main>
        </div>
      </div>
      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <a
          href="#"
          className="flex items-center justify-center bg-[#23408e] text-white p-3 md:px-5 md:py-3 rounded-full shadow-2xl hover:bg-blue-800 hover:scale-105 transition-all group"
        >
          <span className="hidden md:inline font-bold mr-2">Quick Help</span>
          <ArrowUpIcon className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}
