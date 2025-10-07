'use client'

import React from 'react'

export default function TestStaffingPage() {
  console.log('TestStaffingPage component rendering')
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#111827', 
          marginBottom: '24px' 
        }}>
          🎯 Test Staffing Page
        </h1>
        
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb', 
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '16px' 
          }}>
            ✅ This is a Test Page
          </h2>
          
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            If you can see this message, the routing is working. The issue is specifically with the `/staffing` route.
          </p>
        </div>
      </div>
    </div>
  )
}
