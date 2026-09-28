import { redirect } from "next/navigation"
import { getTop4, getViewer } from "@/lib/movies"
import Top4Editor from "@/components/Top4Editor"

export default async function Top4Page() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")

  return <Top4Editor initial={(await getTop4(viewer.email)) ?? []} isFirstTime={!viewer.hasTop4} />
}
