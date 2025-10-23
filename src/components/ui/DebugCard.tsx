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
