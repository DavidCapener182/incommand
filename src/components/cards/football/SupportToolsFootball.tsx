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

  const handleOpenModal = (modalType: 'stand' | 'staff' | 'fixture' | 'crowd' | 'transport') => {
    console.log('handleOpenModal called with:', modalType)
    setActiveModal(modalType)
  }

  useEffect(() => {
    console.log('activeModal changed to:', activeModal)
  }, [activeModal])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
        {/* Each wrapper uses flex + uniform height for consistent sizing */}
        <div className="col-span-1 flex h-[260px]">
          <FootballCard_StandOccupancy 
            className="flex-1" 
            onOpenModal={() => handleOpenModal('stand')}
          />
        </div>

        <div className="col-span-1 flex h-[260px]">
          <FootballCard_MedicalPolicing 
            className="flex-1" 
            onOpenModal={() => handleOpenModal('staff')}
          />
        </div>

        <div className="col-span-2 flex h-[260px]">
          <FootballCard_LiveScore 
            className="flex-1" 
            onOpenModal={() => handleOpenModal('fixture')}
          />
        </div>

        <div className="col-span-1 flex h-[260px]">
          <FootballCard_GateStatus 
            className="flex-1" 
            onOpenModal={() => handleOpenModal('crowd')}
          />
        </div>

        <div className="col-span-1 flex h-[260px]">
          <FootballCard_Transport 
            className="flex-1" 
            onOpenModal={() => handleOpenModal('transport')}
          />
        </div>
      </div>

      {/* Modals - Always render, control visibility via isOpen prop */}
      <SupportToolModal
        title="Stand Occupancy"
        currentTab={<StandOccupancyCurrent />}
        setupTab={<StandOccupancySetup />}
        isOpen={activeModal === 'stand'}
        onClose={() => setActiveModal(null)}
        onSave={() => console.log('Stand occupancy saved')}
      />
      <SupportToolModal
        title="Staffing Numbers"
        currentTab={<StaffingActual />}
        setupTab={<StaffingDeployment />}
        currentTabLabel="Actual Staffing Numbers"
        setupTabLabel="Deployment"
        isOpen={activeModal === 'staff'}
        onClose={() => setActiveModal(null)}
        onSave={() => console.log('Staffing deployment saved')}
      />
      <SupportToolModal
        title="Fixture / Match Progress"
        currentTab={<FixtureCurrent />}
        setupTab={<FixtureSetup />}
        isOpen={activeModal === 'fixture'}
        onClose={() => setActiveModal(null)}
        onSave={() => console.log('Fixture checklist saved')}
      />
      <SupportToolModal
        title="Crowd Movement & Gate Status"
        currentTab={<CrowdCurrent />}
        setupTab={<CrowdSetup />}
        isOpen={activeModal === 'crowd'}
        onClose={() => setActiveModal(null)}
        onSave={() => console.log('Gate configuration saved')}
      />
      <SupportToolModal
        title="Transport Status"
        currentTab={<TransportCurrent />}
        setupTab={<TransportSetup />}
        isOpen={activeModal === 'transport'}
        onClose={() => setActiveModal(null)}
        onSave={() => console.log('Transport configuration saved')}
      />
    </>
  )
}


