'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const isActive = (path: string) => {
    if (path === '/incidents' && pathname === '/') {
      return 'border-red-500 text-white'
    }
    return pathname === path ? 'border-red-500 text-white' : 'border-transparent text-white hover:border-white hover:text-gray-100'
  }

  return (
    <nav className="bg-[#2A3990] border-b border-[#1e2a6a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/compact-logo.png"
                alt="Compact Security Logo"
                width={150}
                height={40}
                priority
              />
            </Link>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-12">
              <Link href="/incidents" className={`${isActive('/incidents')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Incidents
              </Link>
              <Link href="/analytics" className={`${isActive('/analytics')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Analytics
              </Link>
              <Link href="/reports" className={`${isActive('/reports')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Reports
              </Link>
              <Link href="/help" className={`${isActive('/help')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Help & Glossary
              </Link>
              <Link href="/settings" className={`${isActive('/settings')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => signOut()}
              className="ml-3 p-2 text-white hover:text-gray-200 focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 