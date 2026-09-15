import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/tokens.css'
import '@/styles/reset.css'
import '@/styles/layout.css'
import '@/styles/components.css'
import '@/styles/animations.css'
import '@/styles/mobile.css'
import '@/styles/tablet.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ADO Management',
  description: 'Gastronomi İşyeri Yönetim Sistemi',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0B0F1A" />
      </head>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  )
}
