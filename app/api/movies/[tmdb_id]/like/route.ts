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
  const [likeDoc, allSnap] = await Promise.all([
    adminDb.collection("movie_likes").doc(`${tmdb_id}_${email}`).get(),
    adminDb.collection("movie_likes").where("tmdb_id", "==", Number(tmdb_id)).where("liked", "==", true).get(),
  ])

  return NextResponse.json({
    liked: likeDoc.exists ? (likeDoc.data() as any).liked === true : false,
    like_count: allSnap.size,
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

  const likeSnap = await likeRef.get()
  const wasLiked = likeSnap.exists ? (likeSnap.data() as any).liked === true : false
  const newLiked = !wasLiked

  await likeRef.set({ tmdb_id: Number(tmdb_id), user_email: email, liked: newLiked })

  const allSnap = await adminDb.collection("movie_likes").where("tmdb_id", "==", Number(tmdb_id)).where("liked", "==", true).get()
  return NextResponse.json({ liked: newLiked, like_count: allSnap.size })
}
