export default function StaffingIsolatedPage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>🎯 STAFFING CENTRE - ISOLATED</h1>
      <p>This page bypasses the normal layout system entirely.</p>
      <div style={{ backgroundColor: 'red', color: 'white', padding: '20px', margin: '20px', borderRadius: '8px' }}>
        RED BOX TEST - This should be visible
      </div>
      <p>If you can see this, the issue is with the LayoutWrapper or AuthContext.</p>
      <div style={{ backgroundColor: 'green', color: 'white', padding: '20px', margin: '20px', borderRadius: '8px' }}>
        GREEN BOX - Layout bypass successful
      </div>
    </div>
  )
}
