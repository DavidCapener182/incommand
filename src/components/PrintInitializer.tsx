'use client'

import { useEffect } from 'react'
import { initializePrintUtils } from '@/utils/printUtils'

export default function PrintInitializer() {
  useEffect(() => {
    // Initialize print utilities when the app loads
    initializePrintUtils()
  }, [])

  return null // This component doesn't render anything
}
