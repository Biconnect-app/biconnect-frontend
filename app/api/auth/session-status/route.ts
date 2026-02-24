import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/server"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  return NextResponse.json({ authenticated: !!authUser })
}
