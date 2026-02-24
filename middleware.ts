import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard")
  const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/registro"
  const isConfirmationPage = request.nextUrl.pathname === "/registro/confirmado" ||
    request.nextUrl.pathname === "/registro/exito"

  if (isDashboard && !sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (isAuthPage && sessionCookie && !isConfirmationPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard/estrategias"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
