import type { Metadata } from 'next'
import { defaultMetadata } from '../../config/seo.config'

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Updates | InCommand',
  description: 'Stay up to date with the latest features, improvements, and updates across the InCommand platform.',
}

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white text-gray-900">
      {children}
    </div>
  )
}
