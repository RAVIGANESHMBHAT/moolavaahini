import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Step 1: Run next-intl — handles locale detection and / → /kn/ redirects
  const intlResponse = intlMiddleware(request)

  // If next-intl issued a redirect (e.g. / → /kn/), return it immediately.
  if (intlResponse.status !== 200) {
    return intlResponse
  }

  // Step 2: Create a new response that carries next-intl's headers/cookies
  // then layer Supabase session refresh on top of it.
  const response = NextResponse.next({ request })

  // Copy headers and cookies that next-intl set
  intlResponse.headers.forEach((value, key) => response.headers.set(key, value))
  intlResponse.cookies.getAll().forEach(({ name, value }) =>
    response.cookies.set(name, value)
  )

  // Step 3: Refresh Supabase session so tokens stay alive
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
