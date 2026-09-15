'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const sectionNames = ['Kişisel Bilgiler', 'Yasal & Vergi', 'Kimlik & Belgeler', 'Banka Bilgileri', 'İşe Alım']
const weights: Record<number, number> = { 1: 20, 2: 25, 3: 20, 4: 15, 5: 20 }

export default function OnboardingTile() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [empStatus, setEmpStatus] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('employees').select('id, status').eq('user_id', user.id).single()
      if (!emp) return
      setEmpStatus(emp.status)
      const { data } = await supabase.from('onboarding_sections').select('*').eq('employee_id', emp.id).order('section')
      setSections(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (!loading && empStatus === 'active') return null // Aktif çalışana gösterme

  const progress = sections.reduce((total, s) => {
    if (s.status === 'approved') return total + weights[s.section]
    if (s.status === 'filled' || s.status === 'pending_review') return total + weights[s.section] * 0.5
    return total
  }, 0)

  const statusIcon: Record<string, string> = {
    empty: '⬜', filled: '🔵', pending_review: '⏳', approved: '✅', revision_needed: '🔴'
  }
  const statusClass: Record<string, string> = {
    empty: '', filled: 'onboarding-step--filled', pending_review: 'onboarding-step--pending',
    approved: 'onboarding-step--approved', revision_needed: 'onboarding-step--revision'
  }

  return (
    <div className="tile tile--warning h-full">
      <div className="tile__header">
        <div className="tile__icon">📋</div>
        <div>
          <div className="tile__title">Kayıt Formu</div>
          <div className="text-xs text-muted">Hesabınız aktifleşmeden önce tamamlayın</div>
        </div>
        <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: progress >= 100 ? 'var(--color-accent)' : 'var(--color-warning)' }}>
          %{Math.round(progress)}
        </span>
      </div>

      <div className="progress progress--lg mb-4">
        <div className="progress__bar" style={{ width: `${progress}%` }} />
      </div>

      {loading ? <span className="spinner" /> : (
        <div className="flex flex-col gap-2">
          {sections.map(s => (
            <div key={s.section} className={`onboarding-step ${statusClass[s.status] || ''}`}>
              <div className="onboarding-step__number">{s.section}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{sectionNames[s.section - 1]}</div>
                <div className="text-xs text-muted">
                  {s.status === 'empty' ? 'Doldurulmadı' :
                   s.status === 'filled' ? 'Dolduruldu' :
                   s.status === 'pending_review' ? 'İnceleniyor...' :
                   s.status === 'approved' ? 'Onaylandı' :
                   s.notes || 'Düzeltme gerekli'}
                </div>
              </div>
              <span>{statusIcon[s.status] || '⬜'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
