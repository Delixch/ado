'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type User = { full_name: string; role: string; email: string } | null

const roleLabel: Record<string, string> = {
  super_admin: 'Süper Admin',
  manager: 'Yönetici',
  employee: 'Çalışan',
}

export default function TopBar({ user }: { user: User }) {
  const [lang, setLang] = useState<'tr' | 'de'>('tr')
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="topbar">
      {/* Logo */}
      <div className="topbar__logo">
        <div className="topbar__logo-icon">A</div>
        <span className="topbar__logo-text">ADO Management</span>
      </div>

      {/* Right side */}
      <div className="topbar__right">
        {/* Lang toggle */}
        <button
          className="btn btn--ghost btn--sm topbar__lang"
          onClick={() => setLang(l => l === 'tr' ? 'de' : 'tr')}
          title="Dil Değiştir"
        >
          {lang === 'tr' ? '🇹🇷 TR' : '🇩🇪 DE'}
        </button>

        {/* User menu */}
        <div className="topbar__user" style={{ position: 'relative' }}>
          <button
            className="topbar__user-btn"
            onClick={() => setMenuOpen(o => !o)}
          >
            <div className="avatar avatar--md">{initials}</div>
            <div className="topbar__user-info">
              <span className="topbar__user-name">{user?.full_name || '...'}</span>
              <span className="topbar__user-role">{roleLabel[user?.role || ''] || ''}</span>
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>▾</span>
          </button>

          {menuOpen && (
            <div className="topbar__dropdown">
              <div className="topbar__dropdown-email">{user?.email}</div>
              <hr className="divider" style={{ margin: 'var(--space-2) 0' }} />
              <button className="topbar__dropdown-item" onClick={handleLogout}>
                🚪 Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .topbar__logo { display: flex; align-items: center; gap: var(--space-3); }
        .topbar__logo-icon {
          width: 2rem; height: 2rem;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-weight: var(--font-weight-extrabold); color: white;
          font-size: var(--font-size-sm);
        }
        .topbar__logo-text {
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
          letter-spacing: var(--letter-spacing-wide);
        }
        .topbar__right { display: flex; align-items: center; gap: var(--space-3); }
        .topbar__lang { font-size: var(--font-size-xs); }
        .topbar__user-btn {
          display: flex; align-items: center; gap: var(--space-2);
          background: none; border: none; cursor: pointer; padding: var(--space-1);
          border-radius: var(--radius-lg);
          transition: background var(--transition-fast);
        }
        .topbar__user-btn:hover { background: var(--color-surface-2); }
        .topbar__user-info { display: flex; flex-direction: column; align-items: flex-start; }
        .topbar__user-name { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text); }
        .topbar__user-role { font-size: var(--font-size-2xs); color: var(--color-text-muted); }
        .topbar__dropdown {
          position: absolute; top: calc(100% + var(--space-2)); right: 0;
          background: var(--color-surface-2); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); padding: var(--space-3);
          min-width: 14rem; z-index: var(--z-dropdown);
          box-shadow: var(--shadow-lg);
          animation: fadeInDown var(--duration-fast) var(--ease-out) both;
        }
        .topbar__dropdown-email { font-size: var(--font-size-xs); color: var(--color-text-muted); padding: 0 var(--space-1); }
        .topbar__dropdown-item {
          width: 100%; text-align: left; background: none; border: none; cursor: pointer;
          padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
          font-size: var(--font-size-sm); color: var(--color-text);
          transition: background var(--transition-fast);
        }
        .topbar__dropdown-item:hover { background: var(--color-surface-hover); color: var(--color-danger); }
      `}</style>
    </header>
  )
}
