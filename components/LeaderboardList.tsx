"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import Poster from "@/components/Poster"
import DirectorLine from "@/components/DirectorLine"
import UserRankingModal from "@/components/UserRankingModal"
import { RankedMovie } from "@/lib/movieTypes"

export default function LeaderboardList({ movies }: { movies: RankedMovie[] }) {
  const [query, setQuery] = useState("")
  const [searchingUsers, setSearchingUsers] = useState(false)

  // Rank is the movie's overall position, so it stays put while filtering.
  const ranked = useMemo(() => movies.map((m, i) => ({ ...m, rank: i + 1 })), [movies])
  const q = query.trim().toLowerCase()
  const shown = q ? ranked.filter(m => m.title.toLowerCase().includes(q)) : ranked

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-8">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3 border-b-2 border-black pb-2">
        <label className="flex min-w-[220px] flex-1 items-center gap-3">
          <Search size={22} className="shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movie titles"
            className="w-full bg-transparent text-xl outline-none placeholder:text-neutral-400"
          />
        </label>
        <button
          onClick={() => setSearchingUsers(true)}
          className="flex shrink-0 items-center gap-2 border-2 border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
        >
          <Users size={16} /> Filter rankings by user
        </button>
      </div>

      {movies.length === 0 ? (
        <p className="pt-10 text-center text-lg text-neutral-600">Nobody has ranked any movies yet.</p>
      ) : shown.length === 0 ? (
        <p className="pt-10 text-center text-lg text-neutral-600">No movies match &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <ol>
          {shown.map(m => (
            <li key={m.tmdb_id} className="flex items-center gap-4 border-b border-neutral-400 py-4">
              <Poster movie={m} size="w185" className="h-[96px] w-16 shrink-0 border border-neutral-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold leading-tight sm:text-2xl">{m.rank}. {m.title}</p>
                <p className="text-lg text-neutral-700">{m.year}</p>
                <DirectorLine director={m.director} className="truncate text-base" />
              </div>
              <div className="shrink-0 text-right leading-tight">
                <p className="text-xl font-bold tabular-nums sm:text-2xl">{Math.round(m.elo)}</p>
                <p className="text-base text-neutral-600">ELO</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {searchingUsers && <UserRankingModal onClose={() => setSearchingUsers(false)} />}
    </div>
  )
}
