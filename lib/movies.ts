import { cache } from "react"
import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { MovieSummary, RatedMovie, Ratings } from "@/lib/movieTypes"

export const top4Col = () => adminDb.collection("top4")
export const eloCol = () => adminDb.collection("elo")
export const globalEloRef = () => adminDb.collection("config").doc("global_elo")

// A student's Top 4 (null until they've saved one). Wrapped in cache() so the layout and page that
// both ask for it during one request share a single read.
export const getTop4 = cache(async (email: string): Promise<MovieSummary[] | null> => {
  const doc = await top4Col().doc(email).get()
  if (!doc.exists) return null
  const movies = (doc.data() as { movies?: MovieSummary[] }).movies ?? []
  return movies.length > 0 ? movies : null
})

// One document per student holds all of their personal Elo ratings.
export async function getRatings(email: string): Promise<Ratings> {
  const doc = await eloCol().doc(email).get()
  return doc.exists ? ((doc.data() as { ratings?: Ratings }).ratings ?? {}) : {}
}

// One document holds everyone's combined Elo ratings (the public leaderboard).
export async function getGlobalRatings(): Promise<Ratings> {
  const doc = await globalEloRef().get()
  return doc.exists ? ((doc.data() as { ratings?: Ratings }).ratings ?? {}) : {}
}

// Who is signed in, and whether they've declared a Top 4 yet.
export async function getViewer(): Promise<{ email: string; hasTop4: boolean } | null> {
  const email = await getSessionEmail()
  if (!email) return null
  return { email, hasTop4: (await getTop4(email)) !== null }
}

export async function fetchTmdbMovie(id: number): Promise<MovieSummary | null> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US&append_to_response=credits`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return null
  const m = await res.json()
  const directors = ((m.credits?.crew ?? []) as { job: string; name: string }[])
    .filter(c => c.job === "Director")
    .map(c => c.name)
  return {
    tmdb_id: m.id,
    title: m.title,
    year: (m.release_date ?? "").slice(0, 4),
    poster_path: m.poster_path ?? null,
    director: directors.join(", "),
    overview: ((m.overview as string) ?? "").trim(),
  }
}

export const ratedMoviesCol = () => adminDb.collection("rated_movies")

// Every movie students have ever been asked to rate, newest first, with vote tallies and
// this student's own vote.
export async function getRatedMovies(email: string): Promise<RatedMovie[]> {
  const snap = await ratedMoviesCol().orderBy("added_at", "desc").get()
  return Promise.all(
    snap.docs.map(async d => {
      const data = d.data()
      const votes = adminDb.collection("weekend_ratings")
      const [up, down, mine] = await Promise.all([
        votes.where("movie_key", "==", d.id).where("liked", "==", true).count().get(),
        votes.where("movie_key", "==", d.id).where("liked", "==", false).count().get(),
        votes.doc(`${d.id}_${email}`).get(),
      ])
      return {
        key: d.id,
        title: data.title as string,
        director: (data.director as string) ?? "",
        poster_path: (data.poster_path as string | null) ?? null,
        liked: up.data().count,
        disliked: down.data().count,
        my_vote: mine.exists ? ((mine.data() as { liked: boolean }).liked) : null,
      }
    })
  )
}
