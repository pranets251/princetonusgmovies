import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getSessionEmail } from "@/lib/session"
import { isAdminEmail } from "@/lib/admin"
import { fetchTmdbMovie, ratedMoviesCol } from "@/lib/movies"
import { forgetScreenedCache, screenedRef } from "@/lib/screened"

async function requireAdmin() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return null
}

// Admin: ask everyone to rate a movie. A movie only gets rated after it has been shown, so it is
// also added to the already-screened list.
export async function POST(req: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json().catch(() => null)
  const tmdbId = Number(body?.tmdb_id)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  const ref = ratedMoviesCol().doc(String(tmdbId))
  if ((await ref.get()).exists) return NextResponse.json({ error: "That movie is already on the list" }, { status: 409 })

  const movie = await fetchTmdbMovie(tmdbId)
  if (!movie) return NextResponse.json({ error: "Couldn't look up that movie" }, { status: 502 })

  await ref.set({
    tmdb_id: tmdbId,
    title: movie.year ? `${movie.title} (${movie.year})` : movie.title,
    poster_path: movie.poster_path,
    director: movie.director,
    added_at: new Date().toISOString(),
  })
  await screenedRef().set({ tmdb_ids: FieldValue.arrayUnion(tmdbId) }, { merge: true })
  forgetScreenedCache()

  return NextResponse.json({ ok: true })
}

// Admin: take a movie off the list (e.g. added by mistake). Votes already cast are kept.
export async function DELETE(req: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const key = new URL(req.url).searchParams.get("key")
  if (!key) return NextResponse.json({ error: "Bad request" }, { status: 400 })
  await ratedMoviesCol().doc(key).delete()
  return NextResponse.json({ ok: true })
}
