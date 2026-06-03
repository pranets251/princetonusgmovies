import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const posterPath = searchParams.get("poster_path")
  if (!posterPath) return NextResponse.json({ fonts: [] })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ fonts: [] })

  try {
    const imgRes = await fetch(`https://image.tmdb.org/t/p/w342${posterPath}`)
    if (!imgRes.ok) return NextResponse.json({ fonts: [] })
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64")
    const mimeType = (imgRes.headers.get("content-type") ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp"

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
            {
              type: "text",
              text: `Identify the fonts used for the title and any prominent text in this movie poster. Return ONLY a JSON array of up to 4 font names available on Google Fonts that match or closely resemble the fonts in the poster. Example: ["Bebas Neue","Playfair Display"]. Return just the JSON array, nothing else.`,
            },
          ],
        }],
      }),
    })

    if (!res.ok) return NextResponse.json({ fonts: [] })
    const data = await res.json()
    const raw = data.content?.[0]?.text ?? "[]"
    const match = raw.match(/\[[\s\S]*?\]/)
    if (match) {
      const fonts = JSON.parse(match[0])
      if (Array.isArray(fonts)) return NextResponse.json({ fonts })
    }
  } catch {}

  return NextResponse.json({ fonts: [] })
}
