"use client"

import { useRouter } from "next/navigation"
import { Search, Heart, HeartCrack } from "lucide-react"
import { useState, useEffect } from "react"

const UPCOMING = [
  { date: "Sep 4", title: "After Hours" },
  { date: "Sep 5", title: "Project X (2012)" },
]

const LAST_WEEKEND = [
  { key: "the-graduate",       title: "The Graduate" },
  { key: "500-days-of-summer", title: "500 Days of Summer" },
]

interface RatingState {
  liked: number
  disliked: number
  my_vote: boolean | null
}

export default function RightSidebar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [hoveredRating, setHoveredRating] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, RatingState>>(
    Object.fromEntries(LAST_WEEKEND.map(m => [m.key, { liked: 0, disliked: 0, my_vote: null }]))
  )

  useEffect(() => {
    fetch("/api/weekend-ratings")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.ratings) setRatings(data.ratings) })
      .catch(() => {})
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  async function submitRating(movieKey: string, liked: boolean) {
    const prev = ratings[movieKey]
    // Optimistic update
    setRatings(r => {
      const cur = r[movieKey]
      const newLiked = (cur.my_vote === true ? cur.liked - 1 : cur.liked) + (liked ? 1 : 0)
      const newDisliked = (cur.my_vote === false ? cur.disliked - 1 : cur.disliked) + (!liked ? 1 : 0)
      return {
        ...r,
        [movieKey]: { liked: newLiked, disliked: newDisliked, my_vote: liked },
      }
    })

    const res = await fetch("/api/weekend-rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_key: movieKey, liked }),
    })
    if (res.ok) {
      const data = await res.json()
      setRatings(r => ({ ...r, [movieKey]: { liked: data.liked, disliked: data.disliked, my_vote: data.my_vote } }))
    } else {
      setRatings(r => ({ ...r, [movieKey]: prev }))
    }
  }

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-4 pt-[14px] pb-6 px-4 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies and users"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-8 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </form>

      {/* Next Weekend */}
      <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: "var(--card)" }}>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Next weekend
        </h3>
        <div className="flex flex-col gap-1.5">
          {UPCOMING.map((m, i) => (
            <div key={i} className="text-sm text-white">
              <span className="text-zinc-500 mr-1.5">{m.date}:</span>
              {m.title}
            </div>
          ))}
        </div>
      </div>

      {/* Rate last weekend's movies */}
      <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: "var(--card)" }}>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Rate last weekend&apos;s movies!
        </h3>
        <div className="flex flex-col gap-5">
          {LAST_WEEKEND.map(m => {
            const r = ratings[m.key]
            const voted = r.my_vote !== null
            const total = r.liked + r.disliked
            const likedPct = total > 0 ? Math.round((r.liked / total) * 100) : 50
            const dislikedPct = 100 - likedPct

            return (
              <div key={m.key}>
                <p className="text-sm text-white mb-2">{m.title}</p>

                {!voted ? (
                  /* Pre-vote: two buttons */
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitRating(m.key, true)}
                      onMouseEnter={() => setHoveredRating(`${m.key}-like`)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors"
                      style={{
                        border: `1px solid ${hoveredRating === `${m.key}-like` ? "#ef4444" : "#3f3f46"}`,
                        color: hoveredRating === `${m.key}-like` ? "#ef4444" : "#a1a1aa",
                      }}
                    >
                      <Heart size={16} />
                    </button>
                    <button
                      onClick={() => submitRating(m.key, false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-400 hover:text-zinc-300 transition-colors text-xs"
                    >
                      <HeartCrack size={16} />
                    </button>
                  </div>
                ) : (
                  /* Post-vote: percentage bar */
                  <div>
                    <div className="relative h-2 rounded-full overflow-hidden bg-zinc-700 mb-1.5">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                        style={{ width: `${likedPct}%`, backgroundColor: "#ef4444" }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => submitRating(m.key, true)}
                        onMouseEnter={() => setHoveredRating(`${m.key}-like-bar`)}
                        onMouseLeave={() => setHoveredRating(null)}
                        style={{ color: r.my_vote === true || hoveredRating === `${m.key}-like-bar` ? "#ef4444" : "#71717a" }}
                        className="flex items-center gap-1 text-xs transition-colors"
                      >
                        <Heart size={14} style={{ fill: r.my_vote === true ? "#ef4444" : "none" }} />
                        {likedPct}%
                      </button>
                      <button
                        onClick={() => submitRating(m.key, false)}
                        className={`flex items-center gap-1 text-xs transition-colors ${r.my_vote === false ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-300"}`}
                      >
                        {dislikedPct}%
                        <HeartCrack size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
