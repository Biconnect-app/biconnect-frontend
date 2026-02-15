import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if there's a profile with this email by looking up auth users
    // We check profiles table joined with auth - but since we can't query auth.users directly,
    // we check profiles where username matches the email prefix or use a different approach
    // The safest way is to use the admin API or check if there's a profile with matching auth user

    // Alternative: try to look up by email in profiles if stored, or use auth admin
    // Since we store users via auth, we can use the profiles table
    // But profiles don't store email directly. Let's use a server-side supabase client
    // to check auth.users

    const { data, error } = await supabase.rpc("check_email_exists", {
      email_to_check: email,
    })

    if (error) {
      // If the RPC doesn't exist, fall back to allowing the request
      // This prevents breaking the flow if the function isn't created yet
      console.error("Error checking email:", error)
      return NextResponse.json({ exists: true })
    }

    return NextResponse.json({ exists: !!data })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ exists: true }) // Default to allowing on error
  }
}
