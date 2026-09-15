"use client"

import { ThumbsUp, ThumbsDown, Pencil } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import SearchBox from "@/components/SearchBox"
import { useCurrentUsername } from "@/components/CurrentUserContext"
import { DEFAULT_UPCOMING, DEFAULT_RATING_MOVIES, UpcomingMovie, RatingMovie } from "@/lib/weekendConfig"

const ADMIN_USERNAME = "ps3514"

interface RatingState {
  liked: number
  disliked: number
  my_vote: boolean | null
}

const GOLD = "#F5B800"
const GOLD_SHADOW = "#7c5800"

function voteButtonStyle(direction: "up" | "down", lit: boolean, pressing: boolean): React.CSSProperties {
  const litBg = direction === "up" ? GOLD : "#fff"
  const litColor = direction === "up" ? "#fff" : "#000"
  const litShadow = direction === "up" ? GOLD_SHADOW : "#a1a1aa"
  return {
    background: lit ? litBg : "#3f3f46",
    color: lit ? litColor : "#fff",
    boxShadow: pressing
      ? `0 1px 0 ${lit ? litShadow : "#27272a"}, 0 2px 4px rgba(0,0,0,0.35)`
      : `0 4px 0 ${lit ? litShadow : "#27272a"}, 0 6px 14px rgba(0,0,0,0.35)`,
    transform: pressing ? "translateY(3px)" : "translateY(0)",
    transition: "transform 0.08s ease, box-shadow 0.08s ease, background 0.15s ease, color 0.15s ease",
  }
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const editInputClass = "bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"

export default function RightSidebar() {
  const currentUsername = useCurrentUsername()
  const isAdmin = currentUsername === ADMIN_USERNAME

  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>(DEFAULT_UPCOMING)
  const [ratingMovies, setRatingMovies] = useState<RatingMovie[]>(DEFAULT_RATING_MOVIES)
  const [pressingKey, setPressingKey] = useState<string | null>(null)
  const voteVersionRef = useRef<Record<string, number>>({})
  const [ratings, setRatings] = useState<Record<string, RatingState>>({})

  const [editingUpcoming, setEditingUpcoming] = useState(false)
  const [upcomingDraft, setUpcomingDraft] = useState<UpcomingMovie[]>(DEFAULT_UPCOMING)
  const [savingUpcoming, setSavingUpcoming] = useState(false)

  const [editingRatingMovies, setEditingRatingMovies] = useState(false)
  const [ratingMoviesDraft, setRatingMoviesDraft] = useState<string[]>(DEFAULT_RATING_MOVIES.map(m => m.title))
  const [savingRatingMovies, setSavingRatingMovies] = useState(false)

  function loadRatings() {
    fetch("/api/weekend-ratings")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.ratings) setRatings(data.ratings) })
      .catch(() => {})
  }

  useEffect(() => {
    fetch("/api/config/weekend-widgets")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.upcoming) setUpcoming(data.upcoming)
        if (data?.ratingMovies) setRatingMovies(data.ratingMovies)
      })
      .catch(() => {})
      .finally(loadRatings)
  }, [])

  async function submitRating(movieKey: string, liked: boolean) {
    const prev = ratings[movieKey]
    const version = (voteVersionRef.current[movieKey] ?? 0) + 1
    voteVersionRef.current[movieKey] = version

    setRatings(r => {
      const cur = r[movieKey] ?? { liked: 0, disliked: 0, my_vote: null }
      const newLiked = (cur.my_vote === true ? cur.liked - 1 : cur.liked) + (liked ? 1 : 0)
      const newDisliked = (cur.my_vote === false ? cur.disliked - 1 : cur.disliked) + (!liked ? 1 : 0)
      return { ...r, [movieKey]: { liked: newLiked, disliked: newDisliked, my_vote: liked } }
    })

    const res = await fetch("/api/weekend-rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_key: movieKey, liked }),
    })

    if (voteVersionRef.current[movieKey] !== version) return
    if (res.ok) {
      const data = await res.json()
      setRatings(r => ({ ...r, [movieKey]: { liked: data.liked, disliked: data.disliked, my_vote: data.my_vote } }))
    } else if (prev) {
      setRatings(r => ({ ...r, [movieKey]: prev }))
    }
  }

  function startEditUpcoming() {
    setUpcomingDraft(upcoming)
    setEditingUpcoming(true)
  }

  function updateUpcomingDraft(i: number, field: "date" | "title", value: string) {
    setUpcomingDraft(d => d.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  async function saveUpcoming() {
    setSavingUpcoming(true)
    try {
      const res = await fetch("/api/config/weekend-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upcoming: upcomingDraft }),
      })
      if (res.ok) {
        setUpcoming(upcomingDraft)
        setEditingUpcoming(false)
      }
    } finally {
      setSavingUpcoming(false)
    }
  }

  function startEditRatingMovies() {
    setRatingMoviesDraft(ratingMovies.map(m => m.title))
    setEditingRatingMovies(true)
  }

  function updateRatingMovieDraft(i: number, value: string) {
    setRatingMoviesDraft(d => d.map((t, idx) => idx === i ? value : t))
  }

  async function saveRatingMovies() {
    setSavingRatingMovies(true)
    try {
      const res = await fetch("/api/config/weekend-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingMovies: ratingMoviesDraft.map(title => ({ title })) }),
      })
      if (res.ok) {
        const data = await res.json()
        for (const csv of data.csvExports ?? []) downloadCsv(csv.filename, csv.content)

        const configRes = await fetch("/api/config/weekend-widgets")
        if (configRes.ok) {
          const configData = await configRes.json()
          if (configData.ratingMovies) setRatingMovies(configData.ratingMovies)
        }
        loadRatings()
        setEditingRatingMovies(false)
      }
    } finally {
      setSavingRatingMovies(false)
    }
  }

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-4 pt-[14px] pb-6 px-4 sticky top-0 h-screen overflow-y-auto">
      <SearchBox />

      {/* Next Weekend */}
      <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: "var(--card)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Next weekend
          </h3>
          {isAdmin && !editingUpcoming && (
            <button onClick={startEditUpcoming} className="text-zinc-500 hover:text-white transition-colors" aria-label="Edit next weekend movies">
              <Pencil size={12} />
            </button>
          )}
        </div>

        {editingUpcoming ? (
          <div className="flex flex-col gap-2">
            {upcomingDraft.map((m, i) => (
              <div key={i} className="flex gap-1.5">
                <input value={m.date} onChange={e => updateUpcomingDraft(i, "date", e.target.value)} placeholder="Date" className={`w-16 ${editInputClass}`} />
                <input value={m.title} onChange={e => updateUpcomingDraft(i, "title", e.target.value)} placeholder="Title" className={`flex-1 ${editInputClass}`} />
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <button onClick={saveUpcoming} disabled={savingUpcoming} className="flex-1 text-xs font-semibold bg-white text-black rounded py-1.5 disabled:opacity-50">
                {savingUpcoming ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingUpcoming(false)} className="flex-1 text-xs font-semibold border border-zinc-700 text-zinc-300 rounded py-1.5 hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {upcoming.map((m, i) => (
              <div key={i} className="text-sm text-white">
                <span className="text-zinc-500 mr-1.5">{m.date}:</span>
                {m.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate last weekend's movies */}
      <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: "var(--card)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Rate last weekend&apos;s movies!
          </h3>
          {isAdmin && !editingRatingMovies && (
            <button onClick={startEditRatingMovies} className="text-zinc-500 hover:text-white transition-colors" aria-label="Edit rated movies">
              <Pencil size={12} />
            </button>
          )}
        </div>

        {editingRatingMovies ? (
          <div className="flex flex-col gap-2">
            {ratingMoviesDraft.map((title, i) => (
              <input key={i} value={title} onChange={e => updateRatingMovieDraft(i, e.target.value)} placeholder="Movie title" className={`w-full ${editInputClass}`} />
            ))}
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Swapping out a movie here marks it as played and downloads a CSV of its ratings.
            </p>
            <div className="flex gap-2 mt-1">
              <button onClick={saveRatingMovies} disabled={savingRatingMovies} className="flex-1 text-xs font-semibold bg-white text-black rounded py-1.5 disabled:opacity-50">
                {savingRatingMovies ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingRatingMovies(false)} className="flex-1 text-xs font-semibold border border-zinc-700 text-zinc-300 rounded py-1.5 hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {ratingMovies.map(m => {
              const r = ratings[m.key] ?? { liked: 0, disliked: 0, my_vote: null }
              const voted = r.my_vote !== null
              const total = r.liked + r.disliked
              const likedPct = total > 0 ? Math.round((r.liked / total) * 100) : 50
              const dislikedPct = 100 - likedPct

              return (
                <div key={m.key}>
                  <p className="text-sm text-white mb-2">{m.title}</p>

                  {!voted ? (
                    /* Pre-vote: two 3D buttons */
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitRating(m.key, true)}
                        onMouseDown={() => setPressingKey(`${m.key}-up`)}
                        onMouseUp={() => setPressingKey(null)}
                        onMouseLeave={() => setPressingKey(null)}
                        className="flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-semibold"
                        style={voteButtonStyle("up", false, pressingKey === `${m.key}-up`)}
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button
                        onClick={() => submitRating(m.key, false)}
                        onMouseDown={() => setPressingKey(`${m.key}-down`)}
                        onMouseUp={() => setPressingKey(null)}
                        onMouseLeave={() => setPressingKey(null)}
                        className="flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-semibold"
                        style={voteButtonStyle("down", false, pressingKey === `${m.key}-down`)}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  ) : (
                    /* Post-vote: 3D buttons stay lit on the chosen option */
                    <div>
                      <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "#52525b" }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                          style={{ width: `${likedPct}%`, backgroundColor: r.my_vote === true ? GOLD : "#52525b" }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitRating(m.key, true)}
                          onMouseDown={() => setPressingKey(`${m.key}-up`)}
                          onMouseUp={() => setPressingKey(null)}
                          onMouseLeave={() => setPressingKey(null)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
                          style={voteButtonStyle("up", r.my_vote === true, pressingKey === `${m.key}-up`)}
                        >
                          <ThumbsUp size={14} fill={r.my_vote === true ? "currentColor" : "none"} />
                          {likedPct}%
                        </button>
                        <button
                          onClick={() => submitRating(m.key, false)}
                          onMouseDown={() => setPressingKey(`${m.key}-down`)}
                          onMouseUp={() => setPressingKey(null)}
                          onMouseLeave={() => setPressingKey(null)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
                          style={voteButtonStyle("down", r.my_vote === false, pressingKey === `${m.key}-down`)}
                        >
                          {dislikedPct}%
                          <ThumbsDown size={14} fill={r.my_vote === false ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: "var(--card)" }}>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Suggestions & concerns
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Have a site suggestion or concern? Reach out at{" "}
          <a
            href="mailto:ps3514@princeton.edu"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            ps3514@princeton.edu
          </a>
        </p>
      </div>
    </aside>
  )
}
