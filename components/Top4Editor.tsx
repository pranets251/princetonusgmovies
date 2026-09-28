"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import Poster from "@/components/Poster"
import DirectorLine from "@/components/DirectorLine"
import MovieSearchModal from "@/components/MovieSearchModal"
import { MovieSummary, TOP4_SIZE, TmdbSearchResult } from "@/lib/movieTypes"

type Slot = MovieSummary | null

export default function Top4Editor({ initial, isFirstTime }: { initial: MovieSummary[]; isFirstTime: boolean }) {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: TOP4_SIZE }, (_, i) => initial[i] ?? null))
  const [pickingSlot, setPickingSlot] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const filled = slots.filter((s): s is MovieSummary => s !== null)
  const complete = filled.length === TOP4_SIZE
  const changed = slots.some((s, i) => s?.tmdb_id !== initial[i]?.tmdb_id)

  function pick(r: TmdbSearchResult) {
    if (pickingSlot === null) return
    const movie: MovieSummary = {
      tmdb_id: r.id,
      title: r.title,
      year: r.release_date?.slice(0, 4) ?? "",
      poster_path: r.poster_path,
      director: r.director ?? "",
    }
    setSlots(s => s.map((m, i) => (i === pickingSlot ? movie : m)))
    setPickingSlot(null)
  }

  async function save() {
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/top4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_ids: filled.map(m => m.tmdb_id) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Something went wrong. Try again.")
        return
      }
      // The layout decides whether to show the nav bar based on whether a Top 4 exists,
      // so after the first save do a full navigation to pick up the new state.
      if (isFirstTime) window.location.assign("/")
      else { router.push("/"); router.refresh() }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-[42px]">{isFirstTime ? "Pick your Top 4" : "Your Top 4"}</h1>
        <p className="mx-auto mt-2 max-w-xl text-base text-neutral-700 sm:text-lg">
          {isFirstTime
            ? "Choose the four movies you'd most love to see screened."
            : "The four movies you most want to see screened. You can change them any time."}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 [--pw:min(200px,38vw)] sm:grid-cols-4 sm:[--pw:min(220px,19vw)]">
        {slots.map((movie, i) => (
          <div key={i} className="w-[var(--pw)]">
            {movie ? (
              <>
                <div className="relative">
                  <div className="poster-lg overflow-hidden border border-neutral-300">
                    <Poster movie={movie} size="w342" eager className="h-full w-full" />
                  </div>
                  <button
                    onClick={() => setSlots(s => s.map((m, idx) => (idx === i ? null : m)))}
                    aria-label={`Remove ${movie.title}`}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white hover:bg-black hover:text-white"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
                <p className="mt-2 text-sm font-bold leading-snug sm:text-base">
                  {movie.title}{movie.year ? ` (${movie.year})` : ""}
                </p>
                <DirectorLine director={movie.director} className="text-sm" />
              </>
            ) : (
              <button
                onClick={() => setPickingSlot(i)}
                aria-label="Add a movie"
                className="poster-lg flex items-center justify-center border-2 border-dashed border-black text-neutral-500 hover:bg-neutral-100 hover:text-black"
              >
                <Plus size={40} strokeWidth={1.5} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-end gap-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={save}
          disabled={!complete || saving || (!isFirstTime && !changed)}
          className="border-2 border-black bg-black px-10 py-3 text-lg font-bold tracking-wide text-white hover:bg-neutral-800 disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {saving ? "SAVING…" : "SAVE"}
        </button>
        {!complete && <p className="text-sm text-neutral-500">Fill all four slots to save.</p>}
      </div>

      {pickingSlot !== null && (
        <MovieSearchModal
          mode="pick"
          title="Add a movie to your Top 4"
          takenIds={filled.map(m => m.tmdb_id)}
          onPick={pick}
          onClose={() => setPickingSlot(null)}
        />
      )}
    </div>
  )
}
