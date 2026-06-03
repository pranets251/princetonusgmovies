import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tmdb_id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ liked: false, like_count: 0 })

  const { tmdb_id } = await params
  const [likeDoc, boardDoc] = await Promise.all([
    adminDb.collection("movie_likes").doc(`${tmdb_id}_${email}`).get(),
    adminDb.collection("tagline_boards").doc(tmdb_id).get(),
  ])

  return NextResponse.json({
    liked: likeDoc.exists,
    like_count: Math.max(0, (boardDoc.data() as any)?.like_count ?? 0),
  })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tmdb_id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tmdb_id } = await params
  const likeRef = adminDb.collection("movie_likes").doc(`${tmdb_id}_${email}`)
  const boardRef = adminDb.collection("tagline_boards").doc(tmdb_id)

  const likeSnap = await likeRef.get()
  const wasLiked = likeSnap.exists

  await adminDb.runTransaction(async (tx) => {
    const boardSnap = await tx.get(boardRef)
    const current = (boardSnap.data() as any)?.like_count ?? 0
    if (wasLiked) {
      tx.delete(likeRef)
      tx.set(boardRef, { like_count: Math.max(0, current - 1) }, { merge: true })
    } else {
      tx.set(likeRef, { tmdb_id: Number(tmdb_id), user_email: email, created_at: new Date().toISOString() })
      tx.set(boardRef, { like_count: current + 1 }, { merge: true })
    }
  })

  const boardSnap = await boardRef.get()
  return NextResponse.json({
    liked: !wasLiked,
    like_count: Math.max(0, (boardSnap.data() as any)?.like_count ?? 0),
  })
}
