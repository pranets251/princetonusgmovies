import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { getDirectory } from "@/lib/directory"

// Everyone's name and NetID, for the "find individual user rankings" search.
export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(
    { users: await getDirectory() },
    { headers: { "Cache-Control": "private, max-age=300" } }
  )
}
