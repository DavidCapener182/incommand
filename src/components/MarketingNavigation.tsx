"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MarketingNavigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 flex flex-col items-center overflow-x-hidden">
      {/* Top Navy Bar with balanced spacing */}
      <div className="relative flex w-full flex-col items-center justify-center bg-[#1E3A8A] py-5">
        {/* Logo */}
        <div className="relative z-30 mb-2">
          <Image
            src="/inCommand.png"
            alt="InCommand Logo"
            width={360}
            height={360}
            className="h-auto w-48 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)] sm:w-72 md:w-80 lg:w-[360px]"
            priority
          />
        </div>

        {/* Log In button – refined design & alignment */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-12">
          <Link
            href="/login"
            className="px-5 py-2 sm:px-6 sm:py-2.5 border border-white/70 text-white font-semibold rounded-full text-sm sm:text-base hover:bg-white/15 hover:backdrop-blur-sm transition-all duration-300 shadow-sm"
          >
            Log In
          </Link>
        </div>
      </div>

       {/* Capsule Navigation */}
       <nav className="absolute top-[calc(100%-0.75rem)] z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-100/95 px-3 py-1 text-sm shadow-md backdrop-blur-md sm:max-w-none sm:px-6 sm:py-1.5 md:gap-4 md:px-8">
        <Link
          href="/features"
          className={`px-5 py-1 rounded-full text-sm font-semibold transition-all ${
            pathname === "/features"
              ? "bg-blue-600 text-white shadow-md"
              : "text-blue-800 hover:bg-blue-200/70 hover:text-blue-900"
          }`}
        >
          Features
        </Link>
        <Link
          href="/pricing"
          className={`px-5 py-1 rounded-full text-sm font-semibold transition-all ${
            pathname === "/pricing"
              ? "bg-blue-600 text-white shadow-md"
              : "text-blue-800 hover:bg-blue-200/70 hover:text-blue-900"
          }`}
        >
          Pricing
        </Link>
        <Link
          href="/about"
          className={`px-5 py-1 rounded-full text-sm font-semibold transition-all ${
            pathname === "/about"
              ? "bg-blue-600 text-white shadow-md"
              : "text-blue-800 hover:bg-blue-200/70 hover:text-blue-900"
          }`}
        >
          About
        </Link>
      </nav>
    </header>
  )
}