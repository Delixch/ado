'use client'

import AppShell from '@/components/layout/AppShell'
import LiveAttendanceTile from '@/components/tiles/LiveAttendanceTile'
import StempelTile from '@/components/tiles/StempelTile'
import PendingApprovalsTile from '@/components/tiles/PendingApprovalsTile'
import HaccpStatusTile from '@/components/tiles/HaccpStatusTile'
import AnnouncementTile from '@/components/tiles/AnnouncementTile'
import ShiftTile from '@/components/tiles/ShiftTile'
import SalaryTile from '@/components/tiles/SalaryTile'
import EmployeeListTile from '@/components/tiles/EmployeeListTile'

export default function AdminDashboard() {
  return (
    <AppShell>
      <div className="bento-grid stagger">

        {/* Canlı Yoklama — XL (8 sütun, 2 satır) */}
        <div className="tile-xl">
          <LiveAttendanceTile />
        </div>

        {/* Stempel / Saat — SM (4 sütun) */}
        <div className="tile-4 tile-row-1">
          <StempelTile isAdmin />
        </div>

        {/* Bekleyen Onaylar — SM (4 sütun) */}
        <div className="tile-4 tile-row-1">
          <PendingApprovalsTile />
        </div>

        {/* Vardiya — MD (4 sütun) */}
        <div className="tile-4">
          <ShiftTile />
        </div>

        {/* Maaş Özeti — MD (4 sütun) */}
        <div className="tile-4">
          <SalaryTile />
        </div>

        {/* HACCP — SM (2 sütun) */}
        <div className="tile-2">
          <HaccpStatusTile />
        </div>

        {/* Duyurular — SM (2 sütun) */}
        <div className="tile-2">
          <AnnouncementTile isAdmin />
        </div>

        {/* Personel Listesi — FULL */}
        <div className="tile-full">
          <EmployeeListTile />
        </div>

      </div>
    </AppShell>
  )
}
