// Snapshots a TMDB community list (default: list 634, "Top 250 IMDB") into data/top-movies.json, so the
// home page can pick matchups with no database reads. Re-run to refresh the list.
//
//   node --env-file=.env.local scripts/build-top-movies.mjs [list_id]
import fs from "node:fs"

const LIST_ID = process.argv[2] ?? "634"
const TOP_BILLED = 5
const KEY = process.env.TMDB_API_KEY
const api = async path => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${KEY}&language=en-US`)
    if (res.ok) return res.json()
    await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
  }
  throw new Error(`TMDB failed for ${path}`)
}

const first = await api(`/list/${LIST_ID}?page=1`)
console.log(`List ${LIST_ID}: "${first.name}", ${first.total_results} items, ${first.total_pages} pages`)
const rest = await Promise.all(Array.from({ length: first.total_pages - 1 }, (_, i) => api(`/list/${LIST_ID}?page=${i + 2}`)))
const list = [first, ...rest].flatMap(p => p.items).filter(m => (m.media_type ?? "movie") === "movie")
const movies = [...new Map(list.map(m => [m.id, m])).values()]
console.log(`${movies.length} movies; looking up directors…`)

const out = []
for (let i = 0; i < movies.length; i += 10) {
  const details = await Promise.all(movies.slice(i, i + 10).map(m => api(`/movie/${m.id}/credits`).catch(() => ({ crew: [], cast: [] }))))
  details.forEach((d, j) => {
    const m = movies[i + j]
    out.push({
      id: m.id,
      title: m.title,
      year: (m.release_date ?? "").slice(0, 4),
      poster: m.poster_path ?? null,
      director: (d.crew ?? []).filter(c => c.job === "Director").map(c => c.name).join(", "),
      // Top-billed actors, in billing order.
      cast: (d.cast ?? []).sort((a, b) => a.order - b.order).slice(0, TOP_BILLED).map(c => c.name),
      overview: (m.overview ?? "").replace(/\s+/g, " ").trim(),
    })
  })
}
fs.writeFileSync(new URL("../data/top-movies.json", import.meta.url), JSON.stringify(out))
console.log(`Wrote data/top-movies.json: ${out.length} movies, ${Math.round(fs.statSync(new URL("../data/top-movies.json", import.meta.url)).size / 1024)} KB`)
console.log("no poster:", out.filter(m => !m.poster).length, "| no director:", out.filter(m => !m.director).length, "| no overview:", out.filter(m => !m.overview).length, "| no cast:", out.filter(m => m.cast.length === 0).length)
console.log("first 5:", out.slice(0, 5).map(m => `${m.title} (${m.year})`).join("; "))
