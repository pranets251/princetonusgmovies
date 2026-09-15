"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { ArrowLeft, X, Highlighter } from "lucide-react"
import { TMDB_ORIGINAL, TMDB_W780, BOX_FRAC } from "@/lib/taglineTypes"
import { useIsMobile } from "@/lib/useIsMobile"
import { ProgressTracker } from "./PosterPicker"

const FONT = "Cormorant Garamond"

// Box is 2:3 (portrait, matches poster aspect ratio), 20% smaller than legacy BOX_FRAC=0.25.
// 0.25 × 0.8 = 0.2 for both dimensions.
// aspect check: (bw × 0.2) / (bh × 0.2) = bw/bh = 2/3 ✓
const BOX_W_FRAC = 0.2
const BOX_H_FRAC = 0.2

const THUMB_W = 340

function getTextWithLineBreaks(el: HTMLElement): string {
  return el.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "")
}

// Chrome wraps new lines in <div>, Firefox in <p>. When re-rendered in a
// normal (non-editable) div those block elements lay out differently.
// Converting to <br> produces identical output in both contexts.
function normalizeHtml(innerHTML: string): string {
  return innerHTML
    .replace(/<div>/gi, "<br>")
    .replace(/<\/div>/gi, "")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "<br>")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/(<br\s*\/?>\s*)+$/i, "")
}

const COLOR_GRID: string[][] = [
  ["#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#efefef","#f3f3f3","#ffffff"],
  ["#7f0000","#7f3300","#7f6000","#2e6b00","#006666","#003399","#1a0066","#4a0066","#7f0044","#7f002e"],
  ["#cc0000","#cc6600","#ccaa00","#4d9900","#009999","#0044cc","#3300aa","#7700aa","#cc0066","#aa0044"],
  ["#ff0000","#ff8800","#ffdd00","#66cc00","#00cccc","#0055ff","#4400ee","#9900ee","#ff0088","#dd0055"],
  ["#ff5555","#ffaa44","#ffee55","#88ee44","#44eeee","#5588ff","#7744ff","#bb44ff","#ff55aa","#ff4477"],
  ["#ff9999","#ffcc88","#fff099","#aaf088","#99f0f0","#99b8ff","#aa99ff","#dd99ff","#ff99cc","#ff99aa"],
  ["#ffd5d5","#ffe0bb","#fffabb","#d5f5bb","#d5f5f5","#d5e5ff","#ddd5ff","#f0d5ff","#ffd5ee","#ffd5e8"],
]

export interface CreateTaglineData {
  text: string
  html: string
  font: string
  color: string
  x: number
  y: number
  fontSize: number     // manualFontSize / boardHeight
  bwf: number
  bhf: number
  creationBoxW: number // absolute pixel width of the text box at creation time
}

export interface ExistingMark {
  id: string
  x: number
  y: number
  zoom?: number        // legacy
  bwf?: number
  bhf?: number
  creationBoxW?: number // stored absolute pixel width; enables scale-based re-render
  fontSize?: number  // normalized to board height
  text?: string
  html?: string
  font?: string
  color?: string
}

export interface InitialTaglineData {
  text: string
  html: string
  color: string
  x: number
  y: number
  fontSize?: number
}

interface Props {
  posterPath: string
  movieTitle: string
  isFirstTagline: boolean
  existingMarks: ExistingMark[]
  initialData?: InitialTaglineData
  postLabel?: string
  onBack: () => void
  onExit: () => void
  onPost: (data: CreateTaglineData) => Promise<void>
}

