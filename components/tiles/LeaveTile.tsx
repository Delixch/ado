'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LeaveTile() {
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
      if (!emp) return
      const { data } = await supabase.from('leave_balances').select('*').eq('employee_id', emp.id).single()
      setBalance(data)
      setLoading(false)
    }
    fetch()
  }, [])

  const pct = balance ? Math.round((balance.used_days / balance.total_days) * 100) : 0

  return (
    <div className="tile tile--clickable h-full">
      <div className="tile__header">
        <div className="tile__icon">🌴</div>
        <div className="tile__title">İzin Hakkı</div>
      </div>
      {loading ? <span className="spinner" /> : !balance ? (
        <div className="text-muted text-sm">Veri yok</div>
      ) : (
        <>
          <div className="tile__value" style={{ color: 'var(--color-accent)' }}>
            {balance.total_days - balance.used_days}
            <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', marginLeft: 4 }}>gün</span>
          </div>
          <div className="progress progress--sm mt-3">
            <div className="progress__bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>{balance.used_days} kullanıldı</span>
            <span>{balance.total_days} toplam</span>
          </div>
          <button className="btn btn--outline btn--sm btn--full mt-4">+ İzin Talep Et</button>
        </>
      )}
    </div>
  )
}
