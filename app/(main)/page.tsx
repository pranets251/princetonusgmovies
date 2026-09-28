import { redirect } from "next/navigation"
import { getRatings, getViewer } from "@/lib/movies"
import { getScreenedSetCached } from "@/lib/screened"
import { buildMatchups, slim, TOP_BY_ID } from "@/lib/topMovies"
import MatchupBoard from "@/components/MatchupBoard"

export default async function HomePage() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")
  if (!viewer.hasTop4) redirect("/top4")

  // Reads per page view: the student's Top 4 (already read for the layout), their ratings, and the screened list (cached).
  const [ratings, screened] = await Promise.all([getRatings(viewer.email), getScreenedSetCached()])

  const known = Object.keys(ratings).flatMap(id => (TOP_BY_ID.has(Number(id)) ? [slim(TOP_BY_ID.get(Number(id))!)] : []))
  return <MatchupBoard initialPairs={buildMatchups(10, screened)} initialRatings={ratings} known={known} />
}
