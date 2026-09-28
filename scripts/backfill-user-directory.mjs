// One-off: put students who already have a Top 4 or ratings into the name directory (config/user_directory)
// so they can be found on the leaderboard. Google's real name is only available at sign-in, so until a
// student signs in again they appear under their NetID; signing in replaces it with their name.
//
//   node --env-file=.env.local scripts/backfill-user-directory.mjs [--write]
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const write = process.argv.includes("--write")
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) })
const db = getFirestore()

const [top4, elo, dir] = await Promise.all([
  db.collection("top4").select().get(),
  db.collection("elo").select().get(),
  db.collection("config").doc("user_directory").get(),
])
const existing = dir.exists ? dir.data().users ?? {} : {}
const emails = new Set([...top4.docs, ...elo.docs].map(d => d.id))
const users = {}
for (const email of emails) {
  const netid = email.split("@")[0].toLowerCase()
  if (/^[a-z0-9]{2,20}$/.test(netid) && !existing[netid]) users[netid] = netid
}
console.log(`${emails.size} students with data; ${Object.keys(users).length} not yet in the directory:`, Object.keys(users))
if (!write) { console.log("Dry run — nothing written. Re-run with --write."); process.exit(0) }
if (Object.keys(users).length) await db.collection("config").doc("user_directory").set({ users }, { merge: true })
console.log("Done.")
