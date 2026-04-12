import type { Metadata } from 'next'
import './globals.css'
import { UserInit } from '@/components/ui/UserInit'

export const metadata: Metadata = {
  title: 'BrewMaster AI — Premium Coffee Brewing Assistant',
  description: 'Connect your digital scale, get AI-powered recipes tailored to your beans, and brew the perfect cup every time.',
  keywords: ['coffee', 'brewing', 'AI', 'barista', 'scale', 'V60', 'Acaia'],
  authors: [{ name: 'BrewMaster AI' }],
  openGraph: {
    title: 'BrewMaster AI',
    description: 'AI-powered coffee brewing with real-time scale integration',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0a0a0b" />
      </head>
      <body>
        <UserInit />
        {children}
      </body>
    </html>
  )
}
