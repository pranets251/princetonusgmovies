import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { applyVote } from "@/lib/elo"
import { eloCol, globalEloRef } from "@/lib/movies"
import { Ratings } from "@/lib/movieTypes"
import { TOP_BY_ID } from "@/lib/topMovies"

const MAX_VOTES_PER_REQUEST = 30

// The browser sends votes in small batches ([winnerId, loserId] pairs, oldest first). Each batch costs
// two reads and two writes however many votes it holds: the student's own ratings document and the
// shared leaderboard document are each read once, updated in memory, and written once.
export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const votes: [number, number][] = Array.isArray(body?.votes) ? body.votes.map((v: unknown) => (Array.isArray(v) ? [Number(v[0]), Number(v[1])] : [NaN, NaN])) : []
  const valid =
    votes.length > 0 &&
    votes.length <= MAX_VOTES_PER_REQUEST &&
    votes.every(([w, l]) => w !== l && TOP_BY_ID.has(w) && TOP_BY_ID.has(l))
  if (!valid) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  const meRef = eloCol().doc(email)
  const globalRef = globalEloRef()

  await adminDb.runTransaction(async tx => {
    const [me, global] = await tx.getAll(meRef, globalRef)
    let mine: Ratings = me.exists ? ((me.data() as { ratings?: Ratings }).ratings ?? {}) : {}
    let everyone: Ratings = global.exists ? ((global.data() as { ratings?: Ratings }).ratings ?? {}) : {}
    for (const [winner, loser] of votes) {
      mine = applyVote(mine, winner, loser)
      everyone = applyVote(everyone, winner, loser)
    }
    const now = new Date().toISOString()
    tx.set(meRef, { ratings: mine, updated_at: now })
    tx.set(globalRef, { ratings: everyone, updated_at: now })
  })

  return NextResponse.json({ ok: true })
}
