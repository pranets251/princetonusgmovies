import { redirect } from "next/navigation"
import { getViewer } from "@/lib/movies"
import { isAdminEmail } from "@/lib/admin"
import NavBar from "@/components/NavBar"
import CornerMenu from "@/components/CornerMenu"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")

  return (
    <div className="m-3 flex h-[calc(100dvh-24px)] flex-col border-2 border-black bg-white">
      {/* Students who haven't declared a Top 4 yet are in the forced setup flow: no top bar. */}
      {viewer.hasTop4 && <NavBar />}
      {/* The frame is exactly one screen tall; a page that's taller than that scrolls inside it. */}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <CornerMenu isAdmin={isAdminEmail(viewer.email)} />
    </div>
  )
}
