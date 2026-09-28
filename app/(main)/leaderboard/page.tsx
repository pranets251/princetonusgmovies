import { redirect } from "next/navigation"
import { getGlobalRatings, getViewer } from "@/lib/movies"
import { rankRatings } from "@/lib/elo"
import { RankedMovie } from "@/lib/movieTypes"
import { slim, TOP_BY_ID } from "@/lib/topMovies"
import LeaderboardList from "@/components/LeaderboardList"

export default async function LeaderboardPage() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")
  if (!viewer.hasTop4) redirect("/top4")

  // One document read: everyone's combined ratings.
  const ranked: RankedMovie[] = rankRatings(await getGlobalRatings()).flatMap(r =>
    TOP_BY_ID.has(r.id) ? [{ ...slim(TOP_BY_ID.get(r.id)!), elo: r.elo, matches: r.matches }] : []
  )
  return <LeaderboardList movies={ranked} />
}
