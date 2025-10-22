"use client"

import Image from "next/image"
import Link from "next/link"

export default function MarketingNavigation() {
  return (
    <header className="flex justify-between items-center px-6 lg:px-12 py-5 bg-transparent backdrop-blur-sm">
      <div className="flex items-center">
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={180}
          height={180}
          className="drop-shadow-lg"
          priority
        />
      </div>
      <nav className="hidden md:flex space-x-8 text-sm font-medium">
        <Link href="/features" className="hover:text-blue-200 transition">Features</Link>
        <Link href="/pricing" className="hover:text-blue-200 transition">Pricing</Link>
        <Link href="/about" className="hover:text-blue-200 transition">About</Link>
      </nav>
      <div className="flex items-center space-x-3">
        <Link
          href="/login"
          className="bg-white text-blue-800 font-semibold px-4 py-2 rounded-xl hover:bg-blue-100 transition shadow"
        >
          Log In
        </Link>
      </div>
    </header>
  )
}
