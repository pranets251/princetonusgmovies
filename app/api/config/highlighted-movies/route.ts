import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getSessionEmail } from "@/lib/session"
import { isAdminEmail } from "@/lib/admin"
import { forgetScreenedCache, getScreenedIds, screenedRef } from "@/lib/screened"

// "highlighted_movies" is the site's already-screened list, keyed by TMDB id.
export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ tmdb_ids: await getScreenedIds() })
}

export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const tmdbId = Number(body?.tmdb_id)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  await screenedRef().set({ tmdb_ids: FieldValue.arrayUnion(tmdbId) }, { merge: true })
  forgetScreenedCache()
  return NextResponse.json({ ok: true })
}
