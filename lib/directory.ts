import { adminDb } from "@/lib/firebase-admin"

// One document holds every student's display name, keyed by NetID, so "find a user by name" needs a single
// read (and none while typing: the browser filters the list it downloaded).
const directoryRef = () => adminDb.collection("config").doc("user_directory")

export const netidOf = (email: string) => email.split("@")[0].toLowerCase()

// Called at sign-in with the name from the student's Google account. One write, no reads.
export async function recordUserName(email: string, name: string | null): Promise<void> {
  const netid = netidOf(email)
  if (!/^[a-z0-9]{2,20}$/.test(netid)) return
  await directoryRef().set({ users: { [netid]: name ?? netid } }, { merge: true })
  cached = null
}

const TTL_MS = 5 * 60 * 1000
let cached: { list: [string, string][]; at: number } | null = null

// [netid, name] pairs, sorted by name. Held in memory for a few minutes.
export async function getDirectory(): Promise<[string, string][]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.list
  const doc = await directoryRef().get()
  const users = doc.exists ? ((doc.data() as { users?: Record<string, string> }).users ?? {}) : {}
  const list = Object.entries(users).sort((a, b) => a[1].localeCompare(b[1]))
  cached = { list, at: Date.now() }
  return list
}
