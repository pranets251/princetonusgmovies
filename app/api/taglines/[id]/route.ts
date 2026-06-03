import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = await adminDb.collection("taglines").doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ tagline: { id: doc.id, ...doc.data() } })
}
