import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const authType = requestUrl.searchParams.get("type")
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const origin = forwardedHost ? `${forwardedProto || "https"}://${forwardedHost}` : requestUrl.origin
  const nextPath = next && next.startsWith("/") ? next : null

  if (code) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("OAuth callback error:", error)
      return NextResponse.redirect(`${origin}/login?error=oauth_error`)
    }

    if (data.user) {
      if (nextPath === "/recuperar/nueva-contrasena") {
        return NextResponse.redirect(`${origin}${nextPath}`)
      }

      // Check if user has a profile, if not create one
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error checking profile:", profileError)
      }

      if (!profile) {
        // Create a profile for new users
        const username = data.user.email?.split("@")[0] || `user_${Date.now()}`
        const firstName = data.user.user_metadata?.first_name || 
                         data.user.user_metadata?.full_name?.split(" ")[0] || 
                         data.user.user_metadata?.name?.split(" ")[0] || ""
        const lastName = data.user.user_metadata?.last_name ||
                        data.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || 
                        data.user.user_metadata?.name?.split(" ").slice(1).join(" ") || ""

        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            username: username,
            first_name: firstName,
            last_name: lastName,
            plan: "free",
          })

        if (insertError) {
          console.error("Error creating profile:", insertError)
          if (insertError.code === "23505") {
            const uniqueUsername = `${username}_${Date.now().toString(36)}`
            await supabase
              .from("profiles")
              .insert({
                id: data.user.id,
                username: uniqueUsername,
                first_name: firstName,
                last_name: lastName,
                plan: "free",
              })
          }
        }
      }

<<<<<<< HEAD
      // If this is a signup confirmation, redirect to a confirmation page
      if (authType === "signup") {
        return NextResponse.redirect(`${origin}/registro/confirmado`)
      }

      // If a next path was provided, redirect there
      if (nextPath) {
        return NextResponse.redirect(`${origin}${nextPath}`)
      }

      // For login/OAuth, redirect based on whether user has strategies
=======
      if (authType === "signup") {
        return NextResponse.redirect(`${origin}/registro/exito`)
      }

      // Check if user has any strategies
>>>>>>> dc4a679 (last local change)
      const { data: strategies, error: strategiesError } = await supabase
        .from("strategies")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1)

      if (strategiesError) {
        console.error("Error checking strategies:", strategiesError)
        return NextResponse.redirect(`${origin}/dashboard/estrategias`)
      }

      if (!strategies || strategies.length === 0) {
        return NextResponse.redirect(`${origin}/dashboard/estrategias/nueva`)
      }

      return NextResponse.redirect(`${origin}/dashboard/estrategias`)
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
