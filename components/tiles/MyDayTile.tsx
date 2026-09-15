'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MyDayTile() {
  const [data, setData] = useState<any>(null)
  const [shift, setShift] = useState<any>(null)
  const [now, setNow] = useState(new Date())
  const supabase = createClient()

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
      if (!emp) return
      const today = new Date().toISOString().split('T')[0]
      const [{ data: tr }, { data: sh }, { data: lb }] = await Promise.all([
        supabase.from('time_records').select('*').eq('employee_id', emp.id).gte('clock_in', today).single(),
        supabase.from('shifts').select('*, departments(name_tr, color)').eq('employee_id', emp.id).eq('date', today).single(),
        supabase.from('leave_balances').select('*').eq('employee_id', emp.id).single(),
      ])
      setData({ timeRecord: tr, leaveBalance: lb })
      setShift(sh)
    }
    fetch()
  }, [])

  const greeting = now.getHours() < 12 ? 'Günaydın' : now.getHours() < 18 ? 'İyi günler' : 'İyi akşamlar'
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="tile tile--primary h-full">
      <div className="flex flex-col gap-4 h-full">
        {/* Greeting */}
        <div>
          <div className="tile__title">{greeting} 👋</div>
          <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.1, background: 'linear-gradient(135deg, var(--color-text), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {timeStr}
          </div>
          <div className="text-muted text-sm mt-1">{dateStr}</div>
        </div>

        {/* Bugünkü Vardiya */}
        {shift ? (
          <div className="stat-card">
            <div className="stat-card__label">Bugünkü Vardiya</div>
            <div className="flex items-center gap-3 mt-1">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: shift.departments?.color || 'var(--color-primary)' }} />
              <span className="font-semibold">{shift.departments?.name_tr}</span>
              <span className="shift-chip shift-chip--morning">{shift.start_time?.slice(0,5)}–{shift.end_time?.slice(0,5)}</span>
            </div>
          </div>
        ) : (
          <div className="stat-card" style={{ borderColor: 'var(--color-border)', opacity: 0.6 }}>
            <div className="stat-card__label">Bugün</div>
            <div className="text-sm text-muted">Vardiya atanmadı</div>
          </div>
        )}

        {/* Hızlı İstatistikler */}
        <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
          <div className="stat-card">
            <div className="stat-card__label">Bugün</div>
            <div className="stat-card__value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {data?.timeRecord?.net_hours ? `${data.timeRecord.net_hours}h` : data?.timeRecord?.clock_in ? '...' : '—'}
            </div>
            <div className="stat-card__sub">çalışıldı</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">İzin Hakkı</div>
            <div className="stat-card__value" style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-accent)' }}>
              {data?.leaveBalance?.remaining_days ?? '—'}
            </div>
            <div className="stat-card__sub">gün kaldı</div>
          </div>
        </div>
      </div>
    </div>
  )
}
