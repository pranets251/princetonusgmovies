"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Heart, Pencil, User } from "lucide-react"
import { Tagline, BOX_FRAC, TMDB_ORIGINAL } from "@/lib/taglineTypes"
import { useFonts } from "@/lib/useFonts"

export default function MovieBoardPage() {
  const { tmdb_id } = useParams() as { tmdb_id: string }
  const router = useRouter()

  const [taglines, setTaglines] = useState<Tagline[]>([])
  const [endorsed, setEndorsed] = useState(false)
  const [endorseCount, setEndorseCount] = useState(0)
  const [endorseLoading, setEndorseLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 })
  const [showContributors, setShowContributors] = useState(false)
  const contributorsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showContributors) return
    function onDown(e: MouseEvent) {
      if (contributorsRef.current && !contributorsRef.current.contains(e.target as Node)) setShowContributors(false)
    }
    document.addEventListener("mousedown", onDown, true)
    return () => document.removeEventListener("mousedown", onDown, true)
  }, [showContributors])
  useFonts(taglines)

  const boardContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = boardContainerRef.current
    if (!el) return
    function measure() {
      const PAD = 48
      const { width, height } = el!.getBoundingClientRect()
      const availW = width - PAD
      const availH = height - PAD
      const byW = { w: availW, h: availW * 1.5 }
      const byH = { w: availH * (2 / 3), h: availH }
      setBoardSize(byW.h <= availH ? byW : byH)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    fetch(`/api/taglines?tmdb_id=${tmdb_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTaglines(data.taglines ?? []) })
      .finally(() => setLoading(false))

    fetch(`/api/movies/${tmdb_id}/endorse`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setEndorsed(data.endorsed); setEndorseCount(data.endorse_count ?? 0) } })
      .finally(() => setEndorseLoading(false))
  }, [tmdb_id])

  async function handleEndorse() {
    const newEndorsed = !endorsed
    setEndorsed(newEndorsed); setEndorseCount(c => c + (newEndorsed ? 1 : -1))
    const res = await fetch(`/api/movies/${tmdb_id}/endorse`, { method: "POST" })
    if (res.ok) {
      const { endorsed: l, endorse_count: lc } = await res.json()
      setEndorsed(l); setEndorseCount(lc)
    }
  }
  function handleAdd() { router.push(`/tagline/${tmdb_id}`) }

  const boardTaglines = useMemo(() =>
    [...taglines].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)).slice(0, 10),
    [taglines]
  )
  const contributors = useMemo(() =>
    [...new Set(taglines.map(t => t.username))],
    [taglines]
  )

  const posterPath = boardTaglines[0]?.poster_path ?? taglines[0]?.poster_path ?? null
  const { w: bw, h: bh } = boardSize

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 64, borderBottom: "1px solid var(--border)" }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#3f3f46", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} className="text-zinc-300" />
        </button>

        {/* Person icon + contributor dropdown */}
        <div ref={contributorsRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowContributors(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: "#3f3f46", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <User size={18} className="text-zinc-300" />
          </button>

          {showContributors && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 6,
              background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12, zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
              minWidth: 230, maxHeight: 280, overflowY: "auto",
            }}>
              {contributors.length === 0 ? (
                <p style={{ padding: "10px 14px", fontSize: 12, color: "#52525b", margin: 0 }}>No contributors yet.</p>
              ) : contributors.map(u => (
                <button
                  key={u}
                  onClick={() => router.push(`/profile/${u}`)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 14px", background: "none", border: "none",
                    color: "#e4e4e7", fontSize: 13, cursor: "pointer",
                  }}
                  className="hover:bg-white/5 hover:underline"
                >
                  @{u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Board area ── */}
      <div
        ref={boardContainerRef}
        style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 16 }}
      >
        <div style={{ width: bw || undefined, height: bh || undefined, position: "relative", flexShrink: 0, background: "#111", overflow: "hidden" }}>
          {loading ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : !posterPath ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <p className="text-zinc-500 text-sm">No taglines for this movie yet.</p>
              <button onClick={handleAdd} className="text-sm font-semibold text-white border border-zinc-700 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
                Be the first →
              </button>
            </div>
          ) : bw > 0 ? (
            <>
              <Image
                src={`${TMDB_ORIGINAL}${posterPath}`}
                alt=""
                fill
                draggable={false}
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover", userSelect: "none", pointerEvents: "none" }}
              />

              {boardTaglines.map(t => {
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
          ) : null}
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-center flex-shrink-0" style={{ height: 64, gap: 28, borderTop: "1px solid var(--border)" }}>
        {/* Endorse */}
        <button
          onClick={!endorseLoading ? handleEndorse : undefined}
          disabled={endorseLoading}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "none", border: "none", padding: 0,
            cursor: endorseLoading ? "default" : "pointer",
          }}
        >
          <Heart
            size={20}
            fill={endorsed && !endorseLoading ? "#dc2626" : "none"}
            color={endorseLoading ? "#71717a" : endorsed ? "#dc2626" : "#e4e4e7"}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: endorseLoading ? "#71717a" : "#e4e4e7" }}>
            {endorseLoading ? "…" : endorseCount}
          </span>
        </button>

        {/* Add tagline */}
        <button
          onClick={handleAdd}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "none", border: "none", padding: 0, cursor: "pointer",
          }}
        >
          <Pencil size={18} color="#e4e4e7" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#e4e4e7" }}>{taglines.length}</span>
        </button>
      </div>
    </div>
  )
}
