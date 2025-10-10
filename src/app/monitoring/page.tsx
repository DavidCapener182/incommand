import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard'

export const metadata = {
  title: 'System Monitoring | inCommand',
  description: 'Monitor system health, performance, and usage analytics'
}

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <MonitoringDashboard />
    </div>
  )
}

