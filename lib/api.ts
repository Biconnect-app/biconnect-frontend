import { getIdToken } from "@/lib/firebase/client"

type FetchOptions = RequestInit & { auth?: boolean }

export async function authFetch(input: RequestInfo, init: FetchOptions = {}) {
  const headers = new Headers(init.headers)
  const useAuth = init.auth !== false

  if (useAuth) {
    const token = await getIdToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
