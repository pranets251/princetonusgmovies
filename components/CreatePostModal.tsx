"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Search, ArrowRight } from "lucide-react"
import Image from "next/image"

const TMDB_IMG = "https://image.tmdb.org/t/p/w92"

interface MovieOption {
  id: number
  title: string
  release_date: string
  poster_path: string | null
}

interface CreatePostModalProps {
  onClose: () => void
  preselectedMovie?: { id: number; title: string } | null
  onMovieSelected?: (movie: { id: number; title: string }) => void
}

export default function CreatePostModal({ onClose, preselectedMovie, onMovieSelected }: CreatePostModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState(preselectedMovie?.title ?? "")
  const [results, setResults] = useState<MovieOption[]>([])
  const [selected, setSelected] = useState<MovieOption | null>(
    preselectedMovie ? { id: preselectedMovie.id, title: preselectedMovie.title, release_date: "", poster_path: null } : null
  )
  const [loadingSearch, setLoadingSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!preselectedMovie) inputRef.current?.focus()
  }, [preselectedMovie])

  useEffect(() => {
    if (selected || !query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await fetch(`/api/tmdb?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } finally {
        setLoadingSearch(false)
      }
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selected])

  function selectMovie(m: MovieOption) {
    setSelected(m)
    setQuery(m.title)
    setResults([])
  }

  function clearSelection() {
    setSelected(null)
    setQuery("")
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const year = selected?.release_date?.slice(0, 4) ?? ""

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 overflow-visible"
        style={{ backgroundColor: "var(--card)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold text-white">Write a tagline for…</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Search input */}
          <div className="relative">
            {!selected && (
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { if (!selected) setQuery(e.target.value) }}
              placeholder="Search a movie…"
              readOnly={!!selected}
              className={`w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors ${selected ? "pl-4 pr-10 cursor-default" : "pl-9 pr-4"}`}
            />
            {selected && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}

            {/* Dropdown */}
            {results.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-zinc-700 overflow-hidden shadow-2xl z-10"
                style={{ backgroundColor: "var(--card)" }}
              >
                {results.map(m => {
                  const y = m.release_date?.slice(0, 4)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMovie(m)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-8 h-12 rounded bg-zinc-800 flex-shrink-0 overflow-hidden">
                        {m.poster_path ? (
                          <Image
                            src={`${TMDB_IMG}${m.poster_path}`}
                            alt={m.title}
                            width={32}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium leading-tight">{m.title}</div>
                        {y && <div className="text-xs text-zinc-500 mt-0.5">{y}</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {loadingSearch && !selected && query.trim() && results.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 flex justify-center py-4 rounded-xl border border-zinc-700" style={{ backgroundColor: "var(--card)" }}>
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Movie info when selected */}
          {selected && (
            <div className="text-xs px-1 text-zinc-500">
              {selected.title}{year ? ` (${year})` : ""}
            </div>
          )}

          {/* Continue button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                if (onMovieSelected) {
                  onMovieSelected({ id: selected.id, title: selected.title })
                } else {
                  onClose()
                  router.push(`/tagline/${selected.id}`)
                }
              }}
              className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors ${
                selected
                  ? "bg-white text-black hover:bg-zinc-100"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
