"use client"

import Image from "next/image"
import Link from "next/link"

export default function MarketingNavigation() {
  return (
    <header className="sticky top-0 z-50">
      {/* Top Navy Bar with logo and Log In button */}
      <div className="w-full bg-[#1E3A8A] relative flex items-center justify-center py-5">
        {/* Logo */}
        <div className="relative z-30">
          <Image
            src="/inCommand.png"
            alt="InCommand Logo"
            width={360}
            height={360}
            className="w-48 sm:w-72 md:w-80 lg:w-[360px] h-auto object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
            priority
          />
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