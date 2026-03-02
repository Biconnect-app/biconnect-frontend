import { getAdminAuth } from "@/lib/firebase/admin"

type AuthUser = {
  uid: string
  email?: string
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization")
  if (!header) return null
  const [type, token] = header.split(" ")
  if (type !== "Bearer" || !token) return null
  return token
}

function getCookieToken(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim())
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`))
  if (!found) return null
  return decodeURIComponent(found.split("=")[1])
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const bearer = getBearerToken(request)
  const sessionCookie = getCookieToken(request, "session")
  if (!bearer && !sessionCookie) {
    return null
  }

  try {
    const adminAuth = getAdminAuth()
    const decoded = bearer
      ? await adminAuth.verifyIdToken(bearer)
      : await adminAuth.verifySessionCookie(sessionCookie as string, true)
    return { uid: decoded.uid, email: decoded.email }
  } catch (error) {
    console.error("Auth token verification failed:", error)
    return null
  }
}
