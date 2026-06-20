"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { X, Ticket, Pencil, User } from "lucide-react"
import { Tagline, BOX_FRAC, TMDB_ORIGINAL } from "@/lib/taglineTypes"

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

interface Props {
  tmdbId: number
  onClose: () => void
}

export default function TaglineBoardModal({ tmdbId, onClose }: Props) {
  const router = useRouter()
  const [taglines, setTaglines] = useState<Tagline[]>([])
  const [endorsed, setEndorsed] = useState(false)
  const [endorseCount, setEndorseCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 })
  const [pressing, setPressing] = useState<"endorse" | "add" | "contributors" | null>(null)
  const [showContributors, setShowContributors] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const contributorsRef = useRef<HTMLDivElement>(null)
  useFonts(taglines)

  useEffect(() => {
    async function load() {
      const [tagsRes, likeRes] = await Promise.all([
        fetch(`/api/taglines?tmdb_id=${tmdbId}`),
        fetch(`/api/movies/${tmdbId}/endorse`),
      ])
      if (tagsRes.ok) setTaglines((await tagsRes.json()).taglines ?? [])
      if (likeRes.ok) {
        const { endorsed: l, endorse_count: lc } = await likeRes.json()
        setEndorsed(l); setEndorseCount(lc ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [tmdbId])

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const measure = () => setBoardSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    if (!showContributors) return
    function onDown(e: MouseEvent) {
      if (contributorsRef.current && !contributorsRef.current.contains(e.target as Node)) setShowContributors(false)
    }
    document.addEventListener("mousedown", onDown, true)
    return () => document.removeEventListener("mousedown", onDown, true)
  }, [showContributors])

  async function handleEndorse() {
    const newEndorsed = !endorsed
    setEndorsed(newEndorsed)
    setEndorseCount(c => c + (newEndorsed ? 1 : -1))
    const res = await fetch(`/api/movies/${tmdbId}/endorse`, { method: "POST" })
    if (res.ok) {
      const { endorsed: l, endorse_count: lc } = await res.json()
      setEndorsed(l); setEndorseCount(lc)
    }
  }

  const boardTaglines = useMemo(() =>
    [...taglines].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)).slice(0, 10),
    [taglines]
  )
  const contributors = useMemo(() =>
    [...new Set(taglines.map(t => t.username))],
    [taglines]
  )

  const posterPath = boardTaglines[0]?.poster_path ?? taglines[0]?.poster_path ?? null
  const movieTitle = taglines[0]?.movie_title ?? ""
  const { w: bw, h: bh } = boardSize

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backdropFilter: "blur(10px) brightness(0.4)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* X button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 24,
          width: 36, height: 36, borderRadius: "50%",
          background: "#3f3f46", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1,
        }}
      >
        <X size={16} color="#e4e4e7" />
      </button>

      {/* Board */}
      <div
        ref={boardRef}
        style={{
          height: "calc(100vh - 170px)",
          maxHeight: 680,
          aspectRatio: "2 / 3",
          position: "relative",
          background: "#111",
          overflow: "hidden",
          borderRadius: 14,
          flexShrink: 0,
        }}
      >
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : !posterPath ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#71717a", fontSize: 14 }}>No taglines yet.</p>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${TMDB_ORIGINAL}${posterPath}`}
              alt={movieTitle}
              draggable={false}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", userSelect: "none", pointerEvents: "none" }}
            />
            {bw > 0 && boardTaglines.map(t => {
              const tBwf = t.bwf ?? (BOX_FRAC / (t.zoom ?? 1))
              const tBhf = t.bhf ?? (BOX_FRAC / (t.zoom ?? 1))
              const displayBoxW = tBwf * bw
              const displayBoxH = tBhf * bh
              const refW = (t.creationBoxW && t.creationBoxW > 0) ? t.creationBoxW : displayBoxW
              const refH = refW * (tBhf / tBwf) * 1.5
              const refFontPx = t.fontSize ? t.fontSize * (refW / tBwf) * 1.5 : 14
              const scale = displayBoxW / refW
              const textStyle: React.CSSProperties = {
                fontFamily: `"${t.font ?? "sans-serif"}", sans-serif`,
                fontSize: refFontPx,
                color: t.color ?? "#fff",
                textAlign: (t.align ?? "center") as React.CSSProperties["textAlign"],
                lineHeight: 1.3,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                width: "100%",
              }
              return (
                <div key={t.id} style={{ position: "absolute", left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: displayBoxW, height: displayBoxH, overflow: "hidden", pointerEvents: "none" }}>
                  <div style={{ width: refW, height: refH, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", alignItems: "center", justifyContent: "center", padding: "3% 5%", boxSizing: "border-box" }}>
                    {t.html
                      ? <div dangerouslySetInnerHTML={{ __html: t.html }} style={textStyle} />
                      : <div style={textStyle}>{t.text}</div>
                    }
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Action bar — width matches the poster's width */}
      <div style={{ display: "flex", gap: 12, marginTop: 18, alignItems: "stretch", width: bw || undefined }}>
        {/* Endorse */}
        <button
          onMouseDown={() => setPressing("endorse")}
          onMouseUp={() => setPressing(null)}
          onMouseLeave={() => setPressing(null)}
          onClick={handleEndorse}
          style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.01em", whiteSpace: "nowrap",
            background: endorsed ? "#dc2626" : "#fff",
            color: endorsed ? "#fff" : "#dc2626",
            boxShadow: pressing === "endorse"
              ? `0 1px 0 ${endorsed ? "#991b1b" : "#d4d4d8"}, 0 2px 4px rgba(0,0,0,0.35)`
              : `0 4px 0 ${endorsed ? "#991b1b" : "#d4d4d8"}, 0 6px 14px rgba(0,0,0,0.35)`,
            transform: pressing === "endorse" ? "translateY(3px)" : "translateY(0)",
            transition: "transform 0.08s ease, box-shadow 0.08s ease, background 0.15s ease, color 0.15s ease",
          }}
        >
          <Ticket size={18} color={endorsed ? "#fff" : "#dc2626"} />
          {endorsed ? "Endorsed!" : "Endorse"}
        </button>

        {/* Add tagline */}
        <button
          onMouseDown={() => setPressing("add")}
          onMouseUp={() => setPressing(null)}
          onMouseLeave={() => setPressing(null)}
          onClick={() => { onClose(); router.push(`/tagline/${tmdbId}`) }}
          style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.01em", whiteSpace: "nowrap",
            background: "#F5B800",
            color: "#fff",
            boxShadow: pressing === "add"
              ? "0 1px 0 #a16207, 0 2px 4px rgba(0,0,0,0.35)"
              : "0 4px 0 #a16207, 0 6px 14px rgba(0,0,0,0.35)",
            transform: pressing === "add" ? "translateY(3px)" : "translateY(0)",
            transition: "transform 0.08s ease, box-shadow 0.08s ease",
          }}
        >
          <Pencil size={18} color="#fff" />
          Add your own
        </button>

        {/* Contributors toggle */}
        <div ref={contributorsRef} style={{ position: "relative" }}>
          <button
            onMouseDown={() => setPressing("contributors")}
            onMouseUp={() => setPressing(null)}
            onMouseLeave={() => setPressing(null)}
            onClick={() => setShowContributors(v => !v)}
            style={{
              height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer",
              background: showContributors ? "#52525b" : "#3f3f46",
              boxShadow: pressing === "contributors"
                ? `0 1px 0 ${showContributors ? "#3f3f46" : "#27272a"}, 0 2px 4px rgba(0,0,0,0.35)`
                : `0 4px 0 ${showContributors ? "#3f3f46" : "#27272a"}, 0 6px 14px rgba(0,0,0,0.35)`,
              transform: pressing === "contributors" ? "translateY(3px)" : "translateY(0)",
              transition: "transform 0.08s ease, box-shadow 0.08s ease, background 0.15s ease",
            }}
          >
            <User size={18} color="#e4e4e7" />
          </button>

          {showContributors && (
            <div style={{
              position: "absolute", bottom: 0, left: "calc(100% + 10px)",
              width: 210,
              background: "#1c1c1e",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
              zIndex: 10,
            }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", margin: 0 }}>Tagline Contributors</p>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 240 }}>
                {contributors.length === 0 ? (
                  <p style={{ padding: "10px 14px", fontSize: 12, color: "#52525b", margin: 0 }}>No contributors yet.</p>
                ) : contributors.map(u => (
                  <button
                    key={u}
                    onClick={() => { onClose(); router.push(`/profile/${u}`) }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "8px 14px", background: "none", border: "none",
                      color: "#e4e4e7", fontSize: 13, cursor: "pointer",
                    }}
                    className="hover:bg-white/5 hover:underline"
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 14 }}>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                  <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{taglines.length}</span> Taglines
                </span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                  <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{endorseCount}</span> Endorsements
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
