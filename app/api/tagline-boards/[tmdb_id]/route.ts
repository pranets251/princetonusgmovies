import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tmdb_id: string }> }
) {
  const { tmdb_id } = await params
  const doc = await adminDb.collection("tagline_boards").doc(tmdb_id).get()
  if (!doc.exists) return NextResponse.json({ board: null })
  return NextResponse.json({ board: { id: doc.id, ...doc.data() } })
}
