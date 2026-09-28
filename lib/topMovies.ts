import data from "@/data/top-movies.json"
import { Matchup, MovieSummary } from "@/lib/movieTypes"

// The movies students are matched against: TMDB community list 634 ("Top 250 IMDB"), snapshotted into
// data/top-movies.json by scripts/build-top-movies.mjs. It's a static file, so choosing matchups
// costs no database reads.
interface Row { id: number; title: string; year: string; poster: string | null; director: string; overview: string; cast: string[] }

export const TOP_MOVIES: MovieSummary[] = (data as Row[]).map(r => ({
  tmdb_id: r.id,
  title: r.title,
  year: r.year,
  poster_path: r.poster,
  director: r.director,
  overview: r.overview,
  cast: r.cast,
}))

export const TOP_BY_ID = new Map(TOP_MOVIES.map(m => [m.tmdb_id, m]))

// Same movie without the (bulky) overview, for lists that never show it.
export function slim(m: MovieSummary): MovieSummary {
  return { tmdb_id: m.tmdb_id, title: m.title, year: m.year, poster_path: m.poster_path, director: m.director }
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Random head-to-head pairs from the list, skipping already-screened movies and avoiding the same
// pair twice in a row.
export function buildMatchups(count: number, screened: Set<number>): Matchup[] {
  const pool = TOP_MOVIES.filter(m => !screened.has(m.tmdb_id))
  if (pool.length < 2) return []

  const pairs: Matchup[] = []
  let prev: Set<number> | null = null
  for (let n = 0; n < count; n++) {
    let pair: Matchup
    let attempts = 0
    do {
      const [a, b] = shuffled(pool)
      pair = [a, b]
      attempts++
    } while (prev && attempts < 5 && prev.has(pair[0].tmdb_id) && prev.has(pair[1].tmdb_id))
    prev = new Set([pair[0].tmdb_id, pair[1].tmdb_id])
    pairs.push(pair)
  }
  return pairs
}
