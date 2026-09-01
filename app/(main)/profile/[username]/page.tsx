"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import TaglineCard from "@/components/TaglineCard"
import BoardThumbnail from "@/components/BoardThumbnail"
import TaglineBoardModal from "@/components/TaglineBoardModal"
import { Tagline } from "@/lib/taglineTypes"
import { useFonts } from "@/lib/useFonts"

interface Profile {
  username: string
  bio: string | null
  photo_url: string | null
  is_self: boolean
  followers: number
  following: number
  is_following: boolean
}

interface LikedMovie {
  tmdb_id: number
  movie_title: string
  poster_path: string
  taglines: Tagline[]
}

export default function ProfilePage() {
  const { username } = useParams() as { username: string }
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<"taglines" | "liked">("taglines")
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [taglines, setTaglines] = useState<Tagline[]>([])
  const [likedMovies, setLikedMovies] = useState<LikedMovie[]>([])
  const [likedLoading, setLikedLoading] = useState(false)
  const [likedLoaded, setLikedLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [boardModalTmdbId, setBoardModalTmdbId] = useState<number | null>(null)
  const [followLoading, setFollowLoading] = useState(false)

  const likedTaglines = useMemo(() => likedMovies.flatMap(m => m.taglines), [likedMovies])
  useFonts(tab === "taglines" ? taglines : likedTaglines)

  useEffect(() => {
    async function load() {
      const [profRes, tagsRes] = await Promise.all([
        fetch(`/api/profile/${username}`),
        fetch(`/api/taglines?username=${username}`),
      ])
      if (profRes.ok) setProfile((await profRes.json()).profile)
      if (tagsRes.ok) setTaglines((await tagsRes.json()).taglines ?? [])
      setLoading(false)
    }
    load()
  }, [username])

  async function handleFollow() {
    if (followLoading) return
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" })
      if (res.ok) {
        const { following } = await res.json()
        setProfile(p => p ? { ...p, is_following: following, followers: p.followers + (following ? 1 : -1) } : p)
      }
    } finally {
      setFollowLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== "liked" || likedLoaded) return
    setLikedLoading(true)
    fetch(`/api/profile/${username}/endorsed-movies`)
      .then(r => r.json())
      .then(data => setLikedMovies(data.movies ?? []))
      .finally(() => { setLikedLoading(false); setLikedLoaded(true) })
  }, [tab, likedLoaded, username])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-zinc-500 text-sm">User not found.</p>
    </div>
  )

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Profile header */}
      <div className="px-6 py-6 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold text-white overflow-hidden flex-shrink-0">
            {profile.photo_url
              ? <img src={profile.photo_url} alt={profile.username} className="w-full h-full object-cover" />
              : profile.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-base">{profile.username}</span>
              {profile.is_self
                ? <button onClick={() => router.push("/settings")} className="text-xs border border-zinc-600 rounded-full px-3 py-0.5 text-zinc-400 hover:border-white hover:text-white transition-colors">Edit</button>
                : profile.is_following
                  ? <button onClick={handleFollow} disabled={followLoading} className={`text-xs border border-zinc-600 rounded-full px-3 py-0.5 text-zinc-400 transition-colors relative ${followLoading ? "pointer-events-none" : "hover:border-red-500 hover:text-red-500"}`}>
                      <span style={{ opacity: followLoading ? 0 : 1 }}>Following</span>
                      {followLoading && <span className="absolute inset-0 flex items-center justify-center"><span className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin block" /></span>}
                    </button>
                  : <button onClick={handleFollow} disabled={followLoading} className={`text-xs border border-white rounded-full px-3 py-0.5 bg-white text-black transition-colors relative ${followLoading ? "pointer-events-none" : "hover:bg-zinc-200"}`}>
                      <span style={{ opacity: followLoading ? 0 : 1 }}>Follow</span>
                      {followLoading && <span className="absolute inset-0 flex items-center justify-center"><span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin block" /></span>}
                    </button>}
            </div>
            {profile.bio && <p className="text-sm text-zinc-400 mt-0.5">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <span className="text-zinc-400"><span className="font-semibold text-white">{profile.followers ?? 0}</span> Followers</span>
          <span className="text-zinc-400"><span className="font-semibold text-white">{profile.following ?? 0}</span> Following</span>
          <span className="text-zinc-400"><span className="font-semibold text-white">{taglines.length}</span> Taglines</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        {(["taglines", "liked"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            onMouseEnter={() => setHoveredTab(t)}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex-1 py-3 text-sm font-medium capitalize"
            style={{
              color: tab === t ? "#fff" : hoveredTab === t ? "#fff" : "#71717a",
              borderBottom: tab === t ? "2px solid #fff" : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.15s ease, border-bottom-color 0.15s ease",
            }}
          >
            {t === "taglines" ? "Taglines" : "Liked"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {tab === "taglines" && (
          taglines.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-zinc-500 text-sm">No taglines yet.</p>
            </div>
          ) : (
            <div className="p-5" style={{ columns: 2, columnGap: 12 }}>
              {taglines.map(t => (
                <div key={t.id} style={{ breakInside: "avoid", marginBottom: 12 }}>
                  <TaglineCard tagline={t} onClick={() => setBoardModalTmdbId(t.tmdb_id)} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === "liked" && (
          likedLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : likedMovies.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-zinc-500 text-sm">No liked movies yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ padding: 20, gap: 14 }}>
              {likedMovies.map(m => (
                <BoardThumbnail
                  key={m.tmdb_id}
                  posterPath={m.poster_path}
                  taglines={m.taglines}
                  tmdbId={m.tmdb_id}
                  onClick={() => setBoardModalTmdbId(m.tmdb_id)}
                />
              ))}
            </div>
          )
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
