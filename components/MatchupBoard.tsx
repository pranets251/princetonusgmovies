"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Poster from "@/components/Poster"
import DirectorLine from "@/components/DirectorLine"
import MovieAboutModal from "@/components/MovieAboutModal"
import RankingList, { RankingRow } from "@/components/RankingList"
import { applyVote, rankRatings } from "@/lib/elo"
import { Matchup, MovieSummary, posterUrl, Ratings, STARTING_ELO } from "@/lib/movieTypes"

const REFILL_AT = 5
const ADVANCE_DELAY_MS = 180
const FLUSH_EVERY = 5
const FLUSH_AFTER_MS = 6000
const DELTA_VISIBLE_MS = 1800

interface Props {
  initialPairs: Matchup[]
  initialRatings: Ratings
  // Details for every movie already in initialRatings, so the ranking can name them.
  known: MovieSummary[]
}

export default function MatchupBoard({ initialPairs, initialRatings, known }: Props) {
  const [queue, setQueue] = useState<Matchup[]>(initialPairs)
  const [exhausted, setExhausted] = useState(initialPairs.length === 0)
  const [picked, setPicked] = useState<number | null>(null)
  const [about, setAbout] = useState<MovieSummary | null>(null)
  const fetching = useRef(false)

  // Personal Elo. The browser applies each vote immediately so the ranking updates live; votes are then
  // sent to the server in small batches, which recomputes the same numbers and stores them.
  const [ratings, setRatings] = useState<Ratings>(initialRatings)
  const [deltas, setDeltas] = useState<Record<number, number>>({})
  const [names, setNames] = useState(() => new Map(known.map(m => [m.tmdb_id, m])))
  const pending = useRef<[number, number][]>([])
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback((keepalive = false) => {
    if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null }
    const votes = pending.current
    if (votes.length === 0) return
    pending.current = []
    fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votes }),
      keepalive,
    }).catch(() => { pending.current = [...votes, ...pending.current] })
  }, [])

  // Don't lose the last few votes when the student leaves.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flush(true) }
    const onPageHide = () => flush(true)
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", onPageHide)
      flush(true)
    }
  }, [flush])

  const refill = useCallback(async () => {
    if (fetching.current) return
    fetching.current = true
    try {
      const res = await fetch("/api/matchups?count=20")
      const data = res.ok ? await res.json() : { pairs: [] }
      const pairs: Matchup[] = data.pairs ?? []
      if (pairs.length === 0) setExhausted(true)
      else setQueue(q => [...q, ...pairs])
    } catch {
      // transient network failure; the next vote will retry
    } finally {
      fetching.current = false
    }
  }, [])

  useEffect(() => {
    if (queue.length <= REFILL_AT && !exhausted) refill()
  }, [queue.length, exhausted, refill])

  // Warm the browser cache for the pairs coming up next.
  useEffect(() => {
    for (const pair of queue.slice(1, 3)) {
      for (const m of pair) {
        const url = posterUrl(m.poster_path, "w342")
        if (url) new window.Image().src = url
      }
    }
  }, [queue])

  const current = queue[0]

  function choose(winner: MovieSummary, loser: MovieSummary) {
    if (picked !== null) return
    setPicked(winner.tmdb_id)

    const next = applyVote(ratings, winner.tmdb_id, loser.tmdb_id)
    const change = (m: MovieSummary) => next[m.tmdb_id][0] - (ratings[m.tmdb_id]?.[0] ?? STARTING_ELO)
    setDeltas({ [winner.tmdb_id]: change(winner), [loser.tmdb_id]: change(loser) })
    if (deltaTimer.current) clearTimeout(deltaTimer.current)
    deltaTimer.current = setTimeout(() => setDeltas({}), DELTA_VISIBLE_MS)
    setRatings(next)
    setNames(n => new Map(n).set(winner.tmdb_id, winner).set(loser.tmdb_id, loser))

    pending.current.push([winner.tmdb_id, loser.tmdb_id])
    if (pending.current.length >= FLUSH_EVERY) flush()
    else if (!flushTimer.current) flushTimer.current = setTimeout(() => flush(), FLUSH_AFTER_MS)

    setTimeout(() => {
      setQueue(q => q.slice(1))
      setPicked(null)
    }, ADVANCE_DELAY_MS)
  }

  const rankingRows: RankingRow[] = rankRatings(ratings)
    .flatMap(r => {
      const movie = names.get(r.id)
      return movie ? [{ movie, elo: r.elo, delta: deltas[r.id] }] : []
    })

  return (
    <div className="relative flex min-h-full flex-col items-center px-4 pt-6 text-center">
      <p className="text-xl font-bold sm:text-2xl">Tell USG Movies what you&apos;d rather watch.</p>
      <h1 className="text-3xl font-bold sm:text-[42px]">Click to Choose.</h1>

      {current ? (
        <div className="mt-6 flex items-start justify-center gap-4 [--pw:min(300px,32vw,29vh)] sm:gap-10 sm:[--pw:min(300px,36vw,29vh)] lg:[--chrome:520px] lg:[--pw:max(140px,min(300px,20vw,calc((100dvh-var(--chrome))/1.5)))] xl:[--chrome:480px] xl:[--pw:max(140px,min(420px,calc(50vw-410px),calc((100dvh-var(--chrome))/1.5)))]">
          <Choice movie={current[0]} other={current[1]} picked={picked} onChoose={choose} onAbout={setAbout} />
          <div className="or-slot text-base sm:text-xl">OR</div>
          <Choice movie={current[1]} other={current[0]} picked={picked} onChoose={choose} onAbout={setAbout} />
        </div>
      ) : (
        <p className="mt-16 max-w-md text-lg text-neutral-600">
          {exhausted ? "There are no movies left to compare. Check back soon!" : "Loading…"}
        </p>
      )}

      {/* Pinned to the bottom of the frame, with at least 20px of clear space above it. */}
      <div className="mt-auto pb-4 pt-5">
        <p className="max-w-xl border border-black px-4 py-3 text-left text-sm">
          All movies sourced from other students&apos; Top 4&apos;s.
        </p>
      </div>

      {/* Beside the matchup on wide screens (out of the flow, so the two posters stay centred); below it otherwise. */}
      <aside className="mb-24 mt-10 w-full max-w-sm border-2 border-black p-4 xl:absolute xl:right-6 xl:top-1/2 xl:mt-0 xl:mb-0 xl:w-[300px] xl:max-w-none xl:-translate-y-1/2">
        <h2 className="mb-3 text-lg font-bold">Your Elo Ranking</h2>
        <RankingList rows={rankingRows} emptyText="Pick a movie to start your ranking." />
      </aside>

      {about && <MovieAboutModal movie={about} onClose={() => setAbout(null)} />}
    </div>
  )
}

