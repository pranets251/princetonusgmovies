"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Heart, Pencil, Share, User, X } from "lucide-react"
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

export default function MovieBoardPage() {
  const { tmdb_id } = useParams() as { tmdb_id: string }
  const router = useRouter()

  const [taglines, setTaglines] = useState<Tagline[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [heartAnim, setHeartAnim] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pencilHovered, setPencilHovered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 })
  const [showContributors, setShowContributors] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openContributors() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    setShowContributors(true)
  }
  function closeContributors() {
    closeTimer.current = setTimeout(() => setShowContributors(false), 150)
  }
  useFonts(taglines)

  const boardContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = boardContainerRef.current
    if (!el) return
    function measure() {
      const { width, height } = el!.getBoundingClientRect()
      const byW = { w: width, h: width * 1.5 }
      const byH = { w: height * (2 / 3), h: height }
      setBoardSize(byW.h <= height ? byW : byH)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    async function load() {
      const [tagsRes, likeRes] = await Promise.all([
        fetch(`/api/taglines?tmdb_id=${tmdb_id}`),
        fetch(`/api/movies/${tmdb_id}/like`),
      ])
      if (tagsRes.ok) setTaglines((await tagsRes.json()).taglines ?? [])
      if (likeRes.ok) {
        const { liked: l, like_count: lc } = await likeRes.json()
        setLiked(l); setLikeCount(lc ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [tmdb_id])

  async function handleLike() {
    const newLiked = !liked
    setLiked(newLiked); setLikeCount(c => c + (newLiked ? 1 : -1))
    setHeartAnim(true); setTimeout(() => setHeartAnim(false), 600)
    const res = await fetch(`/api/movies/${tmdb_id}/like`, { method: "POST" })
    if (res.ok) {
      const { liked: l, like_count: lc } = await res.json()
      setLiked(l); setLikeCount(lc)
    }
  }
  function handleAdd() { router.push(`/tagline/${tmdb_id}`) }
  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // Last 10 taglines for the board display; all taglines for the contributor list
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

      {/* ── Header — no bottom border ── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 64 }}
      >
        {/* Person icon + contributor dropdown */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={openContributors}
          onMouseLeave={closeContributors}
        >
          <button style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#3f3f46", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <User size={18} className="text-zinc-300" />
          </button>

          {showContributors && (
            <div
              onMouseEnter={openContributors}
              onMouseLeave={closeContributors}
              style={{
              position: "absolute", top: "100%", left: 0, marginTop: 6,
              background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12, zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
              minWidth: 230, maxHeight: 280, overflowY: "auto",
            }}>
              <p style={{
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                fontSize: 11, fontStyle: "italic", color: "#71717a",
                lineHeight: 1.45, margin: 0,
              }}>
                * Only the last 10 taglines appear on Tagline Boards
              </p>
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

        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <X size={14} className="text-zinc-400" />
        </button>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${TMDB_ORIGINAL}${posterPath}`}
                alt=""
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none", pointerEvents: "none" }}
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
      <div className="flex items-center justify-center flex-shrink-0" style={{ height: 68, gap: 96 }}>
        <button onClick={handleLike} className="flex items-center gap-2.5 group" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
            <span className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(239,68,68,0.15)" }} />
            <Heart size={22} className={`relative transition-all ${liked ? "fill-red-500 text-red-500" : "text-zinc-400 group-hover:text-red-400"} ${heartAnim ? "heart-pop" : ""}`} />
          </span>
          <span className="text-sm font-medium tabular-nums" style={{ color: liked ? "#ef4444" : "#a1a1aa" }}>{likeCount}</span>
        </button>

        <button
          onClick={handleAdd}
          onMouseEnter={() => setPencilHovered(true)}
          onMouseLeave={() => setPencilHovered(false)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <span style={{ width: 40, height: 40, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: 10, background: pencilHovered ? "rgba(245,184,0,0.15)" : "transparent", transition: "background 0.15s ease" }} />
            <Pencil size={22} style={{ position: "relative", color: pencilHovered ? "#F5B800" : "#a1a1aa", transition: "color 0.15s ease" }} />
          </span>
        </button>

        <button onClick={handleShare} className="flex items-center gap-2 group" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
            <span className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(113,113,122,0.2)" }} />
            <Share size={20} className="relative text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          </span>
          {copied && <span className="text-xs text-zinc-400">Copied!</span>}
        </button>
      </div>
    </div>
  )
}
