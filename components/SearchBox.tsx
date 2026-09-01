"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Suspense, useState, useEffect } from "react"

type ResultFilter = "all" | "movies" | "users"
const RESULT_FILTERS: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "All results" },
  { key: "movies", label: "Movies only" },
  { key: "users", label: "Users only" },
]

function SearchBoxInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const filter = (searchParams.get("filter") as ResultFilter | null) ?? "all"
  const [query, setQuery] = useState(q)

  useEffect(() => setQuery(q), [q])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  function applyFilter(f: ResultFilter) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (f !== "all") params.set("filter", f)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3">
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

      {pathname === "/search" && (
        <div className="rounded-xl border border-zinc-800 p-1.5 flex gap-1" style={{ backgroundColor: "var(--card)" }}>
          {RESULT_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => applyFilter(key)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                filter === key ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchBox() {
  return (
    <Suspense fallback={null}>
      <SearchBoxInner />
    </Suspense>
  )
}
