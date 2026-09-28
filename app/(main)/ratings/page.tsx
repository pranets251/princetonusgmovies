import { redirect } from "next/navigation"
import { getRatedMovies, getViewer } from "@/lib/movies"
import { isAdminEmail } from "@/lib/admin"
import RatingsBoard from "@/components/RatingsBoard"

export default async function RatingsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")
  if (!viewer.hasTop4) redirect("/top4")

  return <RatingsBoard movies={await getRatedMovies(viewer.email)} isAdmin={isAdminEmail(viewer.email)} />
}
