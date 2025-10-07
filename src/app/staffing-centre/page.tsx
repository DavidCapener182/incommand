'use client'

export default function StaffingCentrePage() {
  console.log('StaffingCentrePage rendering')
  
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          🎯 Staffing Centre (Alternative Route)
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ✅ Alternative Route Test
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This is a test to see if the issue is specific to the `/staffing` route name.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              🧪 Route Test
            </h3>
            <p className="text-blue-700 dark:text-blue-300">
              If you can see this, the issue is specific to the `/staffing` route name.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
