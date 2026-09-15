'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Employee = {
  id: string
  user_id: string
  status: string
  users: { full_name: string; avatar_url: string | null }
  today_record: { clock_in: string | null; clock_out: string | null } | null
}

export default function LiveAttendanceTile() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const supabase = createClient()

  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(ticker)
  }, [])

  useEffect(() => {
    fetchAttendance()

    // Realtime subscription
    const channel = supabase
      .channel('live-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_records' }, () => {
        fetchAttendance()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchAttendance = async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('employees')
      .select(`
        id, user_id, status,
        users (full_name, avatar_url),
        time_records!inner (clock_in, clock_out)
      `)
      .eq('status', 'active')

    setEmployees((data as any) || [])
    setLoading(false)
  }

  const inCount = employees.filter(e =>
    e.today_record?.clock_in && !e.today_record?.clock_out
  ).length
  const outCount = employees.length - inCount

  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="tile tile--primary h-full">
      {/* Header */}
      <div className="tile__header">
        <div className="flex items-center gap-3">
          <div className="tile__icon">👁️</div>
          <div>
            <div className="tile__title">Canlı Yoklama</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{dateStr}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', fontFamily: 'var(--font-family-mono)', color: 'var(--color-accent)' }}>
            {timeStr}
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <span className="badge badge--active">{inCount} İçeride</span>
            <span className="badge badge--absent">{outCount} Dışarıda</span>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <span className="spinner spinner--lg" />
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">👥</div>
          <div className="empty-state__title">Aktif çalışan yok</div>
        </div>
      ) : (
        <div className="live-grid">
          {employees.map(emp => {
            const isIn = emp.today_record?.clock_in && !emp.today_record?.clock_out
            const initials = (emp.users as any)?.full_name
              ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'
            return (
              <div key={emp.id} className={`live-card ${isIn ? 'live-card--in' : 'live-card--out'}`}>
                <div className={`avatar avatar--md ${isIn ? 'avatar--active' : 'avatar--absent'}`}>
                  {initials}
                </div>
                <div className="live-card__info">
                  <div className="live-card__name">{(emp.users as any)?.full_name || '—'}</div>
                  {emp.today_record?.clock_in && (
                    <div className="live-card__time">
                      {new Date(emp.today_record.clock_in).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <span className={`badge ${isIn ? 'badge--active' : 'badge--absent'}`}>
                  {isIn ? 'İçeride' : 'Dışarıda'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .live-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
          flex: 1;
          overflow-y: auto;
        }
        .live-card {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3); border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface-2);
          transition: border-color var(--transition-fast);
        }
        .live-card--in { border-color: rgba(16,185,129,0.3); }
        .live-card--out { opacity: 0.7; }
        .live-card__info { flex: 1; min-width: 0; }
        .live-card__name { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); truncate; }
        .live-card__time { font-size: var(--font-size-xs); color: var(--color-text-muted); }
      `}</style>
    </div>
  )
}
