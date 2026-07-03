import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tmdb_id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ endorsed: false, endorse_count: 0 })

  const { tmdb_id } = await params
  const [endorseDoc, countSnap] = await Promise.all([
    adminDb.collection("movie_endorsements").doc(`${tmdb_id}_${email}`).get(),
    adminDb.collection("movie_endorsements")
      .where("tmdb_id", "==", Number(tmdb_id))
      .where("endorsed", "==", true)
      .count()
      .get(),
  ])

  const isEndorsed = endorseDoc.exists ? (endorseDoc.data() as any).endorsed !== false : false
  const endorseCount = countSnap.data().count

  return NextResponse.json({ endorsed: isEndorsed, endorse_count: endorseCount })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tmdb_id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tmdb_id } = await params
  const endorseRef = adminDb.collection("movie_endorsements").doc(`${tmdb_id}_${email}`)

  const endorseSnap = await endorseRef.get()
  const wasEndorsed = endorseSnap.exists ? (endorseSnap.data() as any).endorsed !== false : false
  const newEndorsed = !wasEndorsed

  await endorseRef.set({ tmdb_id: Number(tmdb_id), user_email: email, endorsed: newEndorsed, created_at: new Date().toISOString() })

  const countSnap = await adminDb.collection("movie_endorsements")
    .where("tmdb_id", "==", Number(tmdb_id))
    .where("endorsed", "==", true)
    .count()
    .get()
  const endorseCount = countSnap.data().count
  return NextResponse.json({ endorsed: newEndorsed, endorse_count: endorseCount })
}
