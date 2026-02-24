import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function initAdmin() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  return getAuth()
}

export function getAdminAuth() {
  const auth = initAdmin()
  if (!auth) {
    throw new Error("Missing Firebase admin credentials")
  }
  return auth
}
