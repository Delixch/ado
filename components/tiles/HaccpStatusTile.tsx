'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HaccpStatusTile() {
  const [todayChecks, setTodayChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('haccp_checks').select('*').eq('date', today)
      setTodayChecks(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const morning = todayChecks.filter(c => c.check_time === 'morning')
  const evening = todayChecks.filter(c => c.check_time === 'evening')
  const allOk = todayChecks.every(c => c.in_range)
  const hasWarning = todayChecks.some(c => !c.in_range)

  return (
    <div className={`tile tile--clickable h-full ${hasWarning ? 'tile--danger' : todayChecks.length > 0 ? 'tile--accent' : ''}`}>
      <div className="tile__header">
        <div className="tile__icon">🌡️</div>
        <div className="tile__title">HACCP</div>
      </div>
      {loading ? <span className="spinner" /> : (
        <>
          <div className="tile__value" style={{ color: hasWarning ? 'var(--color-danger)' : 'var(--color-accent)', fontSize: 'var(--font-size-2xl)' }}>
            {hasWarning ? '⚠' : allOk && todayChecks.length > 0 ? '✓' : '—'}
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Sabah</span>
              <span>{morning.length > 0 ? (morning.every(c => c.in_range) ? '✅' : '❌') : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Akşam</span>
              <span>{evening.length > 0 ? (evening.every(c => c.in_range) ? '✅' : '❌') : '—'}</span>
            </div>
          </div>
          {hasWarning && <div className="text-sm mt-2" style={{ color: 'var(--color-danger)' }}>Sıcaklık aralığı dışı!</div>}
        </>
      )}
    </div>
  )
}
