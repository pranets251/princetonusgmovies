"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import RankingList from "@/components/RankingList"
import { MovieSummary } from "@/lib/movieTypes"

type Person = { netid: string; name: string }

const MAX_SUGGESTIONS = 8

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

// Every typed word has to start some word of the name: "pra sw" finds "Pranet Swain".
function matches(name: string, query: string): boolean {
  const words = normalize(name).split(/[\s-]+/)
  return normalize(query).split(/\s+/).filter(Boolean).every(q => words.some(w => w.startsWith(q)))
}

// Find another student's personal Elo ranking by name, with suggestions filled in as you type.
// The full name list is downloaded once when this opens, so typing costs no database reads.
export default function UserRankingModal({ onClose }: { onClose: () => void }) {
  const [people, setPeople] = useState<Person[] | null>(null)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const [chosen, setChosen] = useState<Person | null>(null)
  const [ranking, setRanking] = useState<{ movie: MovieSummary; elo: number }[] | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetch("/api/users")
      .then(r => (r.ok ? r.json() : null))
      .then(data => setPeople(data ? (data.users as [string, string][]).map(([netid, name]) => ({ netid, name })) : []))
      .catch(() => setPeople([]))
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const suggestions = useMemo(() => {
    if (!people || !query.trim() || chosen) return []
    const found = people.filter(p => matches(p.name, query))
    const q = normalize(query.trim())
    // Names that start with what was typed come first.
    found.sort((a, b) => Number(normalize(b.name).startsWith(q)) - Number(normalize(a.name).startsWith(q)) || a.name.localeCompare(b.name))
    return found.slice(0, MAX_SUGGESTIONS)
  }, [people, query, chosen])

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, number>()
    for (const p of people ?? []) seen.set(p.name, (seen.get(p.name) ?? 0) + 1)
    return new Set([...seen].filter(([, n]) => n > 1).map(([name]) => name))
  }, [people])

  async function choose(person: Person) {
    setChosen(person)
    setQuery(person.name)
    setRanking(null)
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`/api/user-ranking?netid=${encodeURIComponent(person.netid)}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) setRanking(data.ranking)
      else setError("Something went wrong. Try again.")
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => (h + 1) % suggestions.length) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => (h - 1 + suggestions.length) % suggestions.length) }
    else if (e.key === "Enter") { e.preventDefault(); choose(suggestions[Math.min(highlight, suggestions.length - 1)]) }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[8vh]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-label="Find individual user rankings" className="pop-in flex max-h-[84vh] w-full max-w-md flex-col border-2 border-black bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
          <h2 className="text-base font-bold">Find individual user rankings</h2>
          <button onClick={onClose} aria-label="Close" className="hover:text-neutral-300"><X size={20} /></button>
        </div>

        <div className="relative border-b border-neutral-300 px-4 py-3">
          <div className="flex items-center gap-2">
            <Search size={18} className="shrink-0 text-neutral-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setChosen(null); setRanking(null); setError(""); setHighlight(0) }}
              onKeyDown={onKeyDown}
              placeholder="Search by name"
              autoComplete="off"
              className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400"
            />
          </div>

          {suggestions.length > 0 && (
            <ul role="listbox" className="absolute left-4 right-4 top-full z-10 border-2 border-black bg-white shadow-lg">
              {suggestions.map((p, i) => (
                <li key={p.netid} role="option" aria-selected={i === highlight}>
                  <button
                    onMouseDown={e => { e.preventDefault(); choose(p) }}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-baseline justify-between px-3 py-2 text-left ${i === highlight ? "bg-neutral-100" : ""}`}
                  >
                    <span className="font-bold">{p.name}</span>
                    {duplicateNames.has(p.name) && <span className="text-xs text-neutral-500">{p.netid}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-y-auto px-4 py-4">
          {people === null && <p className="text-sm text-neutral-500">Loading names…</p>}
          {people !== null && !chosen && query.trim() && suggestions.length === 0 && <p className="text-sm text-neutral-500">No one by that name yet.</p>}
          {people !== null && !chosen && !query.trim() && <p className="text-sm text-neutral-500">Start typing a name to see suggestions.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {chosen && loading && <p className="text-sm text-neutral-500">Loading…</p>}
          {chosen && ranking && (
            <>
              <h3 className="mb-3 text-lg font-bold">{chosen.name}&apos;s Elo Ranking</h3>
              <RankingList visibleRows={8} rows={ranking} emptyText={`${chosen.name} hasn't ranked any movies yet.`} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
