import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tmdbId   = searchParams.get("tmdb_id")
  const username = searchParams.get("username")

  let snap: FirebaseFirestore.QuerySnapshot
  if (tmdbId) {
    snap = await adminDb.collection("taglines")
      .where("tmdb_id", "==", Number(tmdbId))
      .limit(60)
      .get()
  } else if (username) {
    snap = await adminDb.collection("taglines")
      .where("username", "==", username)
      .limit(60)
      .get()
  } else {
    snap = await adminDb.collection("taglines")
      .orderBy("created_at", "desc")
      .limit(60)
      .get()
  }

  const taglines = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1))
  return NextResponse.json({ taglines })
}

export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const {
    tmdb_id, movie_title, poster_path,
    x, y,
    text, html, font, color,
    fontSize, bwf, bhf, creationBoxW,
  } = await req.json()

  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  const username = profileDoc.exists ? (profileDoc.data() as any).username : ""

  const now = new Date().toISOString()

  const boardRef  = adminDb.collection("tagline_boards").doc(String(tmdb_id))
  const boardSnap = await boardRef.get()

  if (!boardSnap.exists) {
    await boardRef.set({ tmdb_id, movie_title, poster_path, created_by: email, created_at: now })
  }

  const taglineRef = await adminDb.collection("taglines").add({
    tmdb_id, movie_title, poster_path,
    user_email: email, username,
    x, y,
    bwf: bwf ?? 0.25,
    bhf: bhf ?? 0.125,
    text, html: html ?? "", font, color,
    fontSize: fontSize ?? 0.04,
    creationBoxW: creationBoxW ?? null,
    align: "center", vertAlign: "center",
    created_at: now,
    endorsements: [], endorse_count: 0,
  })

  return NextResponse.json({ id: taglineRef.id })
}
