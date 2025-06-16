'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() || '';
  const showNav = !['/login', '/signup'].includes(pathname);
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {showNav && <Navigation />}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
} 