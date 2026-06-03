import { NextResponse } from "next/server"

async function getDirector(movieId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.TMDB_API_KEY}&language=en-US`
    )
    if (!res.ok) return null
    const data = await res.json()
    const director = data.crew?.find((c: any) => c.job === "Director")
    return director?.name ?? null
  } catch (error) {
    console.error("Failed to fetch director:", error)
    return null
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q) return NextResponse.json({ results: [] })

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`
  )

  if (!res.ok) return NextResponse.json({ results: [] })

  const data = await res.json()
  const results = data.results?.slice(0, 6) ?? []

  // Fetch directors for each movie in parallel
  const resultsWithDirectors = await Promise.all(
    results.map(async (movie: any) => ({
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date || "",
      poster_path: movie.poster_path ?? null,
      director: await getDirector(movie.id),
    }))
  )

  return NextResponse.json({ results: resultsWithDirectors })
}
