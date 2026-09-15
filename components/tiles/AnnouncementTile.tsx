'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AnnouncementTile({ isAdmin = false }: { isAdmin?: boolean }) {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3)
      setAnnouncements(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const priorityColor: Record<string, string> = {
    urgent: 'var(--color-danger)',
    high:   'var(--color-warning)',
    normal: 'var(--color-primary)',
    low:    'var(--color-text-muted)',
  }

  return (
    <div className="tile tile--clickable h-full">
      <div className="tile__header">
        <div className="tile__icon">📢</div>
        <div className="tile__title">Duyurular</div>
        {isAdmin && (
          <button className="btn btn--primary btn--xs">+ Yeni</button>
        )}
      </div>
      {loading ? <span className="spinner" /> : announcements.length === 0 ? (
        <div className="text-muted text-sm mt-2">Duyuru yok</div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
          {announcements.map(a => (
            <div key={a.id} className="announcement-item">
              <div style={{ width: 3, height: '100%', minHeight: 32, borderRadius: 'var(--radius-full)', background: priorityColor[a.priority] || 'var(--color-primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-semibold text-sm truncate">{a.title_tr}</div>
                <div className="text-xs text-muted truncate">{a.content_tr}</div>
              </div>
              {a.pinned && <span title="Sabitlenmiş">📌</span>}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .announcement-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-2); border-radius: var(--radius-md);
          background: var(--color-surface-2);
        }
      `}</style>
    </div>
  )
}
