import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ref = adminDb.collection("taglines").doc(id)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = snap.data() as any
  const alreadyEndorsed = (data.endorsements ?? []).includes(email)

  await ref.update({
    endorsements: alreadyEndorsed ? FieldValue.arrayRemove(email) : FieldValue.arrayUnion(email),
    endorse_count: alreadyEndorsed ? FieldValue.increment(-1) : FieldValue.increment(1),
  })

  return NextResponse.json({ endorsed: !alreadyEndorsed, endorse_count: (data.endorse_count ?? 0) + (alreadyEndorsed ? -1 : 1) })
}
