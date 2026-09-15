import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { DEFAULT_UPCOMING, DEFAULT_RATING_MOVIES, RatingMovie, slugify } from "@/lib/weekendConfig"

const ADMIN_USERNAME = "ps3514"

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function toCsv(rows: { user_email: string; liked: boolean }[]): string {
  const header = "user_email,liked"
  const lines = rows.map(r => `${csvEscape(r.user_email)},${r.liked}`)
  return [header, ...lines].join("\n")
}

export async function GET() {
  const doc = await adminDb.collection("config").doc("weekend_widgets").get()
  const data = doc.exists ? (doc.data() as any) : {}
  return NextResponse.json({
    upcoming: data.upcoming ?? DEFAULT_UPCOMING,
    ratingMovies: data.ratingMovies ?? DEFAULT_RATING_MOVIES,
  })
}

export async function PATCH(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  const username = profileDoc.exists ? (profileDoc.data() as any).username : null
  if (username !== ADMIN_USERNAME) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { upcoming, ratingMovies } = await req.json()

  const configRef = adminDb.collection("config").doc("weekend_widgets")
  const currentSnap = await configRef.get()
  const current = currentSnap.exists ? (currentSnap.data() as any) : {}
  const currentRatingMovies: RatingMovie[] = current.ratingMovies ?? DEFAULT_RATING_MOVIES

  const updates: Record<string, unknown> = {}
  if (Array.isArray(upcoming)) {
    updates.upcoming = upcoming.map((m: any) => ({ date: String(m.date ?? "").trim(), title: String(m.title ?? "").trim() }))
  }

  const csvExports: { filename: string; content: string }[] = []

  if (Array.isArray(ratingMovies)) {
    const nextRatingMovies: RatingMovie[] = ratingMovies.map((m: any) => {
      const title = String(m.title ?? "").trim()
      return { key: m.key || slugify(title), title }
    })
    const nextKeys = new Set(nextRatingMovies.map(m => m.key))
    const removed = currentRatingMovies.filter(m => !nextKeys.has(m.key))

    for (const movie of removed) {
      await adminDb.collection("played_movies").add({
        key: movie.key,
        title: movie.title,
        played_at: new Date().toISOString(),
      })

      const ratingsSnap = await adminDb.collection("weekend_ratings").where("movie_key", "==", movie.key).get()
      const rows = ratingsSnap.docs.map(d => {
        const rd = d.data() as any
        return { user_email: rd.user_email as string, liked: rd.liked as boolean }
      })
      csvExports.push({ filename: `${movie.key}-ratings.csv`, content: toCsv(rows) })
    }

    updates.ratingMovies = nextRatingMovies
  }

  await configRef.set(updates, { merge: true })

  return NextResponse.json({ ok: true, csvExports })
}
