'use client'

import AppShell from '@/components/layout/AppShell'
import StempelTile from '@/components/tiles/StempelTile'
import AnnouncementTile from '@/components/tiles/AnnouncementTile'
import MyDayTile from '@/components/tiles/MyDayTile'
import MyShiftsTile from '@/components/tiles/MyShiftsTile'
import LeaveTile from '@/components/tiles/LeaveTile'
import OnboardingTile from '@/components/tiles/OnboardingTile'

export default function EmployeeDashboard() {
  return (
    <AppShell>
      <div className="bento-grid stagger">

        {/* Bugünüm — LG (6 sütun, 2 satır) */}
        <div className="tile-lg">
          <MyDayTile />
        </div>

        {/* Stempel — SM (3 sütun) */}
        <div className="tile-3">
          <StempelTile />
        </div>

        {/* İzin Bakiyesi — SM (3 sütun) */}
        <div className="tile-3">
          <LeaveTile />
        </div>

        {/* Onboarding — MD (6 sütun) — sadece onboarding'deyse göster */}
        <div className="tile-6">
          <OnboardingTile />
        </div>

        {/* Kendi Vardiyalarım — MD (4 sütun) */}
        <div className="tile-4">
          <MyShiftsTile />
        </div>

        {/* Duyurular — MD (8 sütun) */}
        <div className="tile-8">
          <AnnouncementTile />
        </div>

      </div>
    </AppShell>
  )
}
