import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { DEFAULT_UPCOMING, DEFAULT_RATING_MOVIES, RatingMovie } from "@/lib/weekendConfig"

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
    // Movies are chosen from TMDB search results, so each comes with a real tmdb_id —
    // use that as the canonical key so it lines up with the site's existing
    // "already screened" list (config/highlighted_movies), which is keyed by tmdb_id.
    const nextRatingMovies: RatingMovie[] = ratingMovies.map((m: any) => {
      const title = String(m.title ?? "").trim()
      const tmdb_id = typeof m.tmdb_id === "number" ? m.tmdb_id : undefined
      return { key: tmdb_id ? String(tmdb_id) : m.key, title, tmdb_id }
    })
    const nextKeys = new Set(nextRatingMovies.map(m => m.key))
    const removed = currentRatingMovies.filter(m => !nextKeys.has(m.key))

    const newlyPlayedTmdbIds = removed.map(m => m.tmdb_id).filter((id): id is number => typeof id === "number")
    if (newlyPlayedTmdbIds.length > 0) {
      await adminDb.collection("config").doc("highlighted_movies").set(
        { tmdb_ids: FieldValue.arrayUnion(...newlyPlayedTmdbIds) },
        { merge: true }
      )
    }

    for (const movie of removed) {
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
