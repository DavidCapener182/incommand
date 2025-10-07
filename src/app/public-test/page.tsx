export default function PublicTestPage() {
  console.log('PublicTestPage component rendering')
  
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
          🎯 Public Test Page
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
            ✅ This Page Works Without Authentication
          </h2>
          
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            If you can see this page, then the issue with the staffing pages is authentication-related.
          </p>
          
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '16px', 
            borderRadius: '6px',
            border: '1px solid #d1d5db'
          }}>
            <p style={{ 
              color: '#374151', 
              fontWeight: '500',
              margin: '0 0 8px 0'
            }}>
              Next Steps:
            </p>
            <ul style={{ 
              color: '#6b7280', 
              margin: '0',
              paddingLeft: '20px'
            }}>
              <li>Login to the app first</li>
              <li>Then try accessing /staffing</li>
              <li>Or modify the auth gate to allow these routes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
