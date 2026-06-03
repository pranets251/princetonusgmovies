import { redirect } from "next/navigation"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"

export default async function CreateLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail()
  if (!email) redirect("/login")

  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  if (!profileDoc.exists) redirect("/username-setup")

  return (
    <div className="h-screen overflow-hidden w-full" style={{ backgroundColor: "var(--bg)" }}>
      {children}
    </div>
  )
}
