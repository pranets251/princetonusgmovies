import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import TaglineFlow from "@/components/tagline/TaglineFlow"

export const dynamic = "force-dynamic"

export default async function TaglinePage({
  params, searchParams,
}: {
  params: Promise<{ tmdb_id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { tmdb_id } = await params
  const { edit: editId } = await searchParams
  const tmdbIdNum = Number(tmdb_id)
  const email = await getSessionEmail()
  const profileDoc = email ? await adminDb.collection("profiles").doc(email).get() : null
  const username: string = profileDoc?.exists ? (profileDoc.data() as any).username ?? "" : ""

  const [boardDoc, movieRes, taglinesSnap, editDoc] = await Promise.all([
    adminDb.collection("tagline_boards").doc(tmdb_id).get(),
    fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`, { next: { revalidate: 86400 } }),
    adminDb.collection("taglines").where("tmdb_id", "==", tmdbIdNum).get(),
    editId ? adminDb.collection("taglines").doc(editId).get() : Promise.resolve(null),
  ])

  const board = boardDoc.exists ? { id: boardDoc.id, ...boardDoc.data() } as any : null
  const movieData = movieRes.ok ? await movieRes.json() : null
  const movieTitle: string = movieData?.title ?? ""

  let editingTagline = null
  if (editDoc?.exists) {
    const data = editDoc.data() as any
    if (data.user_email === email) {
      editingTagline = {
        id: editDoc.id,
        text: data.text ?? "",
        html: data.html ?? "",
        color: data.color ?? "#ffffff",
        x: data.x, y: data.y,
        fontSize: data.fontSize,
      }
    }
  }

  const existingMarks = taglinesSnap.docs
    .filter(d => d.id !== editId)
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
      editingTagline={editingTagline}
    />
  )
}
