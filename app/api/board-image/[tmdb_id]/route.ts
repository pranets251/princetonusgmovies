import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tmdb_id: string }> },
) {
  const { tmdb_id } = await params
  const doc = await adminDb.collection("tagline_boards").doc(tmdb_id).get()
  if (!doc.exists) return new NextResponse("Not found", { status: 404 })

  const b64: string | undefined = (doc.data() as any).composite_b64
  if (!b64) return new NextResponse("No composite yet", { status: 404 })

  return new NextResponse(Buffer.from(b64, "base64"), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    },
  })
}
