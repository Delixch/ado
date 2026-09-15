'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StempelTile({ isAdmin = false }: { isAdmin?: boolean }) {
  const [status, setStatus] = useState<'in' | 'out' | 'break'>('out')
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<any>(null)
  const [elapsed, setElapsed] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentRecord()
  }, [])

  useEffect(() => {
    if (!record?.clock_in || record?.clock_out) return
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(record.clock_in).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [record])

  const fetchCurrentRecord = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!emp) return

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', emp.id)
      .gte('clock_in', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setRecord(data)
      if (data.clock_in && !data.clock_out) setStatus(data.break_start && !data.break_end ? 'break' : 'in')
    }
  }

  const handleStempel = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
    if (!emp) return

    if (status === 'out') {
      await supabase.from('time_records').insert({ employee_id: emp.id, clock_in: new Date().toISOString(), method: 'app' })
      setStatus('in')
    } else if (status === 'in') {
      await supabase.from('time_records').update({ clock_out: new Date().toISOString() }).eq('id', record.id)
      setStatus('out')
    }
    await fetchCurrentRecord()
    setLoading(false)
  }

  const btnConfig = {
    out:   { label: '▶ Çalışmaya Başla', cls: 'btn--accent', color: 'var(--color-accent)' },
    in:    { label: '⏹ Çalışmayı Bitir', cls: 'btn--danger', color: 'var(--color-danger)' },
    break: { label: '▶ Moladan Dön',    cls: 'btn--warning', color: 'var(--color-warning)' },
  }

  const cfg = btnConfig[status]

  return (
    <div className="tile h-full">
      <div className="tile__header">
        <div className="tile__icon">🕐</div>
        <div className="tile__title">Stempel</div>
        <span className={`badge ${status === 'in' ? 'badge--active' : status === 'break' ? 'badge--leave' : 'badge--absent'}`}>
          {status === 'in' ? 'İçeride' : status === 'break' ? 'Molada' : 'Dışarıda'}
        </span>
      </div>

      {status !== 'out' && (
        <div style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          fontFamily: 'var(--font-family-mono)',
          color: cfg.color,
          textAlign: 'center',
          padding: 'var(--space-4) 0',
          letterSpacing: 'var(--letter-spacing-wider)'
        }}>
          {elapsed || '00:00:00'}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        <button className={`btn ${cfg.cls} btn--full`} onClick={handleStempel} disabled={loading}>
          {loading ? <span className="spinner spinner--sm" /> : cfg.label}
        </button>
        {status === 'in' && (
          <button className="btn btn--ghost btn--full btn--sm">☕ Mola Başlat</button>
        )}
        {isAdmin && (
          <button className="btn btn--ghost btn--full btn--sm">📋 Tüm Kayıtlar</button>
        )}
      </div>
    </div>
  )
}
