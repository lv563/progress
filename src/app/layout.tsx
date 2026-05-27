import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'Kingdom OS — Tu sistema operativo de vida',
  description: 'Organiza tu vida completa: hábitos, productividad, ministerio, físico y más.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-full bg-[#0A0A0F] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
