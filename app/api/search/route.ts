import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"

// Only returns movies that have a Mural (tagline_boards entry)
export async function GET(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim().toLowerCase()
  if (!q) return NextResponse.json({ movies: [], users: [] })

  const boardsSnap = await adminDb.collection("tagline_boards").limit(200).get()

  const movies: any[] = []
  for (const doc of boardsSnap.docs) {
    const d = doc.data() as any
    if ((d.movie_title ?? "").toLowerCase().includes(q)) {
      movies.push({ tmdb_id: d.tmdb_id, movie_title: d.movie_title, poster_path: d.poster_path })
    }
  }

  const profilesSnap = await adminDb
    .collection("profiles")
    .where("username", ">=", q)
    .where("username", "<=", q + "")
    .limit(5)
    .get()

  const users = profilesSnap.docs.map(d => ({
    username: (d.data() as any).username,
    photo_url: (d.data() as any).photo_url ?? null,
  }))

  return NextResponse.json({ movies: movies.slice(0, 12), users })
}
