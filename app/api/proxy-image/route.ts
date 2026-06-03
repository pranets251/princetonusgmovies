import { NextResponse } from "next/server"

const ALLOWED_HOST = "image.tmdb.org"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) return new NextResponse("Missing url", { status: 400 })

  let parsed: URL
  try { parsed = new URL(url) } catch { return new NextResponse("Invalid url", { status: 400 }) }

  if (parsed.hostname !== ALLOWED_HOST) {
    return new NextResponse("Disallowed host", { status: 403 })
  }

  const upstream = await fetch(url, { next: { revalidate: 86400 } })
  if (!upstream.ok) return new NextResponse("Upstream error", { status: 502 })

  const buffer = await upstream.arrayBuffer()
  const contentType = upstream.headers.get("content-type") ?? "image/jpeg"

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}
