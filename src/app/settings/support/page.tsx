'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon
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

interface SupportTicket {
  id: string;
  user_id: string;
  company_id?: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'feature_request' | 'bug_report';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_internal: boolean;
  created_at: string;
  read_at?: string;
  sender?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general' as const,
    priority: 'medium' as const,
    message: ''
  });
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];
  const filteredFAQ = selectedCategory === 'All' ? faqData : faqData.filter(item => item.category === selectedCategory);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user);
      setCurrentUser(session?.user || null);
    });

    // Initial check
    checkUser();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserTickets();
    }
  }, [currentUser]);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Auth check result:', { user, error });
      if (error) {
        console.error('Auth error:', error);
      }
      
      if (user) {
        // Verify user exists in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', user.id)
          .single();
          
        console.log('Profile check result:', { profile, profileError });
        
        if (profileError) {
          console.error('Profile error:', profileError);
        }
      }
      
      setCurrentUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTickets = async () => {
    if (!currentUser) return;
    
    try {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTickets(tickets || []);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    }
  };

  const fetchSupportMessages = async (ticketId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:profiles!support_messages_sender_id_fkey(id, full_name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSupportMessages(messages || []);
    } catch (error) {
      console.error('Error fetching support messages:', error);
    }
  };

  const createSupportTicket = async () => {
    if (!currentUser) {
      alert('You must be logged in to create a support ticket. Please refresh the page and try again.');
      return;
    }
    
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      alert('Please fill in both subject and message fields.');
      return;
    }

    try {
      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          subject: newTicket.subject,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create the initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: currentUser.id,
          sender_type: 'user',
          message: newTicket.message,
          is_internal: false
        });

      if (messageError) throw messageError;

      // Reset form and close modal
      setNewTicket({
        subject: '',
        category: 'general',
        priority: 'medium',
        message: ''
      });
      setIsCreatingTicket(false);
      
      // Refresh tickets
      await fetchUserTickets();
      
      // Open the chat for the new ticket
      setCurrentTicket(ticket);
      setIsLiveChatOpen(true);
      await fetchSupportMessages(ticket.id);
    } catch (error) {
      console.error('Error creating support ticket:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentTicket || !newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: currentTicket.id,
          sender_id: currentUser.id,
          sender_type: 'user',
          message: newMessage.trim(),
          is_internal: false
        });

      if (error) throw error;

      setNewMessage('');
      await fetchSupportMessages(currentTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const openTicketChat = async (ticket: SupportTicket) => {
    setCurrentTicket(ticket);
    setIsLiveChatOpen(true);
    await fetchSupportMessages(ticket.id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Support Center</h1>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-[#1a2a57] rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Live Chat Support</h2>
            </div>
            <p className="text-gray-600 dark:text-blue-100 mb-4 text-sm">
              Get instant help from our support team during business hours (9 AM - 6 PM GMT).
            </p>
            <button 
              onClick={() => setIsCreatingTicket(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Start Live Chat
            </button>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-[#1a2a57] rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">Email Support</h2>
            </div>
            <p className="text-gray-600 dark:text-blue-100 mb-4 text-sm">
              Send us detailed questions and we&apos;ll respond within 24 hours.
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
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
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
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
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

        {/* My Support Tickets */}
        {userTickets.length > 0 && (
          <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-200">My Support Tickets</h2>
            <div className="space-y-3">
              {userTickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 dark:border-[#2d437a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-blue-100">
                    <span>{ticket.category} • Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => openTicketChat(ticket)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      View Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
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

      {/* Support Ticket Creation Modal */}
      {isCreatingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-blue-200">Create Support Ticket</h3>
              <button
                onClick={() => setIsCreatingTicket(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  placeholder="Please provide as much detail as possible..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={createSupportTicket}
                  disabled={!newTicket.subject.trim() || !newTicket.message.trim() || isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Create Ticket'}
                </button>
                <button
                  onClick={() => setIsCreatingTicket(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Modal */}
      {isLiveChatOpen && currentTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-blue-200">
                  Support Chat - {currentTicket.subject}
                </h3>
                <p className="text-sm text-gray-600 dark:text-blue-100">
                  Status: {currentTicket.status.replace('_', ' ')} • Priority: {currentTicket.priority}
                </p>
              </div>
              <button
                onClick={() => setIsLiveChatOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {supportMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.sender?.full_name || message.sender?.email || 'Support Team'}
                    </div>
                    <div className="text-sm">{message.message}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2d437a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
