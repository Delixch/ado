'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ShiftTile() {
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('shifts')
        .select('*, employees(users(full_name)), departments(name_tr, color)')
        .eq('date', today)
        .order('start_time')
      setShifts(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const todayStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="tile tile--clickable h-full">
      <div className="tile__header">
        <div>
          <div className="tile__icon">📅</div>
          <div className="tile__title">Bugünkü Vardiyalar</div>
        </div>
        <button className="btn btn--primary btn--xs">+ Ekle</button>
      </div>
      <div className="text-xs text-muted mb-3">{todayStr}</div>
      {loading ? <span className="spinner" /> : shifts.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">Bugün vardiya yok</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-auto flex-1">
          {shifts.map(s => (
            <div key={s.id} className="shift-row">
              <div className="shift-dot" style={{ background: s.departments?.color || 'var(--color-primary)' }} />
              <div className="flex-1 min-width-0">
                <div className="font-semibold text-sm truncate">{(s.employees as any)?.users?.full_name || '—'}</div>
                <div className="text-xs text-muted">{s.departments?.name_tr}</div>
              </div>
              <span className="shift-chip">
                {s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)}
              </span>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .shift-row {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md); background: var(--color-surface-2);
        }
        .shift-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
