"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ThumbsDown, ThumbsUp, X } from "lucide-react"
import Poster from "@/components/Poster"
import DirectorLine from "@/components/DirectorLine"
import MovieSearchModal from "@/components/MovieSearchModal"
import { RatedMovie, TmdbSearchResult } from "@/lib/movieTypes"

export default function RatingsBoard({ movies: initial, isAdmin }: { movies: RatedMovie[]; isAdmin: boolean }) {
  const router = useRouter()
  const [movies, setMovies] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")
  const voteVersion = useRef<Record<string, number>>({})

  // Clicking the thumb that's already lit takes the vote back.
  async function vote(key: string, direction: boolean) {
    const prev = movies.find(m => m.key === key)
    if (!prev) return
    const liked: boolean | null = prev.my_vote === direction ? null : direction
    const version = (voteVersion.current[key] ?? 0) + 1
    voteVersion.current[key] = version

    setMovies(list =>
      list.map(m =>
        m.key !== key ? m : {
          ...m,
          liked: m.liked + (liked === true ? 1 : 0) - (m.my_vote === true ? 1 : 0),
          disliked: m.disliked + (liked === false ? 1 : 0) - (m.my_vote === false ? 1 : 0),
          my_vote: liked,
        }
      )
    )

    const res = await fetch("/api/weekend-rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_key: key, liked }),
    }).catch(() => null)

    if (voteVersion.current[key] !== version) return
    if (res?.ok) {
      const data = await res.json()
      setMovies(list => list.map(m => (m.key === key ? { ...m, liked: data.liked, disliked: data.disliked, my_vote: data.my_vote } : m)))
    } else {
      setMovies(list => list.map(m => (m.key === key ? prev : m)))
    }
  }

  async function addMovie(r: TmdbSearchResult) {
    setAdding(false)
    setError("")
    const res = await fetch("/api/rated-movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id: r.id }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Couldn't add that movie. Try again.")
      return
    }
    router.refresh()
  }

  async function removeMovie(m: RatedMovie) {
    if (!window.confirm(`Remove "${m.title}" from this page? Votes already cast are kept.`)) return
    const res = await fetch(`/api/rated-movies?key=${encodeURIComponent(m.key)}`, { method: "DELETE" })
    if (res.ok) setMovies(list => list.filter(x => x.key !== m.key))
  }

  // `initial` only changes when the server re-renders (after an add); pick up the fresh list then.
  const [seen, setSeen] = useState(initial)
  if (seen !== initial) {
    setSeen(initial)
    setMovies(initial)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-black pb-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Rate past screenings</h1>
        {isAdmin && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 border-2 border-black bg-black px-4 py-2 font-bold text-white hover:bg-neutral-800"
          >
            <Plus size={18} /> Add movie
          </button>
        )}
      </div>
      {error && <p className="pt-3 text-sm text-red-600">{error}</p>}

      {movies.length === 0 ? (
        <p className="pt-10 text-center text-lg text-neutral-600">No films are open for rating yet.</p>
      ) : (
        <ul>
          {movies.map(m => {
            const total = m.liked + m.disliked
            const likedPct = total > 0 ? Math.round((m.liked / total) * 100) : 0
            return (
              <li key={m.key} className="flex items-center gap-4 border-b border-neutral-400 py-4">
                <Poster movie={m} size="w185" className="h-[96px] w-16 shrink-0 border border-neutral-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-tight sm:text-xl">{m.title}</p>
                  <DirectorLine director={m.director} className="text-base" />

                  <div
                    className="mt-2 flex h-3 w-full overflow-hidden bg-neutral-300"
                    role="img"
                    aria-label={total > 0 ? `${likedPct}% liked, ${100 - likedPct}% disliked, ${total} ratings` : "No ratings yet"}
                  >
                    {total > 0 && (
                      <>
                        <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${likedPct}%` }} />
                        <div className="h-full flex-1 bg-red-600" />
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {total > 0 ? `${likedPct}% liked · ${total} rating${total === 1 ? "" : "s"}` : "No ratings yet"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {([true, false] as const).map(isUp => {
                    const Icon = isUp ? ThumbsUp : ThumbsDown
                    const lit = m.my_vote === isUp
                    return (
                      <button
                        key={String(isUp)}
                        onClick={() => vote(m.key, isUp)}
                        aria-label={`${isUp ? "Thumbs up" : "Thumbs down"} for ${m.title}`}
                        aria-pressed={lit}
                        className={`flex h-10 w-10 items-center justify-center border-2 ${
                          lit
                            ? isUp ? "border-green-600 bg-green-600 text-white" : "border-red-600 bg-red-600 text-white"
                            : `border-black bg-white ${isUp ? "hover:border-green-600 hover:text-green-600" : "hover:border-red-600 hover:text-red-600"}`
                        }`}
                      >
                        <Icon size={18} fill={lit ? "currentColor" : "none"} />
                      </button>
                    )
                  })}
                  {isAdmin && (
                    <button
                      onClick={() => removeMovie(m)}
                      aria-label={`Remove ${m.title}`}
                      className="flex h-10 w-6 items-center justify-center text-neutral-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {adding && (
        <MovieSearchModal
          mode="pick"
          title="Add a movie to rate"
          blockScreened={false}
          takenIds={movies.map(m => Number(m.key)).filter(Number.isFinite)}
          onPick={addMovie}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
