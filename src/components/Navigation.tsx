import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/incidents" className="flex items-center">
            <Image
              src="/compact-logo.png"
              alt="Compact Logo"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="text-xl font-semibold">Event Control</span>
          </Link>
          <div className="flex space-x-4">
            <Link
              href="/incidents"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/incidents'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Incidents
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 