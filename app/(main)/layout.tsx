import { redirect } from "next/navigation"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"
import LeftNav from "@/components/LeftNav"
import RightSidebar from "@/components/RightSidebar"
import BottomNav from "@/components/BottomNav"
import GlobalCreateModal from "@/components/GlobalCreateModal"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail()
  if (!email) redirect("/login")

  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  if (!profileDoc.exists) redirect("/username-setup")

  const username = (profileDoc.data() as any).username as string

  return (
    <div className="flex min-h-screen max-w-6xl mx-auto w-full">
      <div className="hidden md:flex">
        <LeftNav username={username} />
      </div>

      <main className="flex-1 min-w-0 pb-16 md:pb-0 md:border-l md:border-r" style={{ borderColor: "var(--border)" }}>
        {children}
      </main>

      <div className="hidden lg:flex">
        <RightSidebar />
      </div>
      <GlobalCreateModal />
      <BottomNav username={username} />
    </div>
  )
}
