/**
 * One-time migration: renames Firestore like fields to endorse terminology.
 *
 * What it does:
 *   1. Copies every doc from `movie_likes` → `movie_endorsements`
 *      renaming the `liked` field to `endorsed`.
 *   2. Updates every `taglines` doc:
 *      `likes` array  → `endorsements`
 *      `like_count`   → `endorse_count`
 *
 * Run from the project root:
 *   FIREBASE_SERVICE_ACCOUNT_KEY=$(cat path/to/serviceAccount.json) node scripts/migrate-likes-to-endorsements.js
 *
 * The old `movie_likes` collection is left intact so you can verify the
 * migration before deleting it manually in the Firebase console.
 */

const admin = require("firebase-admin")

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db = admin.firestore()

async function migrateMovieLikes() {
  console.log("--- Migrating movie_likes → movie_endorsements ---")
  const snap = await db.collection("movie_likes").get()
  if (snap.empty) { console.log("  movie_likes is empty, nothing to migrate."); return }

  const batch = db.batch()
  let count = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const { liked, ...rest } = data
    const newData = { ...rest, endorsed: liked }
    batch.set(db.collection("movie_endorsements").doc(doc.id), newData)
    count++

    // Firestore batches are limited to 500 ops; flush and continue
    if (count % 500 === 0) {
      await batch.commit()
      console.log(`  Committed ${count} docs...`)
    }
  }

  await batch.commit()
  console.log(`  Done. Migrated ${count} movie_likes docs.`)
}

async function migrateTaglines() {
  console.log("--- Migrating taglines (likes → endorsements, like_count → endorse_count) ---")
  const snap = await db.collection("taglines").get()
  if (snap.empty) { console.log("  taglines is empty, nothing to migrate."); return }

  let count = 0
  let batch = db.batch()
  let batchCount = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    if (!("likes" in data) && !("like_count" in data)) continue // already migrated

    const { likes, like_count, ...rest } = data
    const newData = {
      ...rest,
      endorsements: likes ?? [],
      endorse_count: like_count ?? 0,
    }

    batch.update(db.collection("taglines").doc(doc.id), {
      endorsements: newData.endorsements,
      endorse_count: newData.endorse_count,
      likes: admin.firestore.FieldValue.delete(),
      like_count: admin.firestore.FieldValue.delete(),
    })

    count++
    batchCount++

    if (batchCount === 500) {
      await batch.commit()
      console.log(`  Committed ${count} tagline updates...`)
      batch = db.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) await batch.commit()
  console.log(`  Done. Updated ${count} tagline docs.`)
}

async function main() {
  try {
    await migrateMovieLikes()
    await migrateTaglines()
    console.log("\nMigration complete.")
    console.log("You can now delete the old `movie_likes` collection in the Firebase console.")
  } catch (err) {
    console.error("Migration failed:", err)
    process.exit(1)
  }
}

main()
