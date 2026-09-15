'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SalaryTile() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const now = new Date()
      const { data: records } = await supabase
        .from('salary_records')
        .select('gross_salary, net_salary, actual_hours, employee_id')
        .eq('year', now.getFullYear())
        .eq('month', now.getMonth() + 1)
      if (records && records.length > 0) {
        const totalGross = records.reduce((s, r) => s + (r.gross_salary || 0), 0)
        const totalHours = records.reduce((s, r) => s + (r.actual_hours || 0), 0)
        setData({ totalGross, totalHours, count: records.length })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const month = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  return (
    <div className="tile tile--clickable h-full">
      <div className="tile__header">
        <div className="tile__icon">💰</div>
        <div className="tile__title">Maaş & Saatler</div>
        <span className="badge badge--empty">{month}</span>
      </div>
      {loading ? <span className="spinner" /> : !data ? (
        <div className="text-muted text-sm mt-3">Henüz veri yok</div>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          <div className="stat-card">
            <div className="stat-card__label">Toplam Brüt</div>
            <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>
              CHF {data.totalGross.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-card__sub">{data.count} Çalışan</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Toplam Saat</div>
            <div className="stat-card__value">{data.totalHours.toFixed(1)} Std</div>
          </div>
          <button className="btn btn--ghost btn--sm btn--full">📊 Detay</button>
        </div>
      )}
    </div>
  )
}
