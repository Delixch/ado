'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = userData?.role || 'employee'
      router.push(role === 'employee' ? '/employee/dashboard' : '/admin/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in-up">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__icon">A</div>
          <div className="login-logo__text">
            <span className="login-logo__name">ADO</span>
            <span className="login-logo__sub">Management</span>
          </div>
        </div>

        <h1 className="login-title">Giriş Yap</h1>
        <p className="login-subtitle">Hesabınıza giriş yapın</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label form-label--required" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label--required" htmlFor="password">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spinner--sm" />
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <p className="login-footer">
          ADO Management &copy; {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          padding: var(--space-4);
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%);
        }
        .login-card {
          width: 100%;
          max-width: 26rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .login-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }
        .login-logo__icon {
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: white;
          box-shadow: var(--shadow-glow-primary);
        }
        .login-logo__text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .login-logo__name {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text);
          letter-spacing: var(--letter-spacing-wider);
        }
        .login-logo__sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          letter-spacing: var(--letter-spacing-widest);
          text-transform: uppercase;
        }
        .login-title {
          font-size: var(--font-size-2xl);
          margin-bottom: calc(var(--space-1) * -1);
        }
        .login-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--space-2);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .login-footer {
          text-align: center;
          font-size: var(--font-size-xs);
          color: var(--color-text-disabled);
          margin-top: var(--space-2);
        }
      `}</style>
    </div>
  )
}
