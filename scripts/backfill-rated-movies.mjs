// One-off: build the rated_movies list (used by the Ratings page) from ratings that already exist.
//
//   node --env-file=.env.local scripts/backfill-rated-movies.mjs [--write]
//
// Sources: every distinct movie_key in weekend_ratings, plus whatever is in the old
// config/weekend_widgets doc. Numeric keys are TMDB ids; legacy slug keys use the titles below.
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const write = process.argv.includes("--write")
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) })
const db = getFirestore()

const LEGACY = { "the-graduate": "The Graduate", "500-days-of-summer": "500 Days of Summer" }
// TMDB ids for the legacy slug-keyed movies (so they get posters and directors too).
const LEGACY_TMDB_IDS = { "the-graduate": 37247, "500-days-of-summer": 19913 }
// Oldest first, from the order the CSV exports were downloaded. Anything not listed goes after these.
const KNOWN_ORDER = ["the-graduate", "500-days-of-summer", "19913", "37247", "550", "1058424"]

const [votes, cfg, existing] = await Promise.all([
  db.collection("weekend_ratings").get(),
  db.collection("config").doc("weekend_widgets").get(),
  db.collection("rated_movies").get(),
])
const keys = new Set(votes.docs.map(d => d.data().movie_key))
const current = cfg.exists ? cfg.data().ratingMovies ?? [] : []
for (const m of current) keys.add(m.key)
const have = new Set(existing.docs.map(d => d.id))

const rank = k => (KNOWN_ORDER.includes(k) ? KNOWN_ORDER.indexOf(k) : current.some(m => m.key === k) ? 1000 : 500)
const ordered = [...keys].sort((a, b) => rank(a) - rank(b))

const rows = []
for (const [i, key] of ordered.entries()) {
  if (have.has(key)) { console.log(`skip ${key} (already in rated_movies)`); continue }
  let title = LEGACY[key] ?? current.find(m => m.key === key)?.title
  let poster_path = null
  let director = ""
  const tmdbId = LEGACY_TMDB_IDS[key] ?? (/^\d+$/.test(key) ? Number(key) : null)
  if (tmdbId) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=en-US&append_to_response=credits`)
    if (res.ok) {
      const m = await res.json()
      if (!LEGACY[key]) title = m.release_date ? `${m.title} (${m.release_date.slice(0, 4)})` : m.title
      poster_path = m.poster_path ?? null
      director = (m.credits?.crew ?? []).filter(c => c.job === "Director").map(c => c.name).join(", ")
    }
  }
  if (!title) { console.log(`skip ${key} (no title found)`); continue }
  const nVotes = votes.docs.filter(d => d.data().movie_key === key).length
  rows.push({ key, title, poster_path, director, tmdb_id: tmdbId, added_at: new Date(Date.UTC(2026, 8, 1, 0, 0, i)).toISOString() })
  console.log(`${String(i + 1).padStart(2)}. ${key.padEnd(20)} ${title}  (${nVotes} votes)`)
}

if (!write) { console.log("\nDry run — nothing written. Re-run with --write."); process.exit(0) }
for (const r of rows) {
  const { key, ...data } = r
  if (data.tmdb_id === null) delete data.tmdb_id
  await db.collection("rated_movies").doc(key).set(data)
}
console.log(`\nWrote ${rows.length} rated_movies docs.`)
