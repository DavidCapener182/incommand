'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const posts = [
  {
    title: 'How AI is Transforming Event Safety',
    excerpt: 'Discover how artificial intelligence and machine learning are revolutionizing incident prediction, response times, and event safety management.',
    category: 'Technology',
    categoryColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    date: '15 December 2024',
    readTime: '8 min read',
    image: '🤖',
  },
  {
    title: 'Best Practices for Festival Incident Response',
    excerpt: 'Learn from industry experts about creating effective incident response protocols for large-scale festivals and outdoor events.',
    category: 'Best Practices',
    categoryColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    date: '28 November 2024',
    readTime: '12 min read',
    image: '🎪',
  },
  {
    title: 'Real-time Analytics: Making Data-Driven Decisions',
    excerpt: 'Explore how real-time data analytics can improve event operations, enhance safety measures, and optimize resource allocation.',
    category: 'Event Safety',
    categoryColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    date: '14 November 2024',
    readTime: '10 min read',
    image: '📊',
  },
  {
    title: 'Staff Management at Large-Scale Events',
    excerpt: 'Essential strategies for coordinating teams, managing callsigns, and ensuring effective communication across event venues.',
    category: 'Best Practices',
    categoryColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    date: '2 October 2024',
    readTime: '7 min read',
    image: '👥',
  },
  {
    title: 'Mobile-First Event Management',
    excerpt: 'Why mobile accessibility is crucial for modern event operations and how it improves response times during critical incidents.',
    category: 'Technology',
    categoryColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    date: '18 October 2024',
    readTime: '6 min read',
    image: '📱',
  },
  {
    title: 'The Future of Event Safety Technology',
    excerpt: 'A look ahead at emerging technologies including IoT sensors, predictive analytics, and automated incident detection systems.',
    category: 'Product Updates',
    categoryColor: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    date: '5 September 2024',
    readTime: '11 min read',
    image: '🚀',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Latest Insights & Updates
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Stay informed with expert advice, industry news, and best practices for event management and safety.
          </p>
        </motion.div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-depth overflow-hidden hover:shadow-xl transition-shadow group"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-blue-600 flex items-center justify-center text-6xl">
                {post.image}
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${post.categoryColor}`}>
                    {post.category}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-500 mb-4">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span className="mr-4">{post.date}</span>
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{post.readTime}</span>
                </div>
                
                <Link
                  href="/incidents"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm group"
                >
                  Read more
                  <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get the latest articles, industry insights, and product updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-blue-100 mt-4">
              Join 1,000+ event professionals receiving our weekly insights
            </p>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Browse by Category
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {['Event Safety', 'Technology', 'Best Practices', 'Product Updates', 'Case Studies', 'Industry News'].map((category) => (
              <Link
                key={category}
                href="/incidents"
                className="px-6 py-3 bg-white dark:bg-[#1e2438] rounded-lg shadow hover:shadow-lg transition-shadow text-gray-900 dark:text-white font-medium"
              >
                {category}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

