import { redirect } from "next/navigation"
import { adminDb } from "@/lib/firebase-admin"

export const dynamic = "force-dynamic"

export default async function PostRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await adminDb.collection("taglines").doc(id).get()
  if (doc.exists) {
    const { tmdb_id } = doc.data() as { tmdb_id: number }
    redirect(`/movie/${tmdb_id}`)
  }
  redirect("/")
}
