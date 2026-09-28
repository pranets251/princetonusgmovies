import { adminDb } from "@/lib/firebase-admin"

export const screenedRef = () => adminDb.collection("config").doc("highlighted_movies")

// The already-screened list, keyed by TMDB id. One document read.
export async function getScreenedIds(): Promise<number[]> {
  const doc = await screenedRef().get()
  return doc.exists ? ((doc.data() as { tmdb_ids?: number[] }).tmdb_ids ?? []) : []
}

// Matchups only need the list to be roughly current, so hold it in memory for a few minutes
// instead of re-reading it on every request.
const TTL_MS = 5 * 60 * 1000
let cached: { ids: Set<number>; at: number } | null = null

export async function getScreenedSetCached(): Promise<Set<number>> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.ids
  const ids = new Set(await getScreenedIds())
  cached = { ids, at: Date.now() }
  return ids
}

export function forgetScreenedCache() {
  cached = null
}
