import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/images?api_key=${process.env.TMDB_API_KEY}`
  )
  if (!res.ok) return NextResponse.json({ posters: [] })
  const data = await res.json()

  const posters: string[] = (data.posters ?? [])
    .filter((p: any) => !p.iso_639_1 || p.iso_639_1 === "en")
    .map((p: any) => p.file_path as string)

  return NextResponse.json({ posters })
}
