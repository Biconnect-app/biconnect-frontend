"use client"

// Simulated authentication - In production, integrate with real backend
export function login(email: string, password: string): boolean {
  // Simulate login validation
  if (email && password.length >= 8) {
    localStorage.setItem("biconnect_user", JSON.stringify({ email, name: email.split("@")[0] }))
    localStorage.setItem("biconnect_auth", "true")
    return true
  }
  return false
}

export function register(data: {
  name: string
  username: string
  email: string
  password: string
  plan: string
}): boolean {
  // Simulate registration
  if (data.email && data.password.length >= 8) {
    localStorage.setItem("biconnect_user", JSON.stringify({ email: data.email, name: data.name, plan: data.plan }))
    localStorage.setItem("biconnect_auth", "true")
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem("biconnect_user")
  localStorage.removeItem("biconnect_auth")
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("biconnect_auth") === "true"
}

export function getCurrentUser(): { email: string; name: string; plan?: string } | null {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("biconnect_user")
  return user ? JSON.parse(user) : null
}
