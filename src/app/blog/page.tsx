'use client'

import { useState } from 'react'
import { BlogModal } from '@/components/modals/BlogModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, CirclePlay, Calendar, ClockIcon as Clock } from 'lucide-react'
import Link from 'next/link'

const categories = [
  {
    name: 'Best Practices',
    totalPosts: 2,
    icon: '📋',
  },
  {
    name: 'Event Safety',
    totalPosts: 1,
    icon: '🛡️',
  },
  {
    name: 'Technology',
    totalPosts: 0,
    icon: '💻',
  },
  {
    name: 'Operations',
    totalPosts: 0,
    icon: '⚙️',
  },
]

const posts = [
  {
    title: 'Incident Management: Lessons from Large-Scale Events',
    excerpt: 'Drawing from decades of experience managing major festivals and public events, we explore the critical systems and processes that separate successful operations from crisis situations.',
    category: 'Best Practices',
    categoryColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    date: '22 October 2025',
    readTime: '12 min read',
    image: '🎪',
    author: 'David Capener',
    content: (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed">
          Over 15 years managing security and safety operations at major UK festivals and public events has taught me one fundamental truth: <strong>if it isn&apos;t written down, it didn&apos;t happen.</strong>
        </p>
        <p>
          This principle underpins every aspect of professional incident management. Whether you&apos;re responding to a medical emergency, managing an ejection, or coordinating with emergency services, the quality of your documentation directly impacts outcomes—not just during the event, but in licensing reviews, investigations, and sometimes court proceedings.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">The Reality of Large-Scale Operations</h2>
        <p>
          When you&apos;re managing thousands of attendees, multiple simultaneous incidents, and coordinating teams across a sprawling venue, paper logs and radio calls alone aren&apos;t enough. Modern event management demands systems that can keep pace with the complexity.
        </p>
        <p>
          I&apos;ve seen control rooms where incident logs were scrawled on whiteboards, where radio traffic was lost to memory, and where post-event debriefs relied on incomplete recollections. These aren&apos;t sustainable approaches for professional operations—and they certainly won&apos;t hold up under scrutiny.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Essential Systems for Success</h2>
        <h3 className="text-xl font-semibold mt-6 mb-3">1. Real-Time Contemporaneous Logging</h3>
        <p>
          Incidents must be logged <em>as they happen</em>. Not after the event, not at shift changeover, but in real-time with accurate timestamps. This creates legally defensible records and ensures critical information isn&apos;t lost to the chaos of operations.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2. Structured Templates</h3>
        <p>
          Consistency matters. Every incident log should follow a standardized structure: headline, source, facts observed, actions taken, and outcome. This ensures nothing is missed and makes records easy to review during investigations.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3. Complete Audit Trails</h3>
        <p>
          Every change, every amendment, every update must be tracked with full attribution and timestamps. Original entries are never deleted—they&apos;re preserved with amendments layered transparently above them.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4. Multi-Agency Coordination</h3>
        <p>
          JESIP principles aren&apos;t just guidelines—they&apos;re essential frameworks for coordinating with police, ambulance, fire, and other services. Your systems must support Joint Decision Making (JDM) and shared situational awareness.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Practical Lessons Learned</h2>
        <p>
          The difference between a well-managed incident and a catastrophic failure often comes down to preparation and systems. Here are the lessons that shaped how I approach event operations:
        </p>

        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Predictable patterns emerge:</strong> Certain incident types cluster around specific times and locations. Data reveals these patterns if you&apos;re capturing it properly.</li>
          <li><strong>Response times matter:</strong> Even small delays compound. Automated notifications and clear assignment workflows save critical minutes.</li>
          <li><strong>Staff need the right tools:</strong> If your team is struggling with complex interfaces during high-pressure situations, you&apos;re already behind.</li>
          <li><strong>Debriefs drive improvement:</strong> Post-event analysis only works if you have complete, accurate data to review.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">Why InCommand Exists</h2>
        <p>
          After years of managing events with inadequate tools—cobbled-together spreadsheets, paper logs, disconnected systems—I built InCommand to solve these problems properly. It&apos;s the system I wish I&apos;d had from day one: mobile-first, legally compliant, and designed by someone who&apos;s actually stood in the control room during a crisis.
        </p>
        <p>
          Professional event management isn&apos;t about reacting to chaos—it&apos;s about having systems that help you anticipate, respond, and continuously improve. That&apos;s what InCommand delivers.
        </p>
      </div>
    ),
  },
  {
    title: 'How Real-Time Data Transforms Crowd Safety',
    excerpt: 'The shift from reactive to proactive crowd management through intelligent data collection, analysis, and predictive modeling.',
    category: 'Event Safety',
    categoryColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    date: '15 October 2025',
    readTime: '10 min read',
    image: '📊',
    author: 'David Capener',
    content: (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed">
          Traditional crowd management has always been reactive: incidents happen, teams respond, logs are written. But what if you could identify problems <em>before</em> they become critical? Real-time data analytics is fundamentally changing how we approach crowd safety.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">From Reactive to Predictive</h2>
        <p>
          For most of my career in event operations, we relied on experience and instinct. A seasoned control room operator can sense when a crowd is getting restless, when a particular area is becoming overcrowded, or when weather conditions are about to create problems. But human judgment has limits—especially when managing thousands of attendees across multiple zones.
        </p>
        <p>
          Real-time data collection changes the equation. By capturing every incident with precise timestamps, locations, and classifications, we create datasets that reveal patterns invisible to even the most experienced operators.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">What the Data Reveals</h2>
        <h3 className="text-xl font-semibold mt-6 mb-3">Temporal Patterns</h3>
        <p>
          Certain incident types cluster predictably around specific times. Medical incidents spike during peak heat hours. Ejections increase as alcohol consumption rises. Queue-related complaints concentrate at entry and food service points. When you have the data, you can pre-position resources instead of scrambling to respond.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Spatial Hotspots</h3>
        <p>
          Heatmaps reveal problem areas that aren&apos;t obvious from ground level. That bottleneck near the toilets, the sightline issue causing crowding, the poorly lit area where security incidents cluster—data makes these visible. You can address venue design issues, adjust staff positioning, and improve signage based on evidence rather than guesswork.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Correlation Insights</h3>
        <p>
          Weather data correlated with incident types shows which conditions create which problems. Crowd density metrics reveal thresholds where minor incidents escalate. Staff response times highlight gaps in coverage. These correlations inform better planning for future events.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Practical Applications</h2>
        <p>
          This isn&apos;t theoretical—these are changes you can implement immediately:
        </p>

        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Dynamic resource allocation:</strong> Move staff to emerging hotspots before incidents occur.</li>
          <li><strong>Proactive communications:</strong> Alert attendees about queue times, weather changes, or crowd density before frustration builds.</li>
          <li><strong>Evidence-based planning:</strong> Use historical data to inform staffing levels, layout decisions, and contingency plans.</li>
          <li><strong>Real-time dashboards:</strong> Give control room operators and senior management immediate visibility of developing situations.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">The Technology Stack</h2>
        <p>
          Making this work requires more than just collecting data—you need systems that process, analyze, and present insights in real-time without overwhelming operators. InCommand&apos;s architecture handles this by:
        </p>

        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Capturing structured incident data with GPS coordinates and timestamps</li>
          <li>Analyzing patterns using AI and machine learning models</li>
          <li>Presenting insights through intuitive dashboards and alerts</li>
          <li>Enabling rapid response through automated notifications and assignment workflows</li>
        </ul>

        <p className="mt-6">
          The future of crowd safety isn&apos;t just better technology—it&apos;s smarter use of the data we&apos;re already creating. Real-time analytics transforms incident logs from liability protection into strategic intelligence that keeps events safer.
        </p>
      </div>
    ),
  },
  {
    title: 'Why JESIP Standards Matter in Modern Control Rooms',
    excerpt: 'Understanding Joint Emergency Services Interoperability Principles and their application to event management and incident logging.',
    category: 'Best Practices',
    categoryColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    date: '1 October 2025',
    readTime: '9 min read',
    image: '🚨',
    author: 'David Capener',
    content: (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed">
          JESIP—Joint Emergency Services Interoperability Principles—emerged from tragic failures in multi-agency coordination during major incidents. For event managers, understanding and applying these principles isn&apos;t just about compliance; it&apos;s about building systems that work seamlessly with police, fire, ambulance, and other emergency services when seconds matter.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">What JESIP Actually Is</h2>
        <p>
          JESIP provides standardized frameworks for how different emergency services coordinate during incidents. It emerged after investigations into events like the 7/7 London bombings and various multi-agency responses revealed critical communication and coordination failures.
        </p>
        <p>
          The core principles are deceptively simple: co-locate command teams, share situational awareness, make joint decisions, communicate effectively, and maintain clear command structures. In practice, these principles demand specific processes and documentation standards.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Why Event Managers Should Care</h2>
        <p>
          When a serious incident occurs at your event, you&apos;ll be coordinating with emergency services. The quality of that coordination directly impacts outcomes. If your incident logs don&apos;t meet professional standards, if your staff can&apos;t provide clear situational reports, if your documentation isn&apos;t compatible with emergency service requirements—you&apos;re creating friction when efficiency matters most.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Practical Application: Documentation Standards</h2>
        <p>
          JESIP-compliant incident logging follows structured formats that emergency services recognize and trust:
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">The Structured Template</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Headline (≤15 words):</strong> Brief, factual summary</li>
          <li><strong>Source:</strong> Who/what reported the incident</li>
          <li><strong>Facts Observed:</strong> Objective observations only</li>
          <li><strong>Actions Taken:</strong> What was done and by whom</li>
          <li><strong>Outcome:</strong> Current status or final result</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Language Requirements</h3>
        <p>
          Factual, objective language without opinions, emotions, or speculation. Specific times, locations, and quantities. Direct observations rather than interpretations. This isn&apos;t pedantry—it&apos;s the difference between admissible evidence and inadmissible hearsay.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Joint Decision Making (JDM)</h2>
        <p>
          JDM is JESIP&apos;s framework for collaborative decision-making during incidents. Rather than siloed command structures where police, fire, ambulance, and event management operate independently, JDM establishes shared situational awareness and collective decision-making.
        </p>
        <p>
          For event control rooms, this means:
        </p>

        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Maintaining real-time incident logs that can be shared instantly with emergency services</li>
          <li>Using standardized language and formats for situational reports</li>
          <li>Documenting decisions with clear attribution and reasoning</li>
          <li>Establishing communication protocols that work across organizations</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">The Audit Trail Requirement</h2>
        <p>
          JESIP compliance demands complete audit trails: who reported what, when actions were taken, who made decisions, what information was available at each decision point. This isn&apos;t bureaucracy—it&apos;s essential for post-incident investigations and continuous improvement.
        </p>
        <p>
          Modern systems like InCommand build these audit trails automatically. Every log entry is timestamped and attributed. Amendments are tracked non-destructively. Original entries are preserved even when corrections are made. The complete chain of events is maintained for review.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Implementing JESIP in Your Operations</h2>
        <p>
          Practical steps for JESIP-aligned event management:
        </p>

        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li><strong>Train your team</strong> on structured logging templates and factual language requirements</li>
          <li><strong>Use systems</strong> that enforce professional documentation standards</li>
          <li><strong>Establish protocols</strong> for sharing incident data with emergency services</li>
          <li><strong>Conduct post-event reviews</strong> using complete audit trails</li>
          <li><strong>Maintain records</strong> meeting legal retention requirements (typically 7 years)</li>
        </ol>

        <p className="mt-6">
          JESIP standards aren&apos;t obstacles to efficient operations—they&apos;re frameworks that improve coordination, accountability, and outcomes. Implementing them properly means building systems and training teams to maintain professional standards even during high-pressure situations. That&apos;s what separates amateur event operations from professional, safety-focused organizations.
        </p>
      </div>
    ),
  },
]

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="min-h-[80vh] flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 px-6 py-12">
          <div>
            <Badge
              variant="secondary"
              className="rounded-full py-1 border-border bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
              asChild
            >
              <Link href="#">
                Latest insights & updates <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Badge>
            <h1 className="mt-6 max-w-[17ch] text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-semibold leading-[1.2] tracking-tighter text-gray-900 dark:text-white">
              Insights from the Field
            </h1>
            <p className="mt-6 max-w-[60ch] sm:text-lg text-gray-600 dark:text-gray-300">
              Real-world lessons, practical guidance, and professional perspectives on event management and safety operations. Learn from decades of experience managing major festivals and public events.
            </p>
            <div className="mt-12 flex items-center gap-4">
              <Button 
                size="lg" 
                className="rounded-full text-base bg-[#2A3990] hover:bg-[#1e2a6a] text-white"
              >
                Explore Articles <ArrowUpRight className="h-5 w-5 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full text-base shadow-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <CirclePlay className="h-5 w-5 mr-2" /> Watch Demo
              </Button>
            </div>
          </div>
          <div className="w-full aspect-video bg-gradient-to-br from-[#4361EE] to-[#23408e] rounded-xl flex items-center justify-center text-white text-6xl shadow-2xl">
            📚
          </div>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-7xl mx-auto py-10 lg:py-16 px-6 xl:px-0 flex flex-col lg:flex-row items-start gap-12">
        <div className="flex-1">
          <div className="space-y-12">
            {posts.map((post, index) => (
              <Card
                key={post.title}
                className="flex flex-col sm:flex-row sm:items-center shadow-none overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 py-0 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                <div className="shrink-0 aspect-video grow sm:w-56 sm:aspect-square bg-gradient-to-br from-[#4361EE] to-[#23408e] rounded-lg flex items-center justify-center text-6xl">
                  {post.image}
                </div>
                <CardContent className="px-0 sm:px-6 py-6 flex flex-col">
                  <div className="flex items-center gap-6">
                    <Badge className={`bg-primary/5 text-primary hover:bg-primary/5 shadow-none ${post.categoryColor}`}>
                      {post.category}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground line-clamp-3 text-ellipsis">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-6 text-muted-foreground text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> {post.readTime}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> {post.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <aside className="sticky top-8 shrink-0 lg:max-w-sm w-full">
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Categories</h3>
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-2">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between gap-2 bg-muted p-3 rounded-md bg-opacity-15 dark:bg-opacity-25"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                </div>
                <Badge className="px-1.5 rounded-full bg-foreground/7 text-foreground">
                  {category.totalPosts}
                </Badge>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Blog Modal */}
      {selectedPost && (
        <BlogModal
          isOpen={true}
          onClose={() => setSelectedPost(null)}
          title={selectedPost.title}
          author={selectedPost.author}
          date={selectedPost.date}
          readTime={selectedPost.readTime}
          content={selectedPost.content}
          image={selectedPost.image}
        />
      )}
    </div>
  )
}
