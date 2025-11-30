'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowUpRight, 
  CirclePlay, 
  Calendar, 
  Clock, 
  Search, 
  X, 
  ChevronRight,
  Mail,
  Filter,
  Sparkles,
  MessageSquare,
  List,
  Send,
  Share2,
  Play,
  Pause,
  Volume2
} from 'lucide-react'

// --- UI COMPONENTS ---

const Badge = ({ children, className, variant = 'default', onClick }: any) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  const variants = {
    default: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "text-slate-900 border border-slate-200 hover:bg-slate-100",
  }
  return (
    <span 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </span>
  )
}

const Button = ({ children, className, variant = 'default', size = 'default', onClick, disabled }: any) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  const variants = {
    default: "bg-[#23408e] text-white hover:bg-[#1a316e]",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-700",
    link: "text-[#23408e] underline-offset-4 hover:underline",
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-full px-8",
    icon: "h-10 w-10",
  }
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}
    >
      {children}
    </button>
  )
}

const Card = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-all hover:shadow-md ${className}`}
  >
    {children}
  </div>
)

const Input = ({ className, ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23408e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

// --- OPENAI API INTEGRATION ---

const AIAssistant = ({ articleText }: { articleText: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'social'>('summary')
  
  // Summary State
  const [summary, setSummary] = useState<string | null>(null)
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([])
  const [input, setInput] = useState('')
  
  // Social State
  const [socialDraft, setSocialDraft] = useState<string | null>(null)

  // Audio State
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const [loading, setLoading] = useState(false)

  const generateSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/blog/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ articleText }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        setSummary(error.error || "Error generating summary. Please try again.")
        return
      }
      
      const data = await response.json()
      setSummary(data.summary || "Unable to generate summary.")
    } catch (e) {
      setSummary("Error generating summary. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateAudio = async (textToRead: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/blog/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textToRead }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Error generating audio.")
        return
      }
      
      // Response is audio blob directly
      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      
      // Auto-play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
          setIsPlaying(true)
        }
      }, 100)
    } catch (e) {
      console.error(e)
      alert("Error generating audio.")
    } finally {
      setLoading(false)
    }
  }

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleChat = async () => {
    if (!input.trim()) return
    const userMsg = input
    setInput('')
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const response = await fetch('/api/blog/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleText,
          messages: [...chatHistory, { role: 'user', text: userMsg }]
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        setChatHistory(prev => [...prev, { role: 'model', text: error.error || "Sorry, I encountered an error." }])
        return
      }
      
      const data = await response.json()
      const answer = data.answer || "I couldn't find an answer in the text."
      setChatHistory(prev => [...prev, { role: 'model', text: answer }])
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }])
    } finally {
      setLoading(false)
    }
  }

  const generateSocial = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/blog/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ articleText }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        setSocialDraft(error.error || "Error generating social draft.")
        return
      }
      
      const data = await response.json()
      setSocialDraft(data.draft || "Unable to generate draft.")
    } catch (e) {
      setSocialDraft("Error generating social draft.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">AI Insights Available</h4>
            <p className="text-xs text-slate-500">Summarize, listen to audio, or draft social posts.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)} className="gap-2">
          Activate Assistant ✨
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-lg ring-4 ring-blue-50 mb-8 overflow-hidden animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#23408e] to-[#4361EE] p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          AI Assistant
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'summary' ? 'text-[#23408e] border-b-2 border-[#23408e] bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <List className="h-4 w-4" /> Summary
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-[#23408e] border-b-2 border-[#23408e] bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <MessageSquare className="h-4 w-4" /> Q&A
        </button>
        <button 
          onClick={() => setActiveTab('social')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'social' ? 'text-[#23408e] border-b-2 border-[#23408e] bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Share2 className="h-4 w-4" /> Social
        </button>
      </div>

      {/* Content */}
      <div className="p-6 bg-slate-50/50 min-h-[200px]">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {!summary ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-4">Get a quick overview of the key points in this article.</p>
                <Button onClick={generateSummary} disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Generating...' : '✨ Generate Summary'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm prose-blue bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Summary</div>
                    {!audioUrl && !loading && (
                      <button 
                        onClick={() => generateAudio(summary.replace(/[#*-]/g, ''))} // Clean markdown for TTS
                        className="text-xs text-[#23408e] font-medium flex items-center gap-1 hover:underline"
                      >
                        <Volume2 className="h-3 w-3" /> Listen
                      </button>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{summary}</div>
                </div>

                {/* Audio Player */}
                {(audioUrl || loading) && (audioUrl || activeTab === 'summary') && (
                    <div className={`flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-full shadow-sm animate-in slide-in-from-top-2 ${loading && !audioUrl ? 'opacity-50' : ''}`}>
                      {loading && !audioUrl ? (
                         <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-[#23408e] animate-spin" />
                      ) : (
                        <button 
                          onClick={toggleAudio}
                          className="h-8 w-8 flex items-center justify-center rounded-full bg-[#23408e] text-white hover:bg-blue-700 transition-colors"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </button>
                      )}
                      
                      <div className="flex-1">
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full bg-[#23408e] ${isPlaying ? 'animate-[pulse_2s_infinite]' : 'w-0'}`} style={{ width: isPlaying ? '100%' : '0%' }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                           {loading && !audioUrl ? 'Generating Audio...' : isPlaying ? 'Playing Summary' : 'AI Audio Ready'}
                        </p>
                      </div>
                      <audio 
                        ref={audioRef} 
                        src={audioUrl || undefined} 
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[300px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Ask me anything about this article!</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#23408e] text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 rounded-bl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                value={input}
                onChange={(e: any) => setInput(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && handleChat()}
                placeholder="Ask a question..."
                className="bg-white"
              />
              <Button size="icon" onClick={handleChat} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
             {!socialDraft ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-4">Draft optimized social media posts based on this article.</p>
                <Button onClick={generateSocial} disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Drafting...' : '✨ Generate Drafts'}
                </Button>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-[300px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Drafts</div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(socialDraft); alert('Copied to clipboard!') }}
                    className="text-xs text-[#23408e] font-medium hover:underline"
                  >
                    Copy All
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-slate-50 p-3 rounded border border-slate-100">
                  {socialDraft}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const BlogModal = ({ isOpen, onClose, title, author, date, readTime, content, image, textContent }: any) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header Image */}
        <div className="relative h-48 bg-gradient-to-r from-[#23408e] to-[#4361EE] flex items-center justify-center shrink-0">
          <div className="text-8xl">{image}</div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {readTime}</span>
            <span className="font-medium text-[#23408e]">By {author}</span>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>{title}</h2>

          {/* AI Assistant Integration */}
          {textContent && <AIAssistant articleText={textContent} />}
          
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#23408e] prose-a:text-[#4361EE]">
            {content}
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <span className="text-sm text-slate-500 italic">Shared from InCommand Insights</span>
          <Button onClick={onClose}>Close Article</Button>
        </div>
      </div>
    </div>
  )
}

