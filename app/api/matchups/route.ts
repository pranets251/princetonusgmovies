import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { getScreenedSetCached } from "@/lib/screened"
import { buildMatchups } from "@/lib/topMovies"

export async function GET(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const requested = Number(new URL(req.url).searchParams.get("count") ?? 20)
  const count = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested), 1), 30) : 20

  return NextResponse.json({ pairs: buildMatchups(count, await getScreenedSetCached()) })
}
