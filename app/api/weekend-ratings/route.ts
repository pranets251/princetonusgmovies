import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

const MOVIE_KEYS = ["the-graduate", "500-days-of-summer"]

export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ ratings: {} })

  const ratings: Record<string, { liked: number; disliked: number; my_vote: boolean | null }> = {}

  await Promise.all(
    MOVIE_KEYS.map(async (key) => {
      const [allSnap, mySnap] = await Promise.all([
        adminDb.collection("weekend_ratings").where("movie_key", "==", key).get(),
        adminDb.collection("weekend_ratings").doc(`${key}_${email}`).get(),
      ])

      let liked = 0, disliked = 0
      allSnap.docs.forEach(d => { if ((d.data() as any).liked) liked++; else disliked++ })

      ratings[key] = {
        liked,
        disliked,
        my_vote: mySnap.exists ? (mySnap.data() as any).liked : null,
      }
    })
  )

  return NextResponse.json({ ratings })
}
