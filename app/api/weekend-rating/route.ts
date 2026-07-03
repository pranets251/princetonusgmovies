import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { movie_key, liked } = await req.json()
  if (!movie_key || liked === undefined) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  await adminDb.collection("weekend_ratings").doc(`${movie_key}_${email}`).set({
    movie_key,
    user_email: email,
    liked,
  })

  const [likedSnap, dislikedSnap] = await Promise.all([
    adminDb.collection("weekend_ratings").where("movie_key", "==", movie_key).where("liked", "==", true).count().get(),
    adminDb.collection("weekend_ratings").where("movie_key", "==", movie_key).where("liked", "==", false).count().get(),
  ])
  const likedCount = likedSnap.data().count
  const dislikedCount = dislikedSnap.data().count

  return NextResponse.json({ liked: likedCount, disliked: dislikedCount, my_vote: liked })
}
