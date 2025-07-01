'use client'
import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create my first event?",
    answer: "Navigate to the dashboard and click 'Create Event'. Fill in the event details including name, date, venue, and timing. Make sure to set the appropriate security level and staff requirements."
  },
  {
    category: "Getting Started", 
    question: "How do I assign callsigns to my team?",
    answer: "Go to the Callsign Assignment page from the main navigation. You can either manually assign callsigns or use our automatic assignment system based on roles and experience levels."
  },
  {
    category: "Incident Management",
    question: "How do I log an incident during an event?",
    answer: "From the main dashboard during an active event, click 'Log Incident'. Select the incident type, provide details, and add any relevant location information. The system will automatically timestamp and track the incident."
  },
  {
    category: "Incident Management",
    question: "Can I add photos or attachments to incident reports?",
    answer: "Yes, when creating or editing an incident, you can attach photos, documents, and other relevant files. These are securely stored and accessible to authorized team members."
  },
  {
    category: "Analytics",
    question: "How do I generate end-of-event reports?",
    answer: "After ending an event, go to the Analytics page and select 'End of Event Report'. This will generate a comprehensive PDF including incident summaries, performance metrics, and recommendations."
  },
  {
    category: "Analytics",
    question: "What insights does the AI analytics provide?",
    answer: "Our AI analyzes incident patterns, predicts potential issues, and provides recommendations for staffing and resource allocation based on historical data and current event parameters."
  },
  {
    category: "Account & Billing",
    question: "How do I upgrade my subscription?",
    answer: "Contact our support team to discuss upgrading your plan. We offer various tiers including enhanced AI features, increased storage, and priority support."
  },
  {
    category: "Account & Billing",
    question: "How is my data protected?",
    answer: "We use enterprise-grade encryption, regular security audits, and comply with GDPR and data protection regulations. Your data is stored securely and never shared with third parties."
  },
  {
    category: "Technical",
    question: "Why is the app running slowly?",
    answer: "Slow performance can be due to poor internet connection, browser cache issues, or high server load. Try refreshing the page, clearing your browser cache, or switching to a different browser."
  },
  {
    category: "Technical",
    question: "The app isn't working on my mobile device. What should I do?",
    answer: "Ensure you're using a modern browser (Chrome, Safari, Firefox) and that JavaScript is enabled. The app is optimized for mobile but some features work best on tablets or desktop."
  }
];

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];
  const filteredFAQ = selectedCategory === 'All' ? faqData : faqData.filter(item => item.category === selectedCategory);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Support Center</h1>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a] hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Live Chat Support</h2>
            </div>
            <p className="text-gray-600 dark:text-blue-100 mb-4 text-sm">
              Get instant help from our support team during business hours (9 AM - 6 PM GMT).
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Start Live Chat
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a] hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-[#1a2a57] rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Email Support</h2>
            </div>
            <p className="text-gray-600 dark:text-blue-100 mb-4 text-sm">
              Send us detailed questions and we'll respond within 24 hours.
            </p>
            <a 
              href="mailto:support@incommand.app" 
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors block text-center"
            >
              support@incommand.app
            </a>
          </div>
        </div>

        {/* Emergency Support */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Emergency Support</h2>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-3 text-sm">
            For critical issues during live events that require immediate assistance:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="tel:+441234567890" 
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <PhoneIcon className="h-4 w-4" />
              Emergency Hotline: +44 123 456 7890
            </a>
            <span className="text-red-600 dark:text-red-400 text-sm self-center">Available 24/7 during active events</span>
          </div>
        </div>

        {/* Help Resources */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">Help Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a 
              href="/help" 
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#2d437a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors"
            >
              <BookOpenIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">User Guide</div>
                <div className="text-xs text-gray-500 dark:text-blue-300">Complete documentation</div>
              </div>
            </a>

            <a 
              href="#video-tutorials" 
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#2d437a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors"
            >
              <VideoCameraIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">Video Tutorials</div>
                <div className="text-xs text-gray-500 dark:text-blue-300">Step-by-step guides</div>
              </div>
            </a>

            <a 
              href="#" 
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#2d437a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">API Docs</div>
                <div className="text-xs text-gray-500 dark:text-blue-300">Developer resources</div>
              </div>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
          <div className="flex items-center gap-3 mb-6">
            <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Frequently Asked Questions</h2>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-[#1a2a57] text-gray-700 dark:text-blue-200 hover:bg-gray-200 dark:hover:bg-[#2d437a]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {filteredFAQ.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-[#2d437a] rounded-lg">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === `${index}` ? null : `${index}`)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a2a57] transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{item.question}</span>
                  <span className="text-gray-400 dark:text-blue-300 ml-2">
                    {expandedFAQ === `${index}` ? '−' : '+'}
                  </span>
                </button>
                {expandedFAQ === `${index}` && (
                  <div className="px-4 pb-3 text-sm text-gray-600 dark:text-blue-100 border-t border-gray-200 dark:border-[#2d437a] pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-[#2d437a]">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">Send us a Message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Subject</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Message</label>
              <textarea 
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Please provide as much detail as possible..."
              />
            </div>
            <button 
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Status Page Link */}
        <div className="bg-gray-100 dark:bg-[#1a2a57] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-[#2d437a]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">System Status</h3>
              <p className="text-sm text-gray-600 dark:text-blue-200">Check our current system status and uptime</p>
            </div>
            <a 
              href="#" 
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
            >
              View Status
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 