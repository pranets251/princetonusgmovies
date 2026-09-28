import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { fetchTmdbMovie, getTop4, top4Col } from "@/lib/movies"
import { getScreenedIds } from "@/lib/screened"
import { MovieSummary, TOP4_SIZE } from "@/lib/movieTypes"
import { TOP_BY_ID, slim } from "@/lib/topMovies"

export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const ids: number[] = Array.isArray(body?.tmdb_ids) ? body.tmdb_ids.map(Number) : []
  if (ids.length !== TOP4_SIZE || ids.some(id => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== TOP4_SIZE) {
    return NextResponse.json({ error: `Pick ${TOP4_SIZE} different movies` }, { status: 400 })
  }

  const [previous, screened] = await Promise.all([getTop4(email), getScreenedIds()])
  const previousById = new Map((previous ?? []).map(m => [m.tmdb_id, m]))

  // Titles, posters and directors never come from the client: reuse what we already have, else ask TMDB.
  const movies = await Promise.all(
    ids.map(async id => previousById.get(id) ?? (TOP_BY_ID.has(id) ? slim(TOP_BY_ID.get(id)!) : fetchTmdbMovie(id)))
  )
  if (movies.some(m => !m)) return NextResponse.json({ error: "Couldn't look up one of those movies" }, { status: 502 })
  const summaries = (movies as MovieSummary[]).map(m => ({
    tmdb_id: m.tmdb_id,
    title: m.title,
    year: m.year ?? "",
    poster_path: m.poster_path ?? null,
    director: m.director ?? "",
  }))

  // Only newly added movies are checked, so an existing pick isn't lost if it gets screened later.
  const screenedSet = new Set(screened)
  const blocked = summaries.find(m => !previousById.has(m.tmdb_id) && screenedSet.has(m.tmdb_id))
  if (blocked) return NextResponse.json({ error: `${blocked.title} has already been screened` }, { status: 400 })

  await top4Col().doc(email).set({ user_email: email, movies: summaries, updated_at: new Date().toISOString() })
  return NextResponse.json({ ok: true })
}
