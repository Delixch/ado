'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PendingApprovalsTile() {
  const [counts, setCounts] = useState({ absences: 0, onboarding: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const [{ count: ab }, { count: ob }] = await Promise.all([
        supabase.from('absences').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('onboarding_sections').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      ])
      setCounts({ absences: ab || 0, onboarding: ob || 0 })
      setLoading(false)
    }
    fetch()
  }, [])

  const total = counts.absences + counts.onboarding

  return (
    <div className={`tile tile--clickable h-full ${total > 0 ? 'tile--warning' : ''}`}
      onClick={() => { /* panel açılacak */ }}>
      <div className="tile__header">
        <div className="tile__icon">⏳</div>
        <div className="tile__title">Bekleyen Onaylar</div>
      </div>
      {loading ? <span className="spinner" /> : (
        <>
          <div className="tile__value" style={{ color: total > 0 ? 'var(--color-warning)' : 'var(--color-accent)' }}>
            {total}
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">İzin talepleri</span>
              <span className={`badge ${counts.absences > 0 ? 'badge--leave' : 'badge--empty'}`}>{counts.absences}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Onboarding</span>
              <span className={`badge ${counts.onboarding > 0 ? 'badge--pending' : 'badge--empty'}`}>{counts.onboarding}</span>
            </div>
          </div>
          {total === 0 && (
            <div className="text-muted text-sm mt-3" style={{ color: 'var(--color-accent)' }}>✓ Hepsi tamam</div>
          )}
        </>
      )}
    </div>
  )
}
