import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const apiKey = process.env.TMDB_API_KEY

  const [movieRes, creditsRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`),
    fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}&language=en-US`),
  ])

  if (!movieRes.ok) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const movie = await movieRes.json()
  const credits = creditsRes.ok ? await creditsRes.json() : null
  const director = credits?.crew?.find((c: any) => c.job === "Director")?.name ?? null

  return NextResponse.json({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4) ?? "",
    overview: movie.overview,
    poster_path: movie.poster_path ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    director,
  })
}
