<div style={{background:'lime',color:'black',fontSize:'32px'}}>DEPLOY TEST - {new Date().toISOString()}</div>
'use client'

import React from 'react'
import Dashboard from '../components/Dashboard'

export default function HomePage() {
  return (
    <main>
      <Dashboard />
    </main>
  )
} 
