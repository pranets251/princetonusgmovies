import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tmdb_id, movie_title, poster_path } = await req.json()
  const ref = adminDb.collection("tagline_boards").doc(String(tmdb_id))

  // Race-safe: if another user created it first, return the existing board
  const existing = await ref.get()
  if (existing.exists) return NextResponse.json({ board: { id: existing.id, ...existing.data() } })

  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  const username = profileDoc.exists ? (profileDoc.data() as any).username : ""

  const board = {
    tmdb_id,
    movie_title,
    poster_path,
    created_by: email,
    created_by_username: username,
    created_at: new Date().toISOString(),
    taglines: [],
  }
  await ref.set(board)

  return NextResponse.json({ board: { id: String(tmdb_id), ...board } })
}
