import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"

interface TmdbMovie {
  id: number
  title: string
  release_date?: string
  poster_path?: string | null
}

async function directorOf(id: number): Promise<string> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${process.env.TMDB_API_KEY}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return ""
    const credits = await res.json()
    return ((credits.crew ?? []) as { job: string; name: string }[])
      .filter(c => c.job === "Director")
      .map(c => c.name)
      .join(", ")
  } catch {
    return ""
  }
}

export async function GET(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = new URL(req.url).searchParams.get("q")?.trim()
  if (!q) return NextResponse.json({ results: [] })

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`,
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) return NextResponse.json({ results: [] })

  const data = await res.json()
  const movies = ((data.results ?? []) as TmdbMovie[]).slice(0, 10)
  // Search results don't include crew, so look each director up (cached for a day per movie).
  const directors = await Promise.all(movies.map(m => directorOf(m.id)))
  const results = movies.map((movie, i) => ({
    id: movie.id,
    title: movie.title,
    release_date: movie.release_date || "",
    poster_path: movie.poster_path ?? null,
    director: directors[i],
  }))

  return NextResponse.json({ results })
}
