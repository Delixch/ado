'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function MyShiftsTile() {
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
      if (!emp) return

      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const { data } = await supabase
        .from('shifts')
        .select('*, departments(name_tr, color)')
        .eq('employee_id', emp.id)
        .gte('date', monday.toISOString().split('T')[0])
        .lte('date', sunday.toISOString().split('T')[0])
        .order('date')
      setShifts(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + 1)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="tile h-full">
      <div className="tile__header">
        <div className="tile__icon">📅</div>
        <div className="tile__title">Bu Haftaki Vardiyalarım</div>
      </div>
      {loading ? <span className="spinner" /> : (
        <div className="week-grid">
          {weekDays.map((day, i) => {
            const dayStr = day.toISOString().split('T')[0]
            const shift = shifts.find(s => s.date === dayStr)
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div key={i} className={`week-day ${isToday ? 'week-day--today' : ''}`}>
                <div className="week-day__label">{DAYS[i]}</div>
                <div className="week-day__date">{day.getDate()}</div>
                {shift ? (
                  <div className="week-day__shift" style={{ borderColor: shift.departments?.color }}>
                    <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                      {shift.start_time?.slice(0,5)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-bold)', color: shift.departments?.color }}>
                      {shift.departments?.name_tr?.slice(0, 3)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                      {shift.end_time?.slice(0,5)}
                    </div>
                  </div>
                ) : (
                  <div className="week-day__empty">—</div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <style>{`
        .week-grid {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-1);
          margin-top: var(--space-3);
        }
        .week-day {
          display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
          padding: var(--space-2) var(--space-1);
          border-radius: var(--radius-md);
          background: var(--color-surface-2);
        }
        .week-day--today {
          background: var(--color-primary-subtle);
          border: 1px solid var(--color-primary);
        }
        .week-day__label { font-size: var(--font-size-2xs); color: var(--color-text-muted); }
        .week-day__date { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); }
        .week-day__shift {
          width: 100%; border-radius: var(--radius-sm); border-left: 3px solid var(--color-primary);
          padding: var(--space-1); background: var(--color-surface-3);
          display: flex; flex-direction: column; align-items: center;
        }
        .week-day__empty { font-size: var(--font-size-2xs); color: var(--color-text-disabled); }
      `}</style>
    </div>
  )
}
