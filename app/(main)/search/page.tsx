"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import BoardThumbnail from "@/components/BoardThumbnail"
import DashedMovieCard from "@/components/DashedMovieCard"
import { Tagline } from "@/lib/taglineTypes"

interface TmdbMovie {
  id: number
  title: string
  release_date: string
  poster_path: string | null
}

interface UserResult {
  username: string
  photo_url: string | null
}

function useFonts(taglines: Tagline[]) {
  useEffect(() => {
    const fonts = [...new Set(taglines.map(t => t.font).filter(Boolean))]
    if (!fonts.length) return
    const families = fonts.map(f => `family=${encodeURIComponent(f)}`).join("&")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [taglines])
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get("q") ?? ""

  const [tmdbMovies, setTmdbMovies] = useState<TmdbMovie[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [boardTaglines, setBoardTaglines] = useState<Record<number, Tagline[]>>({})
  const [loading, setLoading] = useState(false)
  const [doneQ, setDoneQ] = useState<string | null>(null)
  useFonts(Object.values(boardTaglines).flat())

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setTmdbMovies([]); setBoardTaglines({}); setUsers([])

    async function load() {
      // Fetch TMDB results + user results in parallel
      const [tmdbRes, searchRes] = await Promise.all([
        fetch(`/api/tmdb?q=${encodeURIComponent(q)}`),
        fetch(`/api/search?q=${encodeURIComponent(q)}`),
      ])
      const tmdbData = tmdbRes.ok ? await tmdbRes.json() : { results: [] }
      const searchData = searchRes.ok ? await searchRes.json() : { users: [] }

      const tmdbList: TmdbMovie[] = (tmdbData.results ?? []).slice(0, 8)
      setTmdbMovies(tmdbList)
      setUsers(searchData.users ?? [])

      // Check which TMDB results have boards (fetch taglines for all)
      const boards: Record<number, Tagline[]> = {}
      await Promise.all(tmdbList.map(async m => {
        const res = await fetch(`/api/taglines?tmdb_id=${m.id}`)
        if (res.ok) {
          const { taglines } = await res.json()
          const sorted = (taglines ?? [] as Tagline[])
            .sort((a: Tagline, b: Tagline) => (b.created_at > a.created_at ? 1 : -1))
            .slice(0, 10)
          if (sorted.length > 0) boards[m.id] = sorted
        }
      }))
      setBoardTaglines(boards)
    }

    load().finally(() => { setLoading(false); setDoneQ(q) })
  }, [q])

  if (!q) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-zinc-500 text-sm">Search for a movie above.</p>
    </div>
  )

  return (
    <div>
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-base font-semibold text-white">Results for &ldquo;{q}&rdquo;</h1>
      </div>

      {(loading || doneQ !== q) ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-8">
          {tmdbMovies.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {tmdbMovies.map(m => {
                const tags = boardTaglines[m.id]
                return tags?.length > 0 ? (
                  <BoardThumbnail
                    key={m.id}
                    posterPath={tags[0].poster_path}
                    taglines={tags}
                    movieTitle={m.title}
                    tmdbId={m.id}
                    onClick={() => router.push(`/movie/${m.id}`)}
                  />
                ) : (
                  <DashedMovieCard
                    key={m.id}
                    tmdbId={m.id}
                    title={m.title}
                    year={m.release_date?.slice(0, 4)}
                  />
                )
              })}
            </div>
          )}

          {users.length > 0 && (
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <button
                  key={u.username}
                  onClick={() => router.push(`/profile/${u.username}`)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-white/5 transition-colors text-left"
                  style={{ backgroundColor: "var(--card)" }}
                >
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                    {u.photo_url ? <img src={u.photo_url} alt={u.username} className="w-full h-full object-cover" /> : u.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-semibold">{u.username}</span>
                </button>
              ))}
            </div>
          )}

          {tmdbMovies.length === 0 && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <p className="text-zinc-400 text-sm">No results for &ldquo;{q}&rdquo;.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  )
}
