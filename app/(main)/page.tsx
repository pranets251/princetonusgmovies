"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import TaglineCard from "@/components/TaglineCard"
import TaglineBoardModal from "@/components/TaglineBoardModal"
import { Tagline } from "@/lib/taglineTypes"

function useFonts(taglines: Tagline[]) {
  useEffect(() => {
    const fonts = [...new Set(taglines.map(t => t.font).filter(Boolean))]
    if (!fonts.length) return
    const families = fonts.map(f => `family=${encodeURIComponent(f)}`).join("&")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [taglines])
}

function ctaBorder(color: string): React.CSSProperties {
  const dash = `${color} 0, ${color} 20px, transparent 0, transparent 44px`
  return {
    backgroundImage: [
      `repeating-linear-gradient(90deg, ${dash})`,
      `repeating-linear-gradient(180deg, ${dash})`,
      `repeating-linear-gradient(90deg, ${dash})`,
      `repeating-linear-gradient(180deg, ${dash})`,
    ].join(", "),
    backgroundPosition: "top, right, bottom, left",
    backgroundSize: "44px 1.5px, 1.5px 44px, 44px 1.5px, 1.5px 44px",
    backgroundRepeat: "repeat-x, repeat-y, repeat-x, repeat-y",
  }
}

export default function HomePage() {
  const [tab, setTab] = useState<"campus" | "following">("campus")
  const [taglines, setTaglines] = useState<Tagline[]>([])
  const [loading, setLoading] = useState(true)
  const [ctaHovered, setCtaHovered] = useState(false)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [boardModalTmdbId, setBoardModalTmdbId] = useState<number | null>(null)
  const router = useRouter()
  useFonts(taglines)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/taglines?tab=${tab}`)
      .then(r => r.json())
      .then(data => setTaglines(data.taglines ?? []))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b sticky top-0 z-10 shrink-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        {(["campus", "following"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            onMouseEnter={() => setHoveredTab(t)}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex-1 py-4 text-sm font-medium capitalize"
            style={{
              color: tab === t ? "#fff" : hoveredTab === t ? "#fff" : "#71717a",
              borderBottom: tab === t ? "2px solid #fff" : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.15s ease, border-bottom-color 0.15s ease",
            }}
          >
            {t === "campus" ? "Campus" : "Following"}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : taglines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 px-8 text-center">
            <p className="text-zinc-500 text-sm">
              {tab === "following"
                ? "Follow people to see their taglines here."
                : "No taglines yet. Be the first!"}
            </p>
          </div>
        ) : (
          <div style={{ padding: 20, display: "flex", gap: 12 }}>
            {/* Left column: CTA (square) then taglines[1,3,5…] */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => window.dispatchEvent(new Event("open-create-modal"))}
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
                style={{
                  width: "100%", aspectRatio: "1",
                  background: "var(--bg)", border: "none",
                  borderRadius: 12, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer",
                  ...ctaBorder(ctaHovered ? "#F5B800" : "#3f3f46"),
                  transition: "background-image 0.2s ease",
                }}
              >
                <Pencil size={34} strokeWidth={1.5} style={{ color: ctaHovered ? "#F5B800" : "#52525b", transition: "color 0.2s ease", flexShrink: 0 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: ctaHovered ? "#F5B800" : "#52525b", textAlign: "center", margin: 0, padding: "0 14px", letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.2s ease" }}>
                  add a tagline to a movie you&apos;ve fallen in love with!
                </p>
              </button>
              {taglines.filter((_, i) => i % 2 === 1).map(t => (
                <TaglineCard key={t.id} tagline={t} onClick={() => setBoardModalTmdbId(t.tmdb_id)} />
              ))}
            </div>
            {/* Right column: taglines[0,2,4…] — most recent at top */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {taglines.filter((_, i) => i % 2 === 0).map(t => (
                <TaglineCard key={t.id} tagline={t} onClick={() => setBoardModalTmdbId(t.tmdb_id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {boardModalTmdbId !== null && (
      <TaglineBoardModal
        tmdbId={boardModalTmdbId}
        onClose={() => setBoardModalTmdbId(null)}
      />
    )}
    </>
  )
}
