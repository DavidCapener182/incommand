'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FootballData } from '@/types/football'
import FootballCard_StandOccupancy from './FootballCard_StandOccupancy'
import FootballCard_LiveScore from './FootballCard_LiveScore'
import FootballCard_MedicalPolicing from './FootballCard_MedicalPolicing'
import FootballCard_Transport from './FootballCard_TransportWeather'
import SupportToolModal from '../../football/modals/SupportToolModal'
import StandOccupancyModal from '../../football/modals/StandOccupancyModal'
import { StaffingActual, StaffingDeployment } from '../../football/modals/StaffingModal'
import { FixtureCurrent, FixtureSetup } from '../../football/modals/FixtureModal'
import { TransportCurrent, TransportSetup } from '../../football/modals/TransportModal'

export default function SupportToolsFootball() {
  const [data, setData] = useState<FootballData | null>(null)
  const [activeModal, setActiveModal] = useState<null | 'stand' | 'staff' | 'fixture' | 'transport'>(null)

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

  const handleOpenModal = (modalType: 'stand' | 'staff' | 'fixture' | 'transport') => {
    console.log('handleOpenModal called with:', modalType)
    setActiveModal(modalType)
  }

  useEffect(() => {
    console.log('activeModal changed to:', activeModal)
  }, [activeModal])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
        <div className="col-span-1 md:col-span-2 lg:col-span-2 flex h-[260px]">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.42)] ring-1 ring-white/70 dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5">
            <FootballCard_StandOccupancy 
              className="relative flex-1" 
              onOpenModal={() => handleOpenModal('stand')}
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-2 flex h-[260px]">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.42)] ring-1 ring-white/70 dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5">
            <FootballCard_LiveScore 
              className="relative flex-1" 
              onOpenModal={() => handleOpenModal('fixture')}
            />
          </div>
        </div>

        <div className="col-span-1 flex h-[260px]">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.42)] ring-1 ring-white/70 dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5">
            <FootballCard_MedicalPolicing 
              className="relative flex-1" 
              onOpenModal={() => handleOpenModal('staff')}
            />
          </div>
        </div>

        <div className="col-span-1 flex h-[260px]">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.42)] ring-1 ring-white/70 dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:via-[#14203f] dark:to-[#0f1934] dark:ring-white/5">
            <FootballCard_Transport 
              className="relative flex-1" 
              onOpenModal={() => handleOpenModal('transport')}
            />
          </div>
        </div>
      </div>

      {/* Modals - Always render, control visibility via isOpen prop */}
        <StandOccupancyModal
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

