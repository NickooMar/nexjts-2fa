import './globals.css'
import { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { auth } from '@/auth'
import { defaultLocale } from '@/i18n/config'
import { SessionChecker } from '@/components/SessionChecker'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/Theme/themeProvider'
import defaultMessages from '../../messages/en.json'

export const metadata: Metadata = {
  title: {
    default: 'HomiQ',
    template: '%s | HomiQ',
  },
  description: 'HomiQ',
  keywords: ['HomiQ', 'Real Estate', 'Property', 'Home', 'Rent', 'Buy'],
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Resolve the session on the server so SessionProvider hydrates
  // authenticated immediately on full-page loads. Without it, useSession()
  // reports "loading"/no user until the client fetches /api/auth/session,
  // making logged-in users briefly appear logged out.
  const session = await auth()

  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <QueryProvider>
            <SessionChecker />
            <NextIntlClientProvider locale={defaultLocale} messages={defaultMessages}>
              <Toaster position='top-right' reverseOrder={false} />
              <ThemeProvider
                attribute='class'
                defaultTheme='system'
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </NextIntlClientProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
