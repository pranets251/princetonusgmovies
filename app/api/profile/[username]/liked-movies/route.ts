import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { username } = await params

  const profileSnap = await adminDb.collection("profiles").where("username", "==", username).limit(1).get()
  if (profileSnap.empty) return NextResponse.json({ movies: [] })

  const profileEmail = profileSnap.docs[0].id

  const likesSnap = await adminDb
    .collection("movie_likes")
    .where("user_email", "==", profileEmail)
    .where("liked", "==", true)
    .get()

  if (likesSnap.empty) return NextResponse.json({ movies: [] })

  const tmdbIds = likesSnap.docs
    .sort((a, b) => ((b.data() as any).created_at > (a.data() as any).created_at ? 1 : -1))
    .map(d => (d.data() as any).tmdb_id as number)

  const movies = await Promise.all(
    tmdbIds.map(async (tmdb_id) => {
      const [boardDoc, taglinesSnap] = await Promise.all([
        adminDb.collection("tagline_boards").doc(String(tmdb_id)).get(),
        adminDb.collection("taglines").where("tmdb_id", "==", tmdb_id).limit(100).get(),
      ])
      if (!boardDoc.exists) return null
      const board = boardDoc.data() as any
      const taglines = taglinesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      return { tmdb_id, movie_title: board.movie_title, poster_path: board.poster_path, taglines }
    })
  )

  return NextResponse.json({ movies: movies.filter(Boolean) })
}
