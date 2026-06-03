"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import TaglineCard from "@/components/TaglineCard"
import { Tagline } from "@/lib/taglineTypes"

interface TrendingMovie {
  tmdb_id: number
  movie_title: string
  poster_path: string
  taglineCount: number
  likeCount: number
  popcorn: number
  taglines: Tagline[]
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

export default function TrendingPage() {
  const [movies, setMovies] = useState<TrendingMovie[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const allTaglines = movies.flatMap(m => m.taglines)
  useFonts(allTaglines)

  useEffect(() => {
    fetch("/api/trending")
      .then(r => r.json())
      .then(data => setMovies(data.movies ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-base font-semibold text-white">Trending</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Ranked by Popcorn = likes + 2 × taglines</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : movies.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-zinc-500 text-sm">No data yet.</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-6">
            {movies.map((m, idx) => (
              <div key={m.tmdb_id}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold text-zinc-700 w-8 text-right">{idx + 1}</span>
                  <div>
                    <button
                      onClick={() => router.push(`/movie/${m.tmdb_id}`)}
                      className="text-sm font-semibold text-white hover:underline text-left"
                    >
                      {m.movie_title}
                    </button>
                    <p className="text-xs text-zinc-500">
                      🍿 {m.popcorn} · {m.taglineCount} tagline{m.taglineCount !== 1 ? "s" : ""} · {m.likeCount} like{m.likeCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div style={{ columns: 2, columnGap: 12 }}>
                  {m.taglines.slice(0, 4).map(t => (
                    <div key={t.id} style={{ breakInside: "avoid", marginBottom: 12 }}>
                      <TaglineCard tagline={t} onClick={() => router.push(`/post/${t.id}`)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
