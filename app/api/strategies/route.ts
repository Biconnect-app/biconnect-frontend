import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Fetch only user_id and id from strategies
    const { data: strategies, error } = await supabase
      .from("strategies")
      .select("user_id, id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching strategies:", error)
      return NextResponse.json({ error: "Error al obtener estrategias" }, { status: 500 })
    }

    // Return simplified payload with only user_id and strategy_id
    return NextResponse.json({
      strategies: strategies.map((s) => ({
        user_id: s.user_id,
        strategy_id: s.id,
      })),
    })
  } catch (error) {
    console.error("[v0] Error in strategies API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
