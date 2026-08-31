"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Search, ChevronDown } from "lucide-react"
import BoardThumbnail from "@/components/BoardThumbnail"
import DashedMovieCard from "@/components/DashedMovieCard"
import TaglineBoardModal from "@/components/TaglineBoardModal"
import { Tagline } from "@/lib/taglineTypes"
import { useFonts } from "@/lib/useFonts"

type Period = "week" | "month" | "year" | "all"
const PERIOD_LABELS: Record<Period, string> = {
  week: "Last 1 week",
  month: "Last 1 month",
  year: "Last 1 year",
  all: "All time",
}

interface Movie {
  rank: number
  tmdb_id: number
  title: string
  year: string
  poster_path: string | null
  endorse_count: number
  taglines: Tagline[]
}

interface TmdbResult {
  id: number
  title: string
  release_date: string
  poster_path: string | null
}

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

export default function FilmRoomPage() {
  const [period, setPeriod] = useState<Period>("all")
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [tmdbDashed, setTmdbDashed] = useState<TmdbResult[]>([])
  const [tmdbSearching, setTmdbSearching] = useState(false)
  const [boardModalTmdbId, setBoardModalTmdbId] = useState<number | null>(null)

  const allTaglines = useMemo(() => movies.flatMap(m => m.taglines), [movies])
  useFonts(allTaglines)

  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies
    const q = normalize(searchQuery)
    return movies.filter(m => normalize(m.title).includes(q))
  }, [movies, searchQuery])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?period=${period}&limit=25`)
      .then(r => r.json())
      .then(data => { setMovies(data.movies ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  // When searching: fetch TMDB for non-ranked results to show as DashedMovieCards
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!searchQuery.trim()) { setTmdbDashed([]); setTmdbSearching(false); return }
    setTmdbSearching(true)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/tmdb?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) { setTmdbSearching(false); return }
      const { results } = await res.json()
      const rankedIds = new Set(movies.map(m => m.tmdb_id))
      setTmdbDashed((results ?? []).filter((r: TmdbResult) => !rankedIds.has(r.id)))
      setTmdbSearching(false)
    }, 400)
  }, [searchQuery, movies])

  return (
    <>
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 p-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter rankings by movie title"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-8 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="relative">
          <button onClick={() => setShowPeriodMenu(v => !v)} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-2 text-xs text-white hover:bg-zinc-800 transition-colors">
            {PERIOD_LABELS[period]}<ChevronDown size={12} />
          </button>
          {showPeriodMenu && (
            <div className="absolute right-0 top-full mt-1 rounded-xl border border-zinc-700 overflow-hidden shadow-xl z-20 min-w-36" style={{ backgroundColor: "var(--card)" }}>
              {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
                <button key={p} onClick={() => { setPeriod(p); setShowPeriodMenu(false) }}
                  className={`block w-full text-left px-4 py-3 text-sm transition-colors ${period === p ? "text-white bg-white/10" : "text-zinc-400 hover:bg-white/5"}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {loading || (tmdbSearching && filteredMovies.length === 0) ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : filteredMovies.length === 0 && tmdbDashed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-zinc-500 text-sm">{movies.length === 0 ? "No ranked movies yet. Start endorsing!" : "No movies match your search."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filteredMovies.map(movie => (
              <div key={movie.tmdb_id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <BoardThumbnail
                  posterPath={movie.poster_path ?? ""}
                  taglines={movie.taglines}
                  movieTitle={movie.title}
                  tmdbId={movie.tmdb_id}
                  onClick={() => setBoardModalTmdbId(movie.tmdb_id)}
                />
                {/* Rank number + endorsement count for the period, permanently below each poster */}
                <p style={{ textAlign: "center", fontSize: 13, color: "#a1a1aa", margin: 0, lineHeight: 1 }}>
                  {movie.rank} &middot; {movie.endorse_count} ♥
                </p>
              </div>
            ))}
            {/* DashedMovieCards for non-ranked TMDB results (only when searching) */}
            {searchQuery.trim() && tmdbDashed.map(m => (
              <DashedMovieCard
                key={m.id}
                tmdbId={m.id}
                title={m.title}
                year={m.release_date?.slice(0, 4)}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    {boardModalTmdbId !== null && (
      <TaglineBoardModal
        tmdbId={boardModalTmdbId}
        onClose={() => setBoardModalTmdbId(null)}
      />
    )}
    </>
  )
}
