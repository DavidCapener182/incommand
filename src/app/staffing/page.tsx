'use client'

import LayoutWrapper from '@/components/LayoutWrapper'
import StaffingCentre from '@/components/StaffingCentre'

export default function StaffingPage() {
  return (
    <LayoutWrapper>
      <div className="p-6">
        <StaffingCentre />
      </div>
    </LayoutWrapper>
  )
}
