import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import TaglineFlow from "@/components/tagline/TaglineFlow"

export const dynamic = "force-dynamic"

export default async function TaglinePage({ params }: { params: Promise<{ tmdb_id: string }> }) {
  const { tmdb_id } = await params
  const tmdbIdNum = Number(tmdb_id)
  const email = await getSessionEmail()
  const profileDoc = email ? await adminDb.collection("profiles").doc(email).get() : null
  const username: string = profileDoc?.exists ? (profileDoc.data() as any).username ?? "" : ""

  const [boardDoc, movieRes, taglinesSnap] = await Promise.all([
    adminDb.collection("tagline_boards").doc(tmdb_id).get(),
    fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`),
    adminDb.collection("taglines").where("tmdb_id", "==", tmdbIdNum).get(),
  ])

  const board = boardDoc.exists ? { id: boardDoc.id, ...boardDoc.data() } as any : null
  const movieData = movieRes.ok ? await movieRes.json() : null
  const movieTitle: string = movieData?.title ?? ""

  const existingMarks = taglinesSnap.docs
    .sort((a, b) => {
      const aT = (a.data() as any).created_at ?? ""
      const bT = (b.data() as any).created_at ?? ""
      return bT > aT ? 1 : -1
    })
    .slice(0, 9)
    .map(d => {
      const data = d.data() as any
      return {
        id: d.id,
        x: data.x, y: data.y,
        zoom: data.zoom,
        bwf: data.bwf, bhf: data.bhf,
        fontSize: data.fontSize,
        creationBoxW: data.creationBoxW ?? null,
        text: data.text ?? "",
        html: data.html ?? "",
        font: data.font ?? "sans-serif",
        color: data.color ?? "#fff",
      }
    })

  return (
    <TaglineFlow
      tmdbId={tmdbIdNum}
      movieTitle={movieTitle}
      initialBoard={board}
      existingMarks={existingMarks}
      username={username}
    />
  )
}
