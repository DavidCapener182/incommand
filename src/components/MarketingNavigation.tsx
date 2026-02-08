"use client"

import Link from "next/link"

export default function MarketingNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1E3A8A]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group relative z-30 flex items-center justify-center">
          <div
            className="flex items-center text-xl sm:text-2xl md:text-3xl"
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
            <div className="whitespace-nowrap pl-2 font-bold leading-none text-white transition-colors group-hover:text-blue-100">
              InCommand
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <a href="#features" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">Workflow</a>
          <a href="#pricing" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">Pricing</a>
          <a href="#faq" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">FAQ</a>
        </nav>

        <div className="relative z-30">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-white/70 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 sm:px-6 sm:text-base"
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  )
}
