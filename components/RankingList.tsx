import Poster from "@/components/Poster"
import { MovieSummary } from "@/lib/movieTypes"

export interface RankingRow {
  movie: MovieSummary
  elo: number
  // Elo change from the last vote, shown briefly next to the rating.
  delta?: number
}

const ROW_HEIGHT = 65

// A student's movies by Elo, highest first. Scrolls instead of growing as movies are added. Used for the
// live panel on the home page and for looking up another student's ranking.
export default function RankingList({
  rows,
  emptyText = "No movies ranked yet.",
  visibleRows = 5,
}: {
  rows: RankingRow[]
  emptyText?: string
  // How many movies show before the list scrolls (fewer on short screens, so the panel always fits its frame).
  visibleRows?: number
}) {
  if (rows.length === 0) return <p className="py-2 text-left text-sm text-neutral-500">{emptyText}</p>

  return (
    <ol
      style={{ maxHeight: `min(${visibleRows * ROW_HEIGHT}px, calc(100dvh - 260px))` }}
      className="overflow-y-auto border-y border-neutral-300 text-left"
    >
      {rows.map((row, i) => (
        <li key={row.movie.tmdb_id} className="flex h-[65px] shrink-0 items-center gap-2 border-b border-neutral-300 py-2 pr-2 last:border-b-0">
          <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums">{i + 1}.</span>
          <Poster movie={row.movie} size="w185" className="h-12 w-8 shrink-0 border border-neutral-300" />
          <p className="line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-tight">
            {row.movie.title}
            {row.movie.year ? <span className="font-normal text-neutral-600"> ({row.movie.year})</span> : null}
          </p>
          <div className="w-11 shrink-0 text-right leading-tight">
            <p className="text-sm font-bold tabular-nums">{Math.round(row.elo)}</p>
            {row.delta !== undefined && row.delta !== 0 && (
              <p className={`text-xs font-bold tabular-nums ${row.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                {row.delta > 0 ? "+" : "−"}
                {Math.abs(Math.round(row.delta))}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
