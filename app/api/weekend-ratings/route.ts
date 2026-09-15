import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"
import { DEFAULT_RATING_MOVIES } from "@/lib/weekendConfig"

export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ ratings: {} })

  const configDoc = await adminDb.collection("config").doc("weekend_widgets").get()
  const ratingMovies = configDoc.exists ? ((configDoc.data() as any).ratingMovies ?? DEFAULT_RATING_MOVIES) : DEFAULT_RATING_MOVIES
  const movieKeys: string[] = ratingMovies.map((m: any) => m.key)

  const ratings: Record<string, { liked: number; disliked: number; my_vote: boolean | null }> = {}

  await Promise.all(
    movieKeys.map(async (key) => {
      const [likedSnap, dislikedSnap, mySnap] = await Promise.all([
        adminDb.collection("weekend_ratings").where("movie_key", "==", key).where("liked", "==", true).count().get(),
        adminDb.collection("weekend_ratings").where("movie_key", "==", key).where("liked", "==", false).count().get(),
        adminDb.collection("weekend_ratings").doc(`${key}_${email}`).get(),
      ])

      const liked = likedSnap.data().count
      const disliked = dislikedSnap.data().count

      ratings[key] = {
        liked,
        disliked,
        my_vote: mySnap.exists ? (mySnap.data() as any).liked : null,
      }
    })
  )

  return NextResponse.json({ ratings })
}
