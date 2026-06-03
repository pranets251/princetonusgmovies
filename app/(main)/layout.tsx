import { redirect } from "next/navigation"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"
import LeftNav from "@/components/LeftNav"
import RightSidebar from "@/components/RightSidebar"
import GlobalCreateModal from "@/components/GlobalCreateModal"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail()
  if (!email) redirect("/login")

  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  if (!profileDoc.exists) redirect("/username-setup")

  const username = (profileDoc.data() as any).username as string

  return (
    <div className="flex min-h-screen max-w-6xl mx-auto w-full">
      <LeftNav username={username} />

      <main className="flex-1 min-w-0 border-l border-r" style={{ borderColor: "var(--border)" }}>
        {children}
      </main>

      <RightSidebar />
      <GlobalCreateModal />
    </div>
  )
}
