import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { NextResponse } from "next/server"

function getStartDate(period: string): Date | null {
  const now = new Date()
  if (period === "week")  { now.setDate(now.getDate() - 7);        return now }
  if (period === "month") { now.setMonth(now.getMonth() - 1);      return now }
  if (period === "year")  { now.setFullYear(now.getFullYear() - 1); return now }
  return null
}

export async function GET(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period  = searchParams.get("period") ?? "week"
  const limitN  = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100)

  const startDate = getStartDate(period)

  // Count movie_endorsements per tmdb_id within the time window
  let query: FirebaseFirestore.Query = adminDb.collection("movie_endorsements")
  if (startDate) query = query.where("created_at", ">=", startDate.toISOString())

  const [endorsementsSnap, taglinesAllSnap] = await Promise.all([
    query.get(),
    adminDb.collection("taglines").get(),
  ])

  const counts: Record<number, number> = {}
  endorsementsSnap.docs.forEach(d => {
    const data = d.data() as any
    if (data.endorsed === false) return
    const id = data.tmdb_id as number
    if (id) counts[id] = (counts[id] ?? 0) + 1
  })

  // Grouped once and reused below for both the tiebreaker and each movie's displayed taglines
  const taglinesByMovie: Record<number, any[]> = {}
  taglinesAllSnap.docs.forEach(d => {
    const data = d.data() as any
    const tid = data.tmdb_id as number
    if (!tid) return
    const arr = (taglinesByMovie[tid] ??= [])
    if (arr.length < 100) arr.push({ id: d.id, ...data })
  })

  const ranked = Object.entries(counts)
    .map(([id, count]) => ({ tmdb_id: parseInt(id), count }))
    .sort((a, b) =>
      b.count - a.count ||
      (taglinesByMovie[b.tmdb_id]?.length ?? 0) - (taglinesByMovie[a.tmdb_id]?.length ?? 0)
    )
    .slice(0, limitN)

  if (ranked.length === 0) return NextResponse.json({ movies: [] })

  const apiKey = process.env.TMDB_API_KEY

  const movies = (await Promise.all(
    ranked.map(async ({ tmdb_id, count }) => {
      const [boardDoc, tmdbRes] = await Promise.all([
        adminDb.collection("tagline_boards").doc(String(tmdb_id)).get(),
        fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${apiKey}&language=en-US`),
      ])

      const board = boardDoc.exists ? (boardDoc.data() as any) : null
      const taglines = taglinesByMovie[tmdb_id] ?? []
      const tmdbData = tmdbRes.ok ? await tmdbRes.json() : null

      const title = board?.movie_title ?? tmdbData?.title
      if (!title) return null

      return {
        tmdb_id,
        title,
        year: tmdbData?.release_date?.slice(0, 4) ?? "",
        poster_path: board?.poster_path ?? tmdbData?.poster_path ?? null,
        endorse_count: count,
        taglines,
      }
    })
  ))
    .filter(Boolean)
    .map((m, i) => ({ ...m!, rank: i + 1 }))

  return NextResponse.json({ movies })
}
