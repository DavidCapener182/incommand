'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function AuthDebugPage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    console.log('AuthDebug mounted')
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div>Loading AuthDebug...</div>
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Auth Debug Page</h1>
      <div style={{ backgroundColor: '#e0e0e0', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>Auth Status:</h2>
        <p>Loading: {loading ? 'true' : 'false'}</p>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'null'}</p>
      </div>
      
      <div style={{ backgroundColor: 'lightblue', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>Page Info:</h2>
        <p>Mounted: {mounted ? 'true' : 'false'}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{ backgroundColor: 'lightgreen', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h2>Test Content:</h2>
        <p>If you can see this, the AuthContext is working.</p>
      </div>
    </div>
  )
}
