import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const session = await supabase.auth.getSession()
    if (session.data.session) {
      const sessionCreatedAt = new Date(session.data.session.created_at || 0).getTime()
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

      // If session is older than 24 hours, sign out
      if (now - sessionCreatedAt > twentyFourHours) {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("expired", "true")
        return NextResponse.redirect(url)
      }
    }
  }

  // Protect /app routes - require authentication
  if (request.nextUrl.pathname.startsWith("/app") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/registro") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/app/estrategias"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
