'use client'
import React from 'react';
import Link from 'next/link';
import { CardContainer } from '@/components/ui/CardContainer';
import { Button } from '@/components/ui/button';
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const guideCategories = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of using inCommand',
    icon: PlayIcon,
    guides: [
      {
        title: 'Creating Your First Incident',
        description: 'Step-by-step guide to logging your first incident',
        link: '/help/tutorial',
        duration: '5 min read'
      },
      {
        title: 'Understanding the Dashboard',
        description: 'Navigate and understand your command center',
        link: '/help',
        duration: '3 min read'
      },
      {
        title: 'Setting Up Your Profile',
        description: 'Configure your account and preferences',
        link: '/settings',
        duration: '2 min read'
      }
    ]
  },
  {
    title: 'Incident Management',
    description: 'Master professional incident logging',
    icon: DocumentTextIcon,
    guides: [
      {
        title: 'Using Structured Logging',
        description: 'Learn the professional logging template',
        link: '/help',
        duration: '10 min read'
      },
      {
        title: 'Best Practices for Incident Reports',
        description: 'Write court-ready, professional logs',
        link: '/help',
        duration: '8 min read'
      },
      {
        title: 'Managing Incident Status',
        description: 'Update, escalate, and close incidents',
        link: '/incidents',
        duration: '5 min read'
      }
    ]
  },
  {
    title: 'Analytics & Reporting',
    description: 'Generate insights and reports',
    icon: AcademicCapIcon,
    guides: [
      {
        title: 'Understanding Analytics Dashboards',
        description: 'Navigate the analytics interface',
        link: '/analytics',
        duration: '7 min read'
      },
      {
        title: 'Generating End-of-Event Reports',
        description: 'Create comprehensive event summaries',
        link: '/analytics',
        duration: '6 min read'
      },
      {
        title: 'Exporting Data',
        description: 'Export reports in various formats',
        link: '/analytics',
        duration: '4 min read'
      }
    ]
  },
  {
    title: 'AI Features',
    description: 'Leverage AI-powered assistance',
    icon: BookOpenIcon,
    guides: [
      {
        title: 'Using the AI Assistant',
        description: 'Get intelligent help and insights',
        link: '/help',
        duration: '5 min read'
      },
      {
        title: 'AI-Powered Incident Suggestions',
        description: 'Let AI help you write better reports',
        link: '/help',
        duration: '6 min read'
      },
      {
        title: 'Understanding AI Usage Limits',
        description: 'Track and manage your AI usage',
        link: '/settings/ai-usage',
        duration: '3 min read'
      }
    ]
  }
];

const quickLinks = [
  {
    title: 'Complete User Guide',
    description: 'Comprehensive documentation covering all features',
    link: '/help',
    icon: BookOpenIcon,
    badge: 'Full Guide'
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    link: 'https://www.youtube.com/incommand',
    icon: VideoCameraIcon,
    badge: 'External',
    external: true
  },
  {
    title: 'API Documentation',
    description: 'Developer resources and API reference',
    link: '/help',
    icon: DocumentTextIcon,
    badge: 'For Developers'
  }
];

export default function UserGuidesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          User Guides & Documentation
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Learn how to use inCommand effectively with our comprehensive guides and tutorials
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((link, idx) => (
          <CardContainer key={idx} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                <link.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{link.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#1a2a57] text-gray-600 dark:text-gray-400 rounded">
                    {link.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{link.description}</p>
                {link.external ? (
                  <a 
                    href={link.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Visit <ArrowRightIcon className="h-4 w-4" />
                  </a>
                ) : (
                  <Link 
                    href={link.link}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Guide <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </CardContainer>
        ))}
      </div>

      {/* Guide Categories */}
      {guideCategories.map((category, categoryIdx) => (
        <CardContainer key={categoryIdx} className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
              <category.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">{category.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.guides.map((guide, guideIdx) => (
              <div 
                key={guideIdx}
                className="p-4 border border-gray-200 dark:border-[#2d437a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{guide.title}</h3>
                  <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{guide.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-500">{guide.duration}</span>
                  <Link 
                    href={guide.link}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Read <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>
      ))}

      {/* Support Section */}
      <CardContainer className="p-6 bg-blue-50 dark:bg-[#1a2a57] border-blue-200 dark:border-[#2d437a]">
        <div className="flex items-center gap-3 mb-4">
          <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Need More Help?</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Can&apos;t find what you&apos;re looking for? Our support team is here to help.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/settings/support">
            <Button variant="primary">
              Contact Support
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="outline">
              Browse Help Center
            </Button>
          </Link>
        </div>
      </CardContainer>
    </div>
  );
}

