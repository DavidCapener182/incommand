"use client"

import Link from "next/link"

export default function MarketingNavigation() {
  return (
    <header className="sticky top-0 z-50">
      {/* Top Navy Bar with logo and Log In button */}
      <div className="w-full bg-[#1E3A8A] relative flex items-center justify-center py-5">
        {/* Logo */}
        <div className="relative z-30 flex items-center justify-center h-auto">
          <div 
            className="flex items-center w-48 sm:w-72 md:w-80 lg:w-[360px] h-auto text-xl sm:text-2xl md:text-3xl lg:text-4xl"
            style={{ 
              fontFamily: "'Montserrat', sans-serif"
            }}
          >
            <svg 
              className="flex-shrink-0" 
              viewBox="0 0 100 100" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '1em', height: '1em' }}
            >
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path 
                d="M20 55 L45 75 L85 20" 
                fill="none"
                stroke="#ed1c24"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div 
              className="text-white font-bold whitespace-nowrap leading-none pl-2"
            >
              InCommand
            </div>
          </div>
        </div>

        {/* Log In button – hidden on mobile, visible on desktop */}
        <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 hidden sm:block">
          <Link
            href="/login"
            className="px-5 py-2 sm:px-6 sm:py-2.5 border border-white/70 text-white font-semibold rounded-full text-sm sm:text-base hover:bg-white/15 hover:backdrop-blur-sm transition-all duration-300 shadow-sm"
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  )
}