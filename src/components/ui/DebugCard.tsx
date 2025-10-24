import React from 'react'

interface DebugCardProps {
  title: string
  status: string
  instructions: string[]
  note?: string
  className?: string
}

export function DebugCard({ 
  title, 
  status, 
  instructions, 
  note, 
  className = '' 
}: DebugCardProps) {
  return (
    <div className={`mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            {title}
          </h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p><strong>Current Status:</strong> {status}</p>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <p className="font-medium mb-2">📋 Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                {instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
            {note && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                💡 <strong>Note:</strong> {note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Predefined debug card for domain setup
export function DomainSetupDebugCard() {
  return (
    <DebugCard
      title="🚧 Domain Setup Required - Email System Pending"
      status="Vendor accreditation system is working but emails fail due to unverified domain."
      instructions={[
        'Go to resend.com/domains',
        'Add your domain (e.g., incommand.app)',
        'Add the required DNS records to verify ownership',
        'Wait for verification (usually 5-10 minutes)',
        'Update email service: Change onboarding@resend.dev back to noreply@yourdomain.com in src/lib/notifications/emailService.ts',
        'Test vendor application submission',
        'Remove this debug card once domain is verified'
      ]}
      note="The system works perfectly for development/testing with the current setup. Domain verification is only needed for production email delivery."
    />
  )
}

// Debug card for wristband management features
export function WristbandManagementDebugCard() {
  return (
    <DebugCard
      title="🎯 Wristband Management System - Feature Status"
      status="Complete wristband and access level management system implemented and functional."
      instructions={[
        '✅ Database migration applied - accreditation_access_levels, wristband_types, wristband_access_levels tables created',
        '✅ TypeScript types created - AccreditationAccessLevel, WristbandType, WristbandAccessLevel interfaces',
        '✅ Service functions implemented - CRUD operations for wristbands and access levels',
        '✅ UI components added - Wristband management card with create/edit/delete functionality',
        '✅ Access level management - Users can create, edit, and delete access levels',
        '✅ Event isolation - All data is properly scoped to current event',
        '✅ Integration complete - Access levels appear in vendor application form',
        '✅ Sample data created - 5 access levels available for testing',
        '🔄 Next: Test complete workflow from access level creation to wristband assignment',
        '🔄 Next: Add bulk operations for managing multiple wristband types',
        '🔄 Next: Add wristband assignment tracking and reporting features'
      ]}
      note="The wristband management system is fully functional. Users can create access levels, assign them to wristband types, and use them in vendor applications. All data is event-specific and properly isolated."
    />
  )
}

// Combined debug card for vendors page
export function VendorPortalDebugCard() {
  return (
    <DebugCard
      title="📋 Vendor Portal - Remaining Tasks"
      status="Core wristband management system is complete. Focus on advanced features and integrations."
      instructions={[
        '🚧 EMAIL SYSTEM: Domain verification needed for production email delivery',
        '   → Go to resend.com/domains and add your domain',
        '   → Add DNS records and wait for verification',
        '   → Update email service in src/lib/notifications/emailService.ts',
        '',
        '🔄 ADVANCED WRISTBAND FEATURES:',
        '   → Bulk wristband operations and management',
        '   → Wristband assignment tracking and reporting',
        '   → Advanced access level permissions and restrictions',
        '   → Wristband printing and QR code generation',
        '   → Integration with staff management system',
        '   → Wristband inventory tracking and alerts',
        '   → Automated wristband distribution workflows',
        '   → Wristband analytics and usage reports'
      ]}
      note="The core wristband management system is fully functional. Focus on advanced features and production email setup."
    />
  )
}
