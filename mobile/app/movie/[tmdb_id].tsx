import { useState, useEffect } from "react"
import {
  View, Text, Image, FlatList, StyleSheet, ActivityIndicator,
  Pressable, ScrollView, SafeAreaView,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { api } from "@/lib/api"
import TaglineCard from "@/components/TaglineCard"
import { Colors } from "@/constants/Colors"
import { API_BASE_URL } from "@/constants/config"

const TMDB_IMG = "https://image.tmdb.org/t/p/w342"

export default function MovieScreen() {
  const { tmdb_id } = useLocalSearchParams<{ tmdb_id: string }>()
  const router = useRouter()
  const email = auth.currentUser?.email ?? ""

  const [taglines, setTaglines] = useState<any[]>([])
  const [board, setBoard] = useState<any>(null)
  const [tmdbData, setTmdbData] = useState<any>(null)
  const [endorsed, setEndorsed] = useState(false)
  const [endorseCount, setEndorseCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"board" | "taglines">("board")

  useEffect(() => {
    async function load() {
      const [taglinesSnap, boardSnap] = await Promise.all([
        getDocs(query(collection(db, "taglines"), where("tmdb_id", "==", Number(tmdb_id)))),
        getDoc(doc(db, "tagline_boards", tmdb_id)),
      ])

      const tls = taglinesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1))
      setTaglines(tls)
      if (boardSnap.exists()) setBoard(boardSnap.data())

      // Endorse state
      const endorseRef = doc(db, "movie_endorsements", `${tmdb_id}_${email}`)
      const endorseSnap = await getDoc(endorseRef)
      setEndorsed(endorseSnap.exists())

      // Count endorsements
      const countSnap = await getDocs(
        query(
          collection(db, "movie_endorsements"),
          where("tmdb_id", "==", Number(tmdb_id)),
          where("endorsed", "==", true)
        )
      )
      setEndorseCount(countSnap.size)
      setLoading(false)
    }
    load()
  }, [tmdb_id])

  async function handleEndorse() {
    const ref = doc(db, "movie_endorsements", `${tmdb_id}_${email}`)
    if (endorsed) {
      await deleteDoc(ref)
      setEndorsed(false)
      setEndorseCount(c => Math.max(0, c - 1))
    } else {
      await setDoc(ref, { tmdb_id: Number(tmdb_id), user_email: email, endorsed: true, created_at: new Date().toISOString() })
      setEndorsed(true)
      setEndorseCount(c => c + 1)
    }
  }

  const boardImageUri = board ? `${API_BASE_URL}/api/board-image/${tmdb_id}` : null
  const posterPath = board?.poster_path ?? taglines[0]?.poster_path ?? null
  const movieTitle = board?.movie_title ?? taglines[0]?.movie_title ?? `Movie ${tmdb_id}`

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.text} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <FlatList
        data={tab === "taglines" ? taglines : []}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Board image */}
            {boardImageUri ? (
              <Image
                source={{ uri: boardImageUri }}
                style={styles.boardImage}
                resizeMode="contain"
              />
            ) : posterPath ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w780${posterPath}` }}
                style={styles.boardImage}
                resizeMode="contain"
              />
            ) : null}

            {/* Title & actions */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{movieTitle}</Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, endorsed && styles.actionBtnActive]}
                onPress={handleEndorse}
              >
                <Text style={[styles.actionBtnText, endorsed && styles.actionBtnTextActive]}>
                  {endorsed ? "★ Endorsed" : "☆ Endorse"}
                </Text>
                <Text style={styles.actionBtnCount}>{endorseCount}</Text>
              </Pressable>
              <Pressable
                style={styles.addBtn}
                onPress={() => router.push({ pathname: "/tagline/create", params: { tmdb_id } })}
              >
                <Text style={styles.addBtnText}>+ Add tagline</Text>
              </Pressable>
            </View>

            {/* Tab bar */}
            <View style={styles.tabRow}>
              {(["board", "taglines"] as const).map(t => (
                <Pressable key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === "board" ? `Board` : `Taglines (${taglines.length})`}
                  </Text>
                  {tab === t && <View style={styles.tabUnderline} />}
                </Pressable>
              ))}
            </View>

            {tab === "board" && (
              <View style={styles.contributorSection}>
                <Text style={styles.sectionLabel}>Contributors</Text>
                {[...new Set(taglines.map((t: any) => t.username))].map(username => (
                  <Pressable
                    key={username as string}
                    style={styles.contributorRow}
                    onPress={() => router.push(`/profile/${username}`)}
                  >
                    <Text style={styles.contributorName}>@{username as string}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <TaglineCard tagline={item} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontSize: 15, color: Colors.text },
  boardImage: { width: "100%", aspectRatio: 2 / 3, backgroundColor: Colors.card },
  titleRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.text, letterSpacing: -0.3 },
  actionsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionBtnActive: { backgroundColor: "#f5b800", borderColor: "#f5b800" },
  actionBtnText: { fontSize: 14, fontWeight: "500", color: Colors.text },
  actionBtnTextActive: { color: "#000" },
  actionBtnCount: { fontSize: 13, color: Colors.textMuted },
  addBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: Colors.text, alignItems: "center",
  },
  addBtnText: { fontSize: 14, fontWeight: "600", color: Colors.bg },
  tabRow: {
    flexDirection: "row", borderBottomWidth: 1, borderColor: Colors.border,
    marginHorizontal: 16,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  tabText: { fontSize: 14, fontWeight: "500", color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  tabUnderline: {
    position: "absolute", bottom: -1, left: "10%", right: "10%",
    height: 2, backgroundColor: Colors.text, borderRadius: 1,
  },
  contributorSection: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: Colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  contributorRow: { paddingVertical: 8, borderBottomWidth: 1, borderColor: Colors.border },
  contributorName: { fontSize: 14, color: Colors.text },
  list: { paddingBottom: 24 },
})
