import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

// Popcorn = likes + 2 × taglines
export async function GET() {
  const snap = await adminDb.collection("taglines").get()

  const byMovie = new Map<number, {
    tmdb_id: number
    movie_title: string
    poster_path: string
    taglineCount: number
    likeCount: number
    taglines: any[]
  }>()

  for (const doc of snap.docs) {
    const d = doc.data() as any
    const id = d.tmdb_id as number
    if (!byMovie.has(id)) {
      byMovie.set(id, { tmdb_id: id, movie_title: d.movie_title, poster_path: d.poster_path, taglineCount: 0, likeCount: 0, taglines: [] })
    }
    const entry = byMovie.get(id)!
    entry.taglineCount++
    entry.likeCount += d.like_count ?? 0
    if (entry.taglines.length < 4) entry.taglines.push({ id: doc.id, ...d })
  }

  const ranked = [...byMovie.values()]
    .map(m => ({ ...m, popcorn: m.likeCount + 2 * m.taglineCount }))
    .sort((a, b) => b.popcorn - a.popcorn)
    .slice(0, 20)

  return NextResponse.json({ movies: ranked })
}
