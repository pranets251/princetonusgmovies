import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { getRatings } from "@/lib/movies"
import { rankRatings } from "@/lib/elo"
import { TOP_BY_ID, slim } from "@/lib/topMovies"

const RANKING_LENGTH = 50

// A student's personal ranking (their movies by Elo), looked up by NetID. One document read.
export async function GET(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const netid = (new URL(req.url).searchParams.get("netid") ?? "").trim().toLowerCase()
  if (!/^[a-z0-9]{2,20}$/.test(netid)) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  const ranking = rankRatings(await getRatings(`${netid}@princeton.edu`))
    .filter(r => TOP_BY_ID.has(r.id))
    .slice(0, RANKING_LENGTH)
    .map(r => ({ movie: slim(TOP_BY_ID.get(r.id)!), elo: r.elo, matches: r.matches }))

  return NextResponse.json({ netid, ranking })
}
