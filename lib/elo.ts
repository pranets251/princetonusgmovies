import { Ratings, STARTING_ELO } from "@/lib/movieTypes"

const K_FACTOR = 32

// Standard Elo: the winner gains what the loser gives up, scaled by how surprising the result was.
export function eloUpdate(winnerElo: number, loserElo: number): { winner: number; loser: number } {
  const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const delta = K_FACTOR * (1 - expectedWin)
  return { winner: winnerElo + delta, loser: loserElo - delta }
}

// Records one head-to-head result in a ratings map, returning a new map. Used identically by the
// browser (for the live ranking) and the server (which is the source of truth).
export function applyVote(ratings: Ratings, winnerId: number, loserId: number): Ratings {
  const [wElo, wMatches] = ratings[winnerId] ?? [STARTING_ELO, 0]
  const [lElo, lMatches] = ratings[loserId] ?? [STARTING_ELO, 0]
  const next = eloUpdate(wElo, lElo)
  return { ...ratings, [winnerId]: [next.winner, wMatches + 1], [loserId]: [next.loser, lMatches + 1] }
}

// Movies with at least one match, best first.
export function rankRatings(ratings: Ratings, exclude?: Set<number>): { id: number; elo: number; matches: number }[] {
  return Object.entries(ratings)
    .map(([id, [elo, matches]]) => ({ id: Number(id), elo, matches }))
    .filter(r => r.matches > 0 && !exclude?.has(r.id))
    .sort((a, b) => b.elo - a.elo || b.matches - a.matches || a.id - b.id)
}
