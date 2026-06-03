import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET() {
  const doc = await adminDb.collection("config").doc("highlighted_movies").get()
  const tmdb_ids: number[] = doc.exists ? ((doc.data() as any).tmdb_ids ?? []) : []
  return NextResponse.json({ tmdb_ids })
}
