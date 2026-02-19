import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { auth } from '@/auth'
import { routing } from '@/i18n/routing'
import { privateRoutes } from './routes'

const intlMiddleware = createMiddleware(routing)

const authCookieNames = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
]

const isRouteMatch = (pathname: string, route: string) => {
  return pathname === route || pathname.startsWith(`${route}/`)
}

const clearAuthCookies = (response: NextResponse) => {
  authCookieNames.forEach((cookieName) => {
    response.cookies.delete(cookieName)
  })
}

export default auth(async (req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  const localePrefix = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`)
  const normalizedPathname = pathname.replace(localePrefix, '') || '/'
  const isLoggedIn = Boolean(req.auth)
  const isApiRoute = normalizedPathname.startsWith('/api')
  const isAuthPage = normalizedPathname.startsWith('/auth')
  const isSignOutPage = isRouteMatch(normalizedPathname, '/auth/signout')
  const isPrivateRoute = privateRoutes.some((route) => {
    return isRouteMatch(normalizedPathname, route)
  })

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const refreshUntil = token?.data?.validity?.refresh_until
  const isTokenExpired = Boolean(
    token?.error === 'RefreshTokenExpired' ||
      (typeof refreshUntil === 'number' && Date.now() >= refreshUntil * 1000)
  )

  if (isApiRoute) {
    return NextResponse.next()
  }

  if (isPrivateRoute && (!isLoggedIn || isTokenExpired)) {
    const targetPath = isTokenExpired ? '/auth/signout' : '/auth/signin'
    const response = NextResponse.redirect(new URL(targetPath, req.nextUrl.origin))
    clearAuthCookies(response)
    return response
  }

  if (isAuthPage && !isSignOutPage && isLoggedIn && !isTokenExpired) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
  }

  const response = intlMiddleware(req)

  if (isAuthPage && (isTokenExpired || !isLoggedIn)) {
    clearAuthCookies(response)
  }

  return response
})

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
