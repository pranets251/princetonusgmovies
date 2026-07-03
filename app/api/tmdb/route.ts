import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q) return NextResponse.json({ results: [] })

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`,
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) return NextResponse.json({ results: [] })

  const data = await res.json()
  const results = (data.results ?? []).slice(0, 6).map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    release_date: movie.release_date || "",
    poster_path: movie.poster_path ?? null,
  }))

  return NextResponse.json({ results })
}
