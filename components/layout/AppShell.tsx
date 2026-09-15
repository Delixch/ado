'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'

type User = { id: string; full_name: string; role: string; email: string }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('users').select('*').single().then(({ data }) => {
      if (data) setUser(data)
    })
  }, [])

  return (
    <div className="app-shell">
      <TopBar user={user} />
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
