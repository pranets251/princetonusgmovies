"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { Tagline, BOX_FRAC, TMDB_ORIGINAL } from "@/lib/taglineTypes"
import { useHighlightedMovies } from "@/lib/useHighlightedMovies"

interface BoardThumbnailProps {
  posterPath: string
  taglines: Tagline[]
  movieTitle?: string
  tmdbId?: number
  endorseCount?: number
  onClick?: () => void
}

export default function BoardThumbnail({ posterPath, taglines, movieTitle, endorseCount, onClick }: BoardThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Universal 10-tagline rule
  const displayTaglines = useMemo(() =>
    [...taglines].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)).slice(0, 10),
    [taglines]
  )

  const title = movieTitle ?? taglines[0]?.movie_title ?? ""
  const { w: bw, h: bh } = size

  const highlightedMovies = useHighlightedMovies()
  const derivedTmdbId = displayTaglines[0]?.tmdb_id ?? taglines[0]?.tmdb_id
  const isHighlighted = derivedTmdbId !== undefined && highlightedMovies.has(derivedTmdbId)

  // Highlighted: permanent gold, turns silver on hover. Normal: no border, turns silver on hover.
  const outlineColor = isHighlighted
    ? (hovered ? "rgba(228,228,231,0.75)" : "rgba(78,168,50,0.85)")
    : (hovered ? "rgba(228,228,231,0.75)" : "transparent")

  // Inline span style for per-line redaction.
  // display:inline + box-decoration-break:clone draws a separate background per text line.
  // Vertical padding (0.15em) creates a visible gap between adjacent lines so they
  // appear as distinct bars rather than one merged rectangle.
  const redactSpan: React.CSSProperties & Record<string, string> = {
    display: "inline",
    background: "#000",
    color: "#000",
    padding: "0.15em 0.05em",
    WebkitBoxDecorationBreak: "clone",
    boxDecorationBreak: "clone",
  }

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        aspectRatio: "2/3",
        position: "relative",
        background: "#111",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        borderRadius: 8,
        flexShrink: 0,
        outline: `3.375px solid ${outlineColor}`,
        transition: "outline-color 0.18s ease",
      }}
    >
      {posterPath && (
        <Image
          src={`${TMDB_ORIGINAL}${posterPath}`}
          alt={title}
          fill
          draggable={false}
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{ objectFit: "cover", pointerEvents: "none" }}
        />
      )}

      {/* Per-line redacted text */}
      {bw > 0 && displayTaglines.map(t => {
        const tBwf = t.bwf ?? (BOX_FRAC / (t.zoom ?? 1))
        const tBhf = t.bhf ?? (BOX_FRAC / (t.zoom ?? 1))
        const displayBoxW = tBwf * bw
        const displayBoxH = tBhf * bh
        const refW = (t.creationBoxW && t.creationBoxW > 0) ? t.creationBoxW : displayBoxW
        const refH = refW * (tBhf / tBwf) * 1.5
        const refFontPx = t.fontSize ? t.fontSize * (refW / tBwf) * 1.5 : 14
        const scale = displayBoxW / refW
        return (
          <div key={t.id} style={{ position: "absolute", left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: displayBoxW, height: displayBoxH, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{ width: refW, height: refH, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", alignItems: "center", justifyContent: "center", padding: "3% 5%", boxSizing: "border-box" }}>
              <div style={{
                fontFamily: `"${t.font ?? "sans-serif"}", sans-serif`,
                fontSize: refFontPx,
                lineHeight: 1.6,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                width: "100%",
                maxWidth: "100%",
                textAlign: (t.align ?? "center") as React.CSSProperties["textAlign"],
              }}>
                <span style={redactSpan}>{t.text}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Hover overlay — shallow */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.16)", opacity: hovered ? 1 : 0, transition: "opacity 0.2s ease", pointerEvents: "none", zIndex: 5 }} />

      {/* Hover: endorsement count, bottom-left */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.75) 30%, transparent 80%)",
        padding: "28px 10px 9px",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: "none",
        zIndex: 6,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "system-ui, sans-serif", letterSpacing: "0.01em", lineHeight: 1.4, whiteSpace: "nowrap" }}>
          {endorseCount ?? 0} ♥
        </span>
      </div>
    </div>
  )
}
