'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar/Navbar'
import { privateRoutes } from '@/routes'
import { routing } from '@/i18n/routing'

export function RouteNavbar () {
  const pathname = usePathname()
  const localePrefix = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`)
  const normalizedPathname = pathname.replace(localePrefix, '') || '/'
  const routePathname =
    normalizedPathname !== '/' && normalizedPathname.endsWith('/')
      ? normalizedPathname.slice(0, -1)
      : normalizedPathname
  const isPrivateRoute = privateRoutes.includes(routePathname)

  if (isPrivateRoute) {
    return null
  }

  return <Navbar />
}