function extractColors(img: HTMLImageElement, count = 6): string[] {
  const canvas = document.createElement("canvas")
  canvas.width = 80; canvas.height = 120
  const ctx = canvas.getContext("2d")
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, 80, 120)
  const { data } = ctx.getImageData(0, 0, 80, 120)
  const map = new Map<string, number>()
  for (let i = 0; i < data.length; i += 24) {
    const r = Math.round(data[i] / 28) * 28
    const g = Math.round(data[i + 1] / 28) * 28
    const b = Math.round(data[i + 2] / 28) * 28
    const brightness = (r + g + b) / 3
    if (brightness < 25 || brightness > 230) continue
    const key = `${r},${g},${b}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1])
  const colors: string[] = []
  for (const [key] of sorted) {
    const [r, g, b] = key.split(",").map(Number)
    const similar = colors.some(c => {
      const [cr, cg, cb] = c.replace("rgb(", "").replace(")", "").split(",").map(Number)
      return Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb) < 80
    })
    if (!similar) { colors.push(`rgb(${r},${g},${b})`); if (colors.length >= count) break }
  }
  return colors
}

function ColorPalette({ value, onChange, suggestedColors, label, noColor, icon }: {
  value: string | null
  onChange: (c: string | null) => void
  suggestedColors: string[]
  label: string
  noColor?: boolean
  icon?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const customInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown, true)
    return () => document.removeEventListener("mousedown", onDown, true)
  }, [open])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const left = Math.min(rect.right + 8, window.innerWidth - 296)
      setPopupPos({ top: rect.top + rect.height / 2, left: Math.max(8, left) })
    }
    setOpen(v => !v)
  }

  const btnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 6, padding: 0, cursor: "pointer",
    background: "#18181b",
    border: open ? "1px solid rgba(245,184,0,0.9)" : "1px solid rgba(255,255,255,0.15)",
    flexShrink: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 2,
  }

  return (
    <div ref={containerRef}>
      <button ref={btnRef} onClick={handleToggle} title={label} style={btnStyle}>
        <span style={{ color: "#fff", display: "flex", lineHeight: 1 }}>
          {icon ?? <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>A</span>}
        </span>
        <div style={{ width: 18, height: 3, borderRadius: 1.5, background: value ?? "transparent", border: value ? "none" : "1px dashed rgba(255,255,255,0.3)" }} />
      </button>

      {open && popupPos && (
        <div style={{
          position: "fixed", left: popupPos.left, top: popupPos.top, transform: "translateY(-50%)",
          background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
          padding: "12px", zIndex: 9999, boxShadow: "0 12px 48px rgba(0,0,0,0.9)",
          minWidth: 280, display: "flex", flexDirection: "column", gap: 5,
        }}>
          {suggestedColors.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {suggestedColors.map(c => (
                <button key={c} onClick={() => { onChange(c); setOpen(false) }}
                  style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: value === c ? "2px solid #F5B800" : "1px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {COLOR_GRID.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: 4 }}>
                {row.map(c => (
                  <button key={c} onClick={() => { onChange(c); setOpen(false) }}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: value === c ? "2px solid #F5B800" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>CUSTOM</span>
            <button onClick={() => customInputRef.current?.click()}
              style={{ width: 26, height: 26, borderRadius: "50%", background: "transparent", border: "2px solid rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", fontSize: 18, lineHeight: 1, padding: 0 }}>+</button>
            <input ref={customInputRef} type="color"
              value={value?.startsWith("#") ? value : "#ffffff"}
              onChange={e => onChange(e.target.value)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
            {noColor && (
              <button onClick={() => { onChange(null); setOpen(false) }}
                style={{ marginLeft: "auto", fontSize: 12, color: "#71717a", background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
                None
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SingleStepTracker() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>1</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>Add your tagline</span>
    </div>
  )
}

export default function TaglineCreateStep({
  posterPath, isFirstTagline, existingMarks, initialData, postLabel = "POST", onBack, onExit, onPost,
}: Props) {
  const isMobile = useIsMobile()
  const [mobileStep, setMobileStep] = useState<"position" | "compose">("position")

  const boardContainerRef = useRef<HTMLDivElement>(null)
  const composeContainerRef = useRef<HTMLDivElement>(null)
  const contentEditableRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const draggingRef = useRef(false)
  const lastPtr = useRef({ x: 0, y: 0 })
  const wasEmptyRef = useRef(true)
  const appliedInitialRef = useRef(false)
  const initialBoxPos = initialData ? { x: initialData.x, y: initialData.y } : { x: (1 - BOX_W_FRAC) / 2, y: (1 - BOX_H_FRAC) / 2 }
  const s = useRef({ bw: 0, bh: 0, boxPos: initialBoxPos })

  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 })
  const [composeW, setComposeW] = useState(0)
  const [boxPos, setBoxPos] = useState(initialBoxPos)
  const [text, setText] = useState(initialData?.text ?? "")
  const [html, setHtml] = useState(initialData?.html ?? "")
  const [textColor, setTextColor] = useState(initialData?.color ?? "#FFFFFF")
  const [highlightColor, setHighlightColor] = useState<string | null>("#000000")
  const [manualFontSize, setManualFontSize] = useState(14)
  const [extractedColors, setExtractedColors] = useState<string[]>([])
  const [posting, setPosting] = useState(false)

  const showLiveEditor = !isMobile || mobileStep === "compose"

  // ── Apply initial (edit-mode) text/font-size into the DOM once the live editor exists ──
  useEffect(() => {
    if (!initialData || appliedInitialRef.current || boardSize.h <= 0 || !showLiveEditor) return
    if (!contentEditableRef.current) return
    appliedInitialRef.current = true
    if (initialData.fontSize) setManualFontSize(Math.round(initialData.fontSize * boardSize.h))
    contentEditableRef.current.innerHTML = initialData.html || initialData.text || ""
    wasEmptyRef.current = !(initialData.text || initialData.html)
  }, [initialData, boardSize.h, showLiveEditor])

  // ── Measure board container (re-observes whenever the mobile/desktop or
  //    position/compose branch swaps in a different container element) ──
  useEffect(() => {
    const el = boardContainerRef.current
    if (!el) return
    function measure() {
      const BTN_COL = isMobile ? 0 : 52  // 40px buttons + 12px gap (desktop color rail only)
      const PAD = 40      // 20px padding each side
      const { width, height } = el!.getBoundingClientRect()
      const availW = width - PAD - BTN_COL
      const availH = height - PAD
      const byW = { w: availW, h: availW * 1.5 }
      const byH = { w: availH * (2 / 3), h: availH }
      const size = byW.h <= availH ? byW : byH
      setBoardSize(size)
      s.current.bw = size.w
      s.current.bh = size.h
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMobile, mobileStep])

  // ── Measure the mobile compose preview's available width ──
  useEffect(() => {
    const el = composeContainerRef.current
    if (!el) return
    function measure() { setComposeW(Math.min(THUMB_W, el!.getBoundingClientRect().width)) }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMobile, mobileStep])

  // ── Auto-focus once the live editor is actually on screen ──
  useEffect(() => {
    if (!showLiveEditor) return
    const raf = requestAnimationFrame(() => {
      contentEditableRef.current?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [showLiveEditor])

  // ── Sync font size directly to the DOM node ───────────────────────────────
  // React's reconciler can skip style updates on user-modified contentEditable
  // elements. Writing imperatively guarantees the change always lands.
  useEffect(() => {
    if (contentEditableRef.current) {
      contentEditableRef.current.style.fontSize = `${manualFontSize}px`
    }
  }, [manualFontSize])

  // ── Load font ────────────────────────────────────────────────────────────
  useEffect(() => {
    const existingFonts = existingMarks.map(m => m.font).filter(Boolean) as string[]
    const all = [...new Set([FONT, ...existingFonts])]
    const families = all.map(f => `family=${encodeURIComponent(f)}`).join("&")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }, []) // eslint-disable-line

  // ── Extract poster colors ─────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => setExtractedColors(extractColors(img))
    img.src = `${TMDB_W780}${posterPath}`
  }, [posterPath])

  // ── Track selection for execCommand ──────────────────────────────────────
  useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection()
      const ce = contentEditableRef.current
      if (!sel || sel.rangeCount === 0 || !ce) return
      const range = sel.getRangeAt(0)
      if (ce.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange()
    }
    document.addEventListener("selectionchange", onSelChange)
    return () => document.removeEventListener("selectionchange", onSelChange)
  }, [])

  // ── Drag handle ───────────────────────────────────────────────────────────
  function handleDragStart(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    lastPtr.current = { x: e.clientX, y: e.clientY }
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    const dx = e.clientX - lastPtr.current.x
    const dy = e.clientY - lastPtr.current.y
    lastPtr.current = { x: e.clientX, y: e.clientY }
    const { bw, bh, boxPos: bp } = s.current
    const np = {
      x: Math.max(0, Math.min(1 - BOX_W_FRAC, bp.x + dx / bw)),
      y: Math.max(0, Math.min(1 - BOX_H_FRAC, bp.y + dy / bh)),
    }
    s.current.boxPos = np
    setBoxPos(np)
  }

  function handleDragEnd() { draggingRef.current = false }

  // ── execCommand color helpers ─────────────────────────────────────────────
  const applyTextColor = useCallback((color: string | null) => {
    if (!color) return
    setTextColor(color)
    const range = savedRangeRef.current
    if (!range || !contentEditableRef.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges(); sel.addRange(range)
    document.execCommand("foreColor", false, color)
    const ce = contentEditableRef.current
    setText(getTextWithLineBreaks(ce)); setHtml(normalizeHtml(ce.innerHTML))
  }, [])

  const applyHighlight = useCallback((color: string | null) => {
    setHighlightColor(color)
    const range = savedRangeRef.current
    if (!range || !contentEditableRef.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges(); sel.addRange(range)
    document.execCommand("hiliteColor", false, color ?? "transparent")
    const ce = contentEditableRef.current
    setText(getTextWithLineBreaks(ce)); setHtml(normalizeHtml(ce.innerHTML))
  }, [])

  function handleContentInput(e: React.FormEvent<HTMLDivElement>) {
    const ce = e.currentTarget
    const isEmpty = !ce.textContent

    // Priming the very first character(s) with the active highlight:
    // execCommand can't carry a "current format" into completely empty
    // content, but it reliably extends an existing highlighted span once
    // one exists — so apply it once right as content first appears, then
    // let normal typing extend it from there.
    if (wasEmptyRef.current && !isEmpty && highlightColor) {
      const sel = window.getSelection()
      const fullRange = document.createRange()
      fullRange.selectNodeContents(ce)
      sel?.removeAllRanges(); sel?.addRange(fullRange)
      document.execCommand("hiliteColor", false, highlightColor)
      const endRange = document.createRange()
      endRange.selectNodeContents(ce)
      endRange.collapse(false)
      sel?.removeAllRanges(); sel?.addRange(endRange)
    }
    wasEmptyRef.current = isEmpty

    setText(getTextWithLineBreaks(ce).slice(0, 200))
    setHtml(normalizeHtml(ce.innerHTML))
  }

  // ── Post ──────────────────────────────────────────────────────────────────
  async function handlePost() {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      await onPost({
        text,
        html: normalizeHtml(contentEditableRef.current?.innerHTML ?? ""),
        font: FONT,
        color: textColor,
        x: boxPos.x,
        y: boxPos.y,
        fontSize: boardSize.h > 0 ? manualFontSize / boardSize.h : 0.04,
        bwf: BOX_W_FRAC,
        bhf: BOX_H_FRAC,
        creationBoxW: Math.round(boxW),
      })
    } finally {
      setPosting(false)
    }
  }

  // ── Derived layout ────────────────────────────────────────────────────────
  const { w: bw, h: bh } = boardSize
  const boxW = bw * BOX_W_FRAC
  const boxH = bh * BOX_H_FRAC
  const boxLeft = boxPos.x * bw
  const boxTop  = boxPos.y * bh

  const suggestedColors = ["#FFFFFF", "#000000", ...extractedColors]
  const btnBase: React.CSSProperties = {
    background: "#18181b", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
    color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  }
  const noSelect: React.CSSProperties = { userSelect: "none", WebkitUserSelect: "none" }

  // Existing marks rendered on the full board (position at % of board, sized in board px)
  function renderExistingOnBoard() {
    return existingMarks.map(mark => {
      const mBwf = mark.bwf ?? (BOX_FRAC / (mark.zoom ?? 1))
      const mBhf = mark.bhf ?? (BOX_FRAC / (mark.zoom ?? 1))
      const displayBoxW = mBwf * bw
      const displayBoxH = mBhf * bh
      const refW = (mark.creationBoxW && mark.creationBoxW > 0) ? mark.creationBoxW : displayBoxW
      const refH = refW * (mBhf / mBwf) * 1.5
      const refFontPx = mark.fontSize ? mark.fontSize * (refW / mBwf) * 1.5 : 14
      const scale = displayBoxW / refW
      const textStyle: React.CSSProperties = {
        fontFamily: `"${mark.font ?? "sans-serif"}", sans-serif`,
        fontSize: refFontPx,
        color: mark.color ?? "#fff",
        textAlign: "center",
        lineHeight: 1.3,
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        width: "100%",
      }
      return (
        <div key={mark.id} style={{ position: "absolute", left: `${mark.x * 100}%`, top: `${mark.y * 100}%`, width: displayBoxW, height: displayBoxH, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ width: refW, height: refH, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", alignItems: "center", justifyContent: "center", padding: "3% 5%", boxSizing: "border-box" }}>
            {mark.html
              ? <div dangerouslySetInnerHTML={{ __html: mark.html }} style={textStyle} />
              : <div style={textStyle}>{mark.text}</div>
            }
          </div>
        </div>
      )
    })
  }

  // Existing marks rendered inside the box-cropped preview frame (positioned relative to the box's origin)
  function renderExistingInPreview() {
    return existingMarks.map(mark => {
      const mBwf = mark.bwf ?? (BOX_FRAC / (mark.zoom ?? 1))
      const mBhf = mark.bhf ?? (BOX_FRAC / (mark.zoom ?? 1))
      const mFontSize = (mark.fontSize ?? 0.04) * bh
      const mLeft = mark.x * bw - boxLeft
      const mTop  = mark.y * bh - boxTop
      const textStyle: React.CSSProperties = {
        fontFamily: `"${mark.font ?? "sans-serif"}", sans-serif`,
        fontSize: mFontSize, color: mark.color ?? "#fff",
        textAlign: "center", lineHeight: 1.3,
        wordBreak: "break-word", whiteSpace: "pre-wrap", width: "100%",
      }
      return (
        <div key={mark.id} style={{
          position: "absolute",
          left: mLeft, top: mTop,
          width: mBwf * bw, height: mBhf * bh,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "3% 5%", boxSizing: "border-box", overflow: "hidden",
        }}>
          {mark.html
            ? <div dangerouslySetInnerHTML={{ __html: mark.html }} style={textStyle} />
            : <div style={textStyle}>{mark.text}</div>
          }
        </div>
      )
    })
  }

  // The box-cropped preview frame — a scaled clone of the exact boxW × boxH region.
  // `liveEdit` swaps the read-only text clone for the actual contentEditable field
  // (used on mobile, where this frame IS the composing surface, not just a preview).
  function renderPreviewFrame(targetW: number, liveEdit: boolean) {
    const targetH = targetW * 1.5
    const scale = bw > 0 ? targetW / boxW : 1
    return (
      <div style={{
        width: targetW, height: targetH,
        position: "relative", overflow: "hidden",
        borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
        background: "#111", flexShrink: 0,
      }}>
        {bw > 0 ? (
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: boxW, height: boxH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: liveEdit ? "auto" : "none",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${TMDB_ORIGINAL}${posterPath})`,
              backgroundSize: `${bw}px ${bh}px`,
              backgroundPosition: `${-boxLeft}px ${-boxTop}px`,
              backgroundRepeat: "no-repeat",
            }} />

            {renderExistingInPreview()}

            <div
              style={{
                position: "absolute", inset: 0, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "3% 5%", background: "rgba(0,0,0,0.18)",
                cursor: liveEdit ? "text" : "default",
              }}
              onClick={liveEdit ? () => contentEditableRef.current?.focus() : undefined}
            >
              {liveEdit ? (
                <div
                  ref={contentEditableRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleContentInput}
                  style={{
                    fontFamily: `"${FONT}", serif`,
                    fontSize: manualFontSize,
                    color: textColor,
                    textAlign: "center",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                    outline: "none",
                    caretColor: textColor,
                    width: "100%",
                    minHeight: "1em",
                    background: "transparent",
                    userSelect: "text",
                    WebkitUserSelect: "text",
                  }}
                />
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: html || "" }}
                  style={{
                    fontFamily: `"${FONT}", serif`,
                    fontSize: manualFontSize,
                    color: textColor,
                    textAlign: "center", lineHeight: 1.3,
                    wordBreak: "break-word", whiteSpace: "pre-wrap",
                    width: "100%",
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "system-ui" }}>preview</span>
          </div>
        )}
      </div>
    )
  }

  // Compact top bar used on mobile — full labels/step-tracker crowd a phone width,
  // so this collapses to just the back/exit buttons plus a short label.
  function MobileTopBar({ onBackClick, label }: { onBackClick: () => void; label: string }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <button onClick={onBackClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "#fff", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>{label}</span>
        <button onClick={onExit} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>
          <X size={18} />
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Mobile — step A: position only (drag the empty box on the full board)
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile && mobileStep === "position") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#09090b" }}>
        <MobileTopBar onBackClick={onBack} label="Position your tagline" />

        <div
          ref={boardContainerRef}
          style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", padding: 20 }}
        >
          {bw > 0 && (
            <div style={{ width: bw, height: bh, position: "relative", flexShrink: 0, overflow: "visible", ...noSelect }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${TMDB_ORIGINAL}${posterPath}`}
                alt=""
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
              />

              {renderExistingOnBoard()}

              <div style={{
                position: "absolute",
                left: boxLeft, top: boxTop,
                width: boxW, height: boxH,
                border: "2px solid rgba(245,184,0,0.9)",
                boxSizing: "border-box",
                overflow: "visible",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.18)",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "0 6px" }}>
                  Tagline goes here
                </span>
                <div
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  style={{
                    position: "absolute",
                    top: -26,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 44, height: 22,
                    borderRadius: 6,
                    background: "rgba(245,184,0,0.95)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 3,
                    cursor: "grab",
                    zIndex: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    ...noSelect,
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 20, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.9)" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <button
            onClick={() => setMobileStep("compose")}
            disabled={bw <= 0}
            style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: bw > 0 ? "#fff" : "#27272a", color: bw > 0 ? "#000" : "#52525b", fontWeight: 700, fontSize: 16, cursor: bw > 0 ? "pointer" : "not-allowed" }}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Mobile — step B: compose (write/style the tagline against the preview frame)
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile && mobileStep === "compose") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#09090b" }}>
        <MobileTopBar onBackClick={() => setMobileStep("position")} label="Write your tagline" />

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 16px" }}>
          <div ref={composeContainerRef} style={{ width: "100%", maxWidth: THUMB_W, display: "flex", justifyContent: "center" }}>
            {renderPreviewFrame(composeW || 280, true)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ColorPalette value={textColor} onChange={applyTextColor} suggestedColors={suggestedColors} label="Text color" />
            <ColorPalette value={highlightColor} onChange={applyHighlight} suggestedColors={suggestedColors} label="Highlight" noColor icon={<Highlighter size={18} />} />
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />
            <button onClick={() => setManualFontSize(v => Math.max(6, v - 2))} style={{ ...btnBase, width: 36, height: 36, fontSize: 20 }}>−</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 20, textAlign: "center" }}>{manualFontSize}</span>
            <button onClick={() => setManualFontSize(v => Math.min(200, v + 2))} style={{ ...btnBase, width: 36, height: 36, fontSize: 20 }}>+</button>
          </div>
        </div>

        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <button
            onClick={handlePost}
            disabled={!text.trim() || posting}
            style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: text.trim() && !posting ? "#fff" : "#27272a", color: text.trim() && !posting ? "#000" : "#52525b", fontWeight: 700, fontSize: 16, cursor: text.trim() && !posting ? "pointer" : "not-allowed" }}
          >
            {posting ? "Posting…" : postLabel}
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Desktop — combined board + editor + preview, unchanged
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#09090b" }}>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 80, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, background: "#fff", border: "none", borderRadius: 12, color: "#000", cursor: "pointer" }}>
          <ArrowLeft size={25} />
        </button>
        {isFirstTagline ? <ProgressTracker activeStep={2} /> : <SingleStepTracker />}
        <button onClick={onExit} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, color: "#ef4444", cursor: "pointer" }}>
          <X size={25} />
        </button>
      </div>

      {/* ── Main row ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ══ CENTER: board ══ */}
        <div
          ref={boardContainerRef}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", overflow: "visible", padding: 20 }}
        >
          {bw > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

              {/* Colour + size controls — left of board */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <ColorPalette value={textColor} onChange={applyTextColor} suggestedColors={suggestedColors} label="Text color" />
                <ColorPalette value={highlightColor} onChange={applyHighlight} suggestedColors={suggestedColors} label="Highlight" noColor icon={<Highlighter size={18} />} />
                <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.15)", margin: "2px 0" }} />
                <button onClick={() => setManualFontSize(v => Math.min(200, v + 2))} style={{ ...btnBase, width: 40, height: 40, fontSize: 22 }}>+</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{manualFontSize}</span>
                <button onClick={() => setManualFontSize(v => Math.max(6, v - 2))} style={{ ...btnBase, width: 40, height: 40, fontSize: 22 }}>−</button>
              </div>

            <div style={{ width: bw, height: bh, position: "relative", flexShrink: 0, overflow: "visible", ...noSelect }}>

              {/* Poster */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${TMDB_ORIGINAL}${posterPath}`}
                alt=""
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
              />

              {/* Existing marks — rendered at creation pixel dimensions then scaled.
                  This makes layout independent of the current viewport/board size. */}
              {renderExistingOnBoard()}

              {/* Draggable text box */}
              <div style={{
                position: "absolute",
                left: boxLeft, top: boxTop,
                width: boxW, height: boxH,
                border: "2px solid rgba(245,184,0,0.9)",
                boxSizing: "border-box",
                overflow: "visible",
              }}>
                {/* Grip handle — rounded pill sitting fully above the box */}
                <div
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  style={{
                    position: "absolute",
                    top: -26,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 44, height: 22,
                    borderRadius: 6,
                    background: "rgba(245,184,0,0.95)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 3,
                    cursor: "grab",
                    zIndex: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    ...noSelect,
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 20, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.9)" }} />
                  ))}
                </div>

                {/* Text area — inner clip */}
                <div
                  style={{
                    position: "absolute", inset: 0, overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "3% 5%", cursor: "text",
                    background: "rgba(0,0,0,0.18)",
                  }}
                  onClick={() => contentEditableRef.current?.focus()}
                >
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentInput}
                    style={{
                      fontFamily: `"${FONT}", serif`,
                      fontSize: manualFontSize,
                      color: textColor,
                      textAlign: "center",
                      lineHeight: 1.3,
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      outline: "none",
                      caretColor: textColor,
                      width: "100%",
                      minHeight: "1em",
                      background: "transparent",
                      userSelect: "text",
                      WebkitUserSelect: "text",
                    }}
                  />
                </div>
              </div>

            </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT: thumbnail preview ══ */}
        <div style={{
          width: THUMB_W + 64,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, borderLeft: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, padding: "0 32px 130px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Tagline Thumbnail Preview
            </p>
            <p style={{ margin: 0, fontSize: 10, color: "#fff", fontStyle: "italic", lineHeight: 1.35, textAlign: "center" }}>
              Text may render slightly differently on the poster — only the last 10 taglines appear on a poster
            </p>
          </div>
          {renderPreviewFrame(THUMB_W, false)}
        </div>

      </div>

      {/* ── Post button (fixed, bottom-right like PosterPicker Continue) ── */}
      <button
        onClick={handlePost}
        disabled={!text.trim() || posting}
        style={{
          position: "fixed", bottom: 32, right: 36,
          padding: "19px 42px", borderRadius: 14, border: "none",
          background: text.trim() && !posting ? "#fff" : "#27272a",
          color: text.trim() && !posting ? "#000" : "#52525b",
          fontWeight: 700, fontSize: 19, letterSpacing: "0.04em",
          cursor: text.trim() && !posting ? "pointer" : "not-allowed",
          transition: "background 0.15s, color 0.15s",
          zIndex: 50,
          boxShadow: text.trim() && !posting ? "0 4px 24px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {posting ? "Posting…" : postLabel}
      </button>
    </div>
  )
}
