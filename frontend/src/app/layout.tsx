import './globals.css'
import { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { defaultLocale } from '@/i18n/config'
import { SessionChecker } from '@/components/SessionChecker'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>
        <SessionProvider>
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
        </SessionProvider>
      </body>
    </html>
  )
}
