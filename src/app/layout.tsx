import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kingdom OS — Tu sistema operativo de vida',
  description: 'Organiza tu vida completa: hábitos, productividad, ministerio, físico y más.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash of wrong theme on load */}
        <script dangerouslySetInnerHTML={{ __html: `try{var s=JSON.parse(localStorage.getItem('kingdom-app')||'{}');if(s?.state?.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
      </head>
      <body className="min-h-full bg-[#0A0A0A] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
