import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes (giriş gerekmez)
  const publicRoutes = ['/', '/login', '/auth/callback']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/auth/'))
  const isKiosk = pathname.startsWith('/kiosk')

  // Giriş yapmamış kullanıcıyı login'e yönlendir
  if (!user && !isPublic && !isKiosk) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Giriş yapmış kullanıcı rol bazlı yönlendirme
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role || 'employee'

    // Login sayfasına gelirse dashboard'a yönlendir
    if (pathname === '/' || pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'employee' ? '/employee/dashboard' : '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    // Admin rotasına employee girmesin
    if (pathname.startsWith('/admin') && role === 'employee') {
      const url = request.nextUrl.clone()
      url.pathname = '/employee/dashboard'
      return NextResponse.redirect(url)
    }

    // Employee rotasına admin girerse admin'e yönlendir
    if (pathname.startsWith('/employee') && role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
