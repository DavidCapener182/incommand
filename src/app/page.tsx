'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../components/Navigation'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/incidents')
  }, [router])

  return null
} 