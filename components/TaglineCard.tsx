"use client"

import { useRef, useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { Tagline, BOX_FRAC, TMDB_W780 } from "@/lib/taglineTypes"

interface TaglineCardProps {
  tagline: Tagline
  onClick?: () => void
  muralView?: boolean
  muralTaglines?: Tagline[]
}

export default function TaglineCard({ tagline, onClick, muralView = false, muralTaglines }: TaglineCardProps) {
  const { poster_path, x, y, text, font, color, align = "center", username } = tagline
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerH, setContainerH] = useState(0)

  const bwf = tagline.bwf ?? (BOX_FRAC / (tagline.zoom ?? 1))
  const bhf = tagline.bhf ?? (BOX_FRAC / (tagline.zoom ?? 1))
  const S = 1 / bwf

  const Px = S > 1 ? Math.min(100, (x * S / (S - 1)) * 100) : 0
  const Py = S > 1 ? Math.min(100, (y * S / (S - 1)) * 100) : 0

  const [fontSize, setFontSize] = useState(20)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setContainerH(el.clientHeight))
    ro.observe(el)
    setContainerH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!containerH || !tagline.fontSize) return
    setFontSize(tagline.fontSize * (containerH / bhf))
  }, [containerH, tagline.fontSize, bhf])

  return (
    <div>
      {/* Poster card */}
      <div
        ref={containerRef}
        onClick={onClick}
        style={{
          aspectRatio: "2/3",
          width: "100%",
          backgroundImage: `url(${TMDB_W780}${poster_path})`,
          backgroundSize: muralView ? "100% auto" : `${S * 100}% auto`,
          backgroundPosition: muralView ? "50% 0%" : `${Px}% ${Py}%`,
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a0a0a",
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          cursor: onClick ? "pointer" : "default",
          transition: "background-size 0.6s cubic-bezier(0.4,0,0.2,1), background-position 0.6s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)" }} />

        {muralView && muralTaglines?.map(t => (
          <div
            key={t.id}
            style={{
              position: "absolute",
              left: `${t.x * 100}%`,
              top: `${t.y * 100}%`,
              width: `${(t.bwf ?? BOX_FRAC / (t.zoom ?? 1)) * 100}%`,
              height: `${(t.bhf ?? BOX_FRAC / (t.zoom ?? 1)) * 100}%`,
              border: t.id === tagline.id
                ? "2px solid rgba(245,184,0,0.8)"
                : "1px solid rgba(255,255,255,0.3)",
              background: t.id === tagline.id
                ? "rgba(245,184,0,0.15)"
                : "rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              padding: "4%",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <span style={{
              fontFamily: `"${t.font}", sans-serif`,
              color: t.color,
              fontSize: "clamp(4px, 1.5vw, 10px)",
              lineHeight: 1.2,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}>
              {t.text}
            </span>
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3% 5%",
            overflow: "hidden",
            opacity: muralView ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {tagline.html ? (
            <div
              dangerouslySetInnerHTML={{ __html: tagline.html }}
              style={{ fontFamily: `"${font}", sans-serif`, fontSize: `${fontSize}px`, color, lineHeight: 1.3, wordBreak: "break-word", textAlign: align, width: "100%" }}
            />
          ) : (
            <div
              style={{ fontFamily: `"${font}", sans-serif`, fontSize: `${fontSize}px`, color, lineHeight: 1.3, wordBreak: "break-word", whiteSpace: "pre-wrap", textAlign: align, width: "100%" }}
            >
              {text}
            </div>
          )}
        </div>
      </div>

      {/* Permanent footer — hidden in mural view */}
      {!muralView && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 2px 0", gap: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#71717a", whiteSpace: "nowrap" }}>
            {tagline.movie_endorse_count ?? 0} ♥
            <span style={{ margin: "0 1px" }}>·</span>
            {tagline.tagline_number ?? "—"} <Pencil size={9} strokeWidth={2.5} />
          </span>
          <span style={{ fontSize: 10, color: "#71717a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            @{username}
          </span>
        </div>
      )}
    </div>
  )
}
