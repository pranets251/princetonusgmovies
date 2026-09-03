import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = await adminDb.collection("taglines").doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ tagline: { id: doc.id, ...doc.data() } })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ref = adminDb.collection("taglines").doc(id)
  const doc = await ref.get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = doc.data() as any
  if (data.user_email !== email) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { text, html, color, x, y, fontSize, bwf, bhf, creationBoxW } = await req.json()
  await ref.update({
    text, html: html ?? "", color, x, y,
    fontSize: fontSize ?? data.fontSize,
    bwf: bwf ?? data.bwf,
    bhf: bhf ?? data.bhf,
    creationBoxW: creationBoxW ?? data.creationBoxW,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ref = adminDb.collection("taglines").doc(id)
  const doc = await ref.get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = doc.data() as any
  if (data.user_email !== email) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await ref.delete()
  return NextResponse.json({ ok: true })
}