// --- DATA ---

const categories = [
  { name: 'All Posts', icon: '📑' },
  { name: 'Best Practices', icon: '📋' },
  { name: 'Event Safety', icon: '🛡️' },
  { name: 'Technology', icon: '💻' },
  { name: 'Operations', icon: '⚙️' },
]

const posts = [
  {
    id: 1,
    title: 'Incident Management: Lessons from Large-Scale Events',
    excerpt: 'Drawing from decades of experience managing major festivals and public events, we explore the critical systems and processes that separate successful operations from crisis situations.',
    category: 'Best Practices',
    date: '22 Oct 2025',
    readTime: '12 min',
    image: '🎪',
    author: 'David Capener',
    featured: true,
    // Included raw text for AI processing
    textContent: `Over 15 years managing security and safety operations at major UK festivals and public events has taught me one fundamental truth: if it isn't written down, it didn't happen. This principle underpins every aspect of professional incident management. Whether you're responding to a medical emergency, managing an ejection, or coordinating with emergency services, the quality of your documentation directly impacts outcomes. The Reality of Large-Scale Operations: When you're managing thousands of attendees, multiple simultaneous incidents, and coordinating teams across a sprawling venue, paper logs and radio calls alone aren't enough. I've seen control rooms where incident logs were scrawled on whiteboards, where radio traffic was lost to memory, and where post-event debriefs relied on incomplete recollections. Key Takeaway: Modern event management demands systems that can keep pace with complexity. Real-time logging isn't a luxury; it's a legal and operational necessity. Essential Systems for Success: 1. Real-Time Contemporaneous Logging: Incidents must be logged as they happen. 2. Structured Templates: Consistency matters. Every log needs a headline, source, facts, actions, and outcome. 3. Complete Audit Trails: Original entries are never deleted—they're preserved with amendments layered above.`,
    content: (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed font-medium text-slate-700">
          Over 15 years managing security and safety operations at major UK festivals and public events has taught me one fundamental truth: <strong>if it isn&apos;t written down, it didn&apos;t happen.</strong>
        </p>
        <p>
          This principle underpins every aspect of professional incident management. Whether you&apos;re responding to a medical emergency, managing an ejection, or coordinating with emergency services, the quality of your documentation directly impacts outcomes.
        </p>
        <h3>The Reality of Large-Scale Operations</h3>
        <p>
          When you&apos;re managing thousands of attendees, multiple simultaneous incidents, and coordinating teams across a sprawling venue, paper logs and radio calls alone aren&apos;t enough. I&apos;ve seen control rooms where incident logs were scrawled on whiteboards, where radio traffic was lost to memory, and where post-event debriefs relied on incomplete recollections.
        </p>
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-[#23408e] my-8">
          <h4 className="text-[#23408e] font-bold mb-2 mt-0">Key Takeaway</h4>
          <p className="m-0 text-blue-900">Modern event management demands systems that can keep pace with complexity. Real-time logging isn't a luxury; it's a legal and operational necessity.</p>
        </div>
        <h3>Essential Systems for Success</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Real-Time Contemporaneous Logging:</strong> Incidents must be logged as they happen.</li>
          <li><strong>Structured Templates:</strong> Consistency matters. Every log needs a headline, source, facts, actions, and outcome.</li>
          <li><strong>Complete Audit Trails:</strong> Original entries are never deleted—they&apos;re preserved with amendments layered above.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 2,
    title: 'How Real-Time Data Transforms Crowd Safety',
    excerpt: 'The shift from reactive to proactive crowd management through intelligent data collection, analysis, and predictive modeling.',
    category: 'Event Safety',
    date: '15 Oct 2025',
    readTime: '10 min',
    image: '📊',
    author: 'David Capener',
    featured: false,
    textContent: "Traditional crowd management has always been reactive. Real-time data collection changes the equation. By capturing every incident with precise timestamps, locations, and classifications, we create datasets that reveal patterns invisible to even the most experienced operators. What the Data Reveals: Heatmaps reveal problem areas that aren't obvious from ground level. That bottleneck near the toilets, the sightline issue causing crowding—data makes these visible.",
    content: (
      <div className="space-y-6">
        <p>Traditional crowd management has always been reactive. Real-time data collection changes the equation. By capturing every incident with precise timestamps, locations, and classifications, we create datasets that reveal patterns invisible to even the most experienced operators.</p>
        <h3>What the Data Reveals</h3>
        <p>Heatmaps reveal problem areas that aren&apos;t obvious from ground level. That bottleneck near the toilets, the sightline issue causing crowding—data makes these visible.</p>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Why JESIP Standards Matter',
    excerpt: 'Understanding Joint Emergency Services Interoperability Principles and their application to event management and incident logging.',
    category: 'Best Practices',
    date: '01 Oct 2025',
    readTime: '9 min',
    image: '🚨',
    author: 'David Capener',
    featured: false,
    textContent: "JESIP emerged from tragic failures in multi-agency coordination. For event managers, applying these principles is about building systems that work seamlessly with emergency services when seconds matter. JESIP stands for Joint Emergency Services Interoperability Principles.",
    content: (
      <div className="space-y-6">
        <p>JESIP emerged from tragic failures in multi-agency coordination. For event managers, applying these principles is about building systems that work seamlessly with emergency services when seconds matter.</p>
      </div>
    ),
  },
  {
    id: 4,
    title: 'The Digital Control Room',
    excerpt: 'Moving away from whiteboards and radio logs: how digital transformation is reducing response times and improving accountability.',
    category: 'Technology',
    date: '28 Sep 2025',
    readTime: '7 min',
    image: '💻',
    author: 'Sarah Jenkins',
    featured: false,
    textContent: "The modern control room is a hub of data. Integrating CCTV, radio dispatch, and incident logging into a single pane of glass reduces cognitive load and speeds up decision making.",
    content: (
      <div className="space-y-6">
        <p>The modern control room is a hub of data. Integrating CCTV, radio dispatch, and incident logging into a single pane of glass reduces cognitive load and speeds up decision making.</p>
      </div>
    ),
  },
]

// --- PAGE COMPONENT ---

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Posts')
  const [filteredPosts, setFilteredPosts] = useState(posts)

  // Filter Logic
  useEffect(() => {
    let result = posts

    if (selectedCategory !== 'All Posts') {
      result = result.filter(post => post.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.excerpt.toLowerCase().includes(query)
      )
    }

    setFilteredPosts(result)
  }, [searchQuery, selectedCategory])

  const featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0]
  const standardPosts = filteredPosts.filter(p => p.id !== featuredPost?.id)

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="default" className="bg-blue-50 text-blue-700 hover:bg-blue-100 mb-6 px-3 py-1">
              The InCommand Blog
              </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Insights from the <span className="text-[#23408e]">Frontline</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
              Real-world lessons, practical guidance, and professional perspectives on event management, crowd safety, and operational technology.
            </p>
            
            {/* Search Bar */}
            <div className="mt-8 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search articles, topics, or keywords..." 
                className="pl-10 h-12 rounded-full shadow-sm border-slate-200 focus-visible:ring-[#23408e]"
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#23408e] to-[#4361EE] rounded-2xl opacity-10 blur-3xl transform rotate-3 scale-90"></div>
            <div className="relative bg-gradient-to-br from-[#1e3a8a] to-[#23408e] rounded-2xl p-8 text-white shadow-2xl aspect-video flex items-center justify-center overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-500">
               <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
               <div className="text-center z-10">
                 <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">📚</div>
                 <h3 className="text-xl font-semibold opacity-90">Knowledge Base</h3>
                 <p className="text-sm opacity-70 mt-1">Curated by Industry Experts</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content Area */}
        <div className="flex-1">
            
            {/* Category Filter - Mobile/Tablet scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-[#23408e] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-slate-900">No articles found</h3>
                <p className="text-slate-500">Try adjusting your search or category filter.</p>
                <Button 
                  variant="link" 
                  onClick={() => {setSearchQuery(''); setSelectedCategory('All Posts')}}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                
                {/* Featured Post */}
                {featuredPost && (
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-1 bg-[#ed1c24] rounded-full"></div>
                      <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Featured Article</h2>
                    </div>
                    <Card 
                      className="group overflow-hidden border-0 shadow-lg ring-1 ring-slate-900/5 bg-white cursor-pointer hover:shadow-xl transition-all"
                      onClick={() => setSelectedPost(featuredPost)}
                    >
                      <div className="grid md:grid-cols-5 h-full">
                        <div className="md:col-span-2 bg-slate-100 flex items-center justify-center min-h-[240px] md:min-h-0 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:scale-105 transition-transform duration-700">
                          <span className="text-8xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{featuredPost.image}</span>
                        </div>
                        <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge variant="default" className="bg-blue-100 text-blue-800">{featuredPost.category}</Badge>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{featuredPost.date}</span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 group-hover:text-[#23408e] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            {featuredPost.title}
                          </h3>
                          <p className="text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                            {featuredPost.excerpt}
                          </p>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                              <span className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">DC</span>
                              {featuredPost.author}
                            </div>
                            <span className="flex items-center text-[#23408e] font-semibold text-sm group-hover:translate-x-1 transition-transform">
                              Read Article <ArrowUpRight className="ml-1 h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </section>
                )}

                {/* Standard Grid */}
                {standardPosts.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                       <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Recent Articles</h2>
                       <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      {standardPosts.map((post) => (
              <Card
                          key={post.id} 
                          className="flex flex-col h-full border-slate-200 hover:border-blue-200 cursor-pointer group"
                onClick={() => setSelectedPost(post)}
              >
                          <div className="h-48 bg-slate-50 border-b border-slate-100 flex items-center justify-center text-5xl group-hover:bg-blue-50/50 transition-colors">
                  {post.image}
                </div>
                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">{post.category}</Badge>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {post.readTime}
                              </span>
                  </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-[#23408e] transition-colors">
                    {post.title}
                  </h3>
                            <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">
                    {post.excerpt}
                  </p>
                            <div className="pt-4 border-t border-slate-100 flex items-center text-sm text-slate-400">
                              <Calendar className="h-3 w-3 mr-1.5" /> {post.date}
                            </div>
                    </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
                  </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-8">
            
            {/* Newsletter Widget */}
            <div className="bg-[#23408e] rounded-xl p-6 text-white shadow-xl ring-1 ring-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
               <div className="relative z-10">
                 <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                   <Mail className="h-5 w-5 text-white" />
                 </div>
                 <h3 className="text-lg font-bold mb-2">Weekly Intelligence</h3>
                 <p className="text-blue-100 text-sm mb-4">Join 2,000+ event professionals receiving our best tactics every Tuesday.</p>
                 <div className="space-y-2">
                   <input 
                     type="email" 
                     placeholder="your@email.com" 
                     className="w-full h-9 rounded-md border-0 bg-white/10 text-white placeholder:text-blue-200/50 px-3 text-sm focus:ring-1 focus:ring-white"
                   />
                   <Button className="w-full bg-white text-[#23408e] hover:bg-blue-50 font-bold h-9">
                     Subscribe Free
                   </Button>
                 </div>
                 <p className="text-[10px] text-blue-200 mt-3 text-center">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

            {/* Popular Topics */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Popular Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Crowd Science', 'JESIP', 'Medical', 'Logistics', 'Security', 'Tech', 'Case Studies'].map(tag => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 cursor-pointer transition-colors"
                    onClick={() => {setSearchQuery(tag); setSelectedCategory('All Posts')}}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sticky Ad / CTA */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-center text-white sticky top-6">
              <CirclePlay className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <h3 className="font-bold text-lg mb-2">See InCommand in Action</h3>
              <p className="text-slate-300 text-sm mb-6">
                Ready to upgrade your incident logging? Book a personalized demo for your venue.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                Book Demo
              </Button>
          </div>

        </aside>
        </div>
      </div>

      {/* Article Modal */}
      {selectedPost && (
        <BlogModal
          isOpen={true}
          onClose={() => setSelectedPost(null)}
          {...selectedPost}
        />
      )}
    </div>
  )
}
