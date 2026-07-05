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
  const [hovered, setHovered] = useState(false)

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
    <>
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {/* Tagline text */}
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

      {/* Hover overlay — bottom only */}
      {!muralView && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.9) 22%, transparent 75%)",
          padding: "64px 10px 9px",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 8,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: "system-ui, sans-serif", letterSpacing: "0.01em", lineHeight: 1.4, whiteSpace: "nowrap" }}>
            {tagline.movie_endorse_count ?? 0} ♥ · {tagline.tagline_number ?? "—"} <Pencil size={10} strokeWidth={2.5} />
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: "system-ui, sans-serif", letterSpacing: "0.01em", lineHeight: 1.4, textAlign: "right", whiteSpace: "nowrap" }}>
            See Movie Poster ⮑
          </span>
        </div>
      )}
    </div>
    {!muralView && (
      <div style={{ textAlign: "right", paddingTop: 5 }}>
        <span style={{ fontSize: 13, color: "#a1a1aa", fontFamily: "system-ui, sans-serif", fontWeight: 500 }}>
          @{username}
        </span>
      </div>
    )}
    </>
  )
}
