'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FootballData } from '@/types/football'
import FootballCard_StandOccupancy from './FootballCard_StandOccupancy'
import FootballCard_LiveScore from './FootballCard_LiveScore'
import FootballCard_GateStatus from './FootballCard_GateStatus'
import FootballCard_MedicalPolicing from './FootballCard_MedicalPolicing'
import FootballCard_Transport from './FootballCard_TransportWeather'
import SupportToolModal from '../../football/modals/SupportToolModal'
import { StandOccupancyCurrent, StandOccupancySetup } from '../../football/modals/StandOccupancyModal'
import { StaffingActual, StaffingDeployment } from '../../football/modals/StaffingModal'
import { FixtureCurrent, FixtureSetup } from '../../football/modals/FixtureModal'
import { CrowdCurrent, CrowdSetup } from '../../football/modals/CrowdModal'
import { TransportCurrent, TransportSetup } from '../../football/modals/TransportModal'

export default function SupportToolsFootball() {
  const [data, setData] = useState<FootballData | null>(null)
  const [activeModal, setActiveModal] = useState<null | 'stand' | 'staff' | 'fixture' | 'crowd' | 'transport'>(null)

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      const res = await fetch('/api/football/data')
      if (!res.ok) return
      const json = await res.json()
      if (mounted) setData(json.data)
    }
    fetchData()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
        {/* Each wrapper uses flex + uniform height for consistent sizing */}
        <div className="col-span-1 flex h-[260px]">
          <FootballCard_StandOccupancy 
            className="flex-1" 
            onOpenModal={() => setActiveModal('stand')}
          />
        </div>

        <div className="col-span-1 flex h-[260px]">
          <FootballCard_MedicalPolicing 
            className="flex-1" 
            onOpenModal={() => setActiveModal('staff')}
          />
        </div>

        <div className="col-span-2 flex h-[260px]">
          <FootballCard_LiveScore 
            className="flex-1" 
            onOpenModal={() => setActiveModal('fixture')}
          />
        </div>

        <div className="col-span-1 flex h-[260px]">
          <FootballCard_GateStatus 
            className="flex-1" 
            onOpenModal={() => setActiveModal('crowd')}
          />
        </div>

        <div className="col-span-1 flex h-[260px]">
          <FootballCard_Transport 
            className="flex-1" 
            onOpenModal={() => setActiveModal('transport')}
          />
        </div>
      </div>

      {/* Modals will be rendered here as we implement them */}
      {activeModal === 'stand' && (
        <SupportToolModal
          title="Stand Occupancy"
          currentTab={<StandOccupancyCurrent />}
          setupTab={<StandOccupancySetup />}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={() => console.log('Stand occupancy saved')}
        />
      )}
      {activeModal === 'staff' && (
        <SupportToolModal
          title="Staffing Numbers"
          currentTab={<StaffingActual />}
          setupTab={<StaffingDeployment />}
          currentTabLabel="Actual Staffing Numbers"
          setupTabLabel="Deployment"
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={() => console.log('Staffing deployment saved')}
        />
      )}
      {activeModal === 'fixture' && (
        <SupportToolModal
          title="Fixture / Match Progress"
          currentTab={<FixtureCurrent />}
          setupTab={<FixtureSetup />}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={() => console.log('Fixture checklist saved')}
        />
      )}
      {activeModal === 'crowd' && (
        <SupportToolModal
          title="Crowd Movement & Gate Status"
          currentTab={<CrowdCurrent />}
          setupTab={<CrowdSetup />}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={() => console.log('Gate configuration saved')}
        />
      )}
      {activeModal === 'transport' && (
        <SupportToolModal
          title="Transport Status"
          currentTab={<TransportCurrent />}
          setupTab={<TransportSetup />}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={() => console.log('Transport configuration saved')}
        />
      )}
    </>
  )
}


