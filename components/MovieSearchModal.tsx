"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import Poster from "@/components/Poster"
import DirectorLine from "@/components/DirectorLine"
import { TmdbSearchResult } from "@/lib/movieTypes"

interface Props {
  title: string
  onClose: () => void
  // "pick": choose a movie and hand it back.  "screen": admin marks movies as already screened, one click each.
  mode: "pick" | "screen"
  onPick?: (movie: TmdbSearchResult) => void
  // Pick mode only: ids the caller has already chosen (shown as taken and unclickable).
  takenIds?: number[]
  // Pick mode only: set false to let already-screened movies be chosen (used for the weekend-rating slots).
  blockScreened?: boolean
}

export default function MovieSearchModal({ title, onClose, mode, onPick, takenIds = [], blockScreened = true }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [screened, setScreened] = useState<Set<number>>(new Set())
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetch("/api/config/highlighted-movies")
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.tmdb_ids) setScreened(new Set<number>(data.tmdb_ids)) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  function handleQueryChange(value: string) {
    setQuery(value)
    const hasQuery = value.trim().length > 0
    setSearching(hasQuery)
    if (!hasQuery) setResults([])
  }

  useEffect(() => {
    abortRef.current?.abort()
    const q = query.trim()
    if (!q) return
    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const data = res.ok ? await res.json() : { results: [] }
        setResults(data.results ?? [])
        setSearching(false)
      } catch {
        // aborted by a newer keystroke; that request owns the loading state now
      }
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  async function handleClick(r: TmdbSearchResult) {
    setError("")
    if (mode === "pick") {
      onPick?.(r)
      return
    }
    setSavingId(r.id)
    const res = await fetch("/api/config/highlighted-movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id: r.id }),
    })
    setSavingId(null)
    if (res.ok) setScreened(s => new Set(s).add(r.id))
    else setError("Couldn't add that movie. Try again.")
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh] sm:items-center sm:pt-0"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-label={title} className="pop-in flex max-h-[76vh] w-full max-w-lg flex-col border-2 border-black bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="hover:text-neutral-300"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-2 border-b border-neutral-300 px-4 py-3">
          <Search size={18} className="shrink-0 text-neutral-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search movie titles"
            className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400"
          />
        </div>

        {error && <p className="px-4 pt-2 text-sm text-red-600">{error}</p>}

        <div className="overflow-y-auto">
          {searching && results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">Searching…</p>
          ) : query.trim() && !searching && results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">No matches.</p>
          ) : (
            results.map(r => {
              const isScreened = screened.has(r.id)
              const isTaken = takenIds.includes(r.id)
              const note =
                isScreened && (mode === "screen" || blockScreened) ? "Already screened"
                : isTaken && mode === "pick" ? "Already in your Top 4"
                : ""
              const disabled =
                mode === "screen" ? isScreened || savingId === r.id
                : (isScreened && blockScreened) || isTaken
              const year = r.release_date?.slice(0, 4)
              return (
                <button
                  key={r.id}
                  onClick={() => handleClick(r)}
                  disabled={disabled}
                  className={`flex w-full items-center gap-3 border-b border-neutral-200 px-4 py-2 text-left ${
                    disabled ? "bg-neutral-100 opacity-50" : "hover:bg-neutral-100"
                  }`}
                >
                  <Poster movie={r} size="w185" className="h-16 w-[42px] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{r.title}{year ? ` (${year})` : ""}</span>
                    <DirectorLine director={r.director} className="truncate text-sm" />
                    {mode === "screen" && !isScreened && <span className="block text-sm text-neutral-500">Click to mark as screened</span>}
                    {note && <span className="block text-sm font-bold text-neutral-600">{note}</span>}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