function Choice({
  movie,
  other,
  picked,
  onChoose,
  onAbout,
}: {
  movie: MovieSummary
  other: MovieSummary
  picked: number | null
  onChoose: (winner: MovieSummary, loser: MovieSummary) => void
  onAbout: (movie: MovieSummary) => void
}) {
  const dimmed = picked !== null && picked !== movie.tmdb_id
  return (
    <div className="w-[var(--pw)] text-left">
      <button
        onClick={() => onChoose(movie, other)}
        aria-label={`Choose ${movie.title}`}
        className={`poster-lg block overflow-hidden border border-neutral-300 transition duration-150 ${
          picked === movie.tmdb_id ? "scale-[1.03] ring-4 ring-black" : dimmed ? "opacity-40" : "hover:scale-[1.02] hover:shadow-xl"
        }`}
      >
        <Poster movie={movie} size="w500" eager className="h-full w-full" />
      </button>
      <p className="caption-title mt-3 text-base font-bold leading-snug sm:text-xl">
        {movie.title}
        {movie.year ? ` (${movie.year})` : ""}
      </p>
      <DirectorLine director={movie.director} className="caption-sub text-sm sm:text-lg" />
      <button onClick={() => onAbout(movie)} className="caption-sub mt-1 text-sm font-bold underline hover:text-neutral-600 sm:text-base">
        About
      </button>
    </div>
  )
}
