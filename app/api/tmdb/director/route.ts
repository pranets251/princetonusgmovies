import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tmdbId = searchParams.get("id")

  if (!tmdbId) {
    return NextResponse.json({ director: null })
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      return NextResponse.json({ director: null })
    }

    const data = await res.json()
    const director =
      data.credits?.crew?.find((c: { job: string; name: string }) => c.job === "Director")
        ?.name ?? null

    return NextResponse.json({ director })
  } catch {
    return NextResponse.json({ director: null })
  }
}
