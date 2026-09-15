'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const statusBadge: Record<string, string> = {
  active: 'badge--active',
  onboarding: 'badge--pending',
  inactive: 'badge--absent',
  terminated: 'badge--empty',
}
const statusLabel: Record<string, string> = {
  active: 'Aktif',
  onboarding: 'Kayıt',
  inactive: 'Pasif',
  terminated: 'Ayrıldı',
}

export default function EmployeeListTile() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('employees')
        .select('*, users(full_name, email, avatar_url), departments(name_tr, color)')
        .order('created_at', { ascending: false })
      setEmployees(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = employees.filter(e =>
    !search || (e.users?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="tile h-full">
      <div className="tile__header">
        <div className="flex items-center gap-2">
          <div className="tile__icon">👥</div>
          <div className="tile__title">Personel Listesi</div>
          <span className="badge badge--empty">{employees.length} kişi</span>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            className="form-input"
            placeholder="Ad ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '12rem', padding: 'var(--space-1-5) var(--space-3)' }}
          />
          <button className="btn btn--primary btn--sm">+ Yeni Çalışan</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-12) 0' }}>
          <span className="spinner spinner--lg" />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Çalışan</th>
                <th>Departman</th>
                <th>No</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>Çalışan bulunamadı</td></tr>
              ) : filtered.map(emp => {
                const initials = emp.users?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar--sm">{initials}</div>
                        <div>
                          <div className="font-semibold text-sm">{emp.users?.full_name || '—'}</div>
                          <div className="text-xs text-muted">{emp.users?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {emp.departments ? (
                        <div className="flex items-center gap-2">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: emp.departments.color, flexShrink: 0 }} />
                          <span className="text-sm">{emp.departments.name_tr}</span>
                        </div>
                      ) : <span className="text-muted text-sm">—</span>}
                    </td>
                    <td><span className="text-sm text-muted font-mono">{emp.employee_number}</span></td>
                    <td><span className={`badge ${statusBadge[emp.status] || 'badge--empty'}`}>{statusLabel[emp.status] || emp.status}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn--ghost btn--xs">📋</button>
                        <button className="btn btn--ghost btn--xs">✏️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
