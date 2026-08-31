import { useState, useEffect, useCallback } from "react"
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Pressable, RefreshControl, SafeAreaView,
} from "react-native"
import {
  collection, query, orderBy, limit, getDocs,
  where, doc, getDoc, setDoc, deleteDoc,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import TaglineCard from "@/components/TaglineCard"
import { Colors } from "@/constants/Colors"

type Tab = "campus" | "following"

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>("campus")
  const [taglines, setTaglines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [endorsedIds, setEndorsedIds] = useState<Set<string>>(new Set())

  const email = auth.currentUser?.email ?? ""

  async function fetchTaglines(selectedTab: Tab) {
    if (selectedTab === "following") {
      // Get who the user follows, then filter taglines
      const followsSnap = await getDocs(
        query(collection(db, "follows"), where("follower_email", "==", email))
      )
      const followingEmails = followsSnap.docs.map(d => (d.data() as any).following_email as string)

      if (followingEmails.length === 0) return []

      // Firestore `in` supports up to 10 values
      const chunks = []
      for (let i = 0; i < followingEmails.length; i += 10) {
        chunks.push(followingEmails.slice(i, i + 10))
      }
      const results = await Promise.all(
        chunks.map(chunk =>
          getDocs(
            query(
              collection(db, "taglines"),
              where("user_email", "in", chunk),
              orderBy("created_at", "desc"),
              limit(40)
            )
          )
        )
      )
      const docs = results.flatMap(s => s.docs).map(d => ({ id: d.id, ...d.data() }))
      return docs.sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1)).slice(0, 60)
    }

    const snap = await getDocs(
      query(collection(db, "taglines"), orderBy("created_at", "desc"), limit(60))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async function load(t: Tab, isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await fetchTaglines(t)
      setTaglines(data)

      // Fetch endorsement state
      if (email && data.length > 0) {
        const endorsed = new Set<string>()
        await Promise.all(
          data.map(async (tl: any) => {
            const ref = doc(db, "tagline_endorsements", `${tl.id}_${email}`)
            const snap = await getDoc(ref)
            if (snap.exists()) endorsed.add(tl.id)
          })
        )
        setEndorsedIds(endorsed)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load(tab) }, [tab])

  const switchTab = (t: Tab) => {
    setTab(t)
    setTaglines([])
  }

  async function handleEndorse(taglineId: string, tmdbId: number) {
    if (!email) return
    const refId = `${taglineId}_${email}`
    const ref = doc(db, "tagline_endorsements", refId)
    const taglineRef = doc(db, "taglines", taglineId)

    const newEndorsed = new Set(endorsedIds)
    if (endorsedIds.has(taglineId)) {
      newEndorsed.delete(taglineId)
      await deleteDoc(ref)
      setTaglines(prev =>
        prev.map(t =>
          t.id === taglineId ? { ...t, endorse_count: Math.max(0, (t.endorse_count ?? 0) - 1) } : t
        )
      )
    } else {
      newEndorsed.add(taglineId)
      await setDoc(ref, { tagline_id: taglineId, user_email: email, tmdb_id: tmdbId, created_at: new Date().toISOString() })
      setTaglines(prev =>
        prev.map(t =>
          t.id === taglineId ? { ...t, endorse_count: (t.endorse_count ?? 0) + 1 } : t
        )
      )
    }
    setEndorsedIds(newEndorsed)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabRow}>
        {(["campus", "following"] as Tab[]).map(t => (
          <Pressable key={t} style={styles.tabBtn} onPress={() => switchTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.text} />
        </View>
      ) : (
        <FlatList
          data={taglines}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(tab, true)}
              tintColor={Colors.text}
            />
          }
          renderItem={({ item }) => (
            <TaglineCard
              tagline={item}
              endorsed={endorsedIds.has(item.id)}
              onEndorse={() => handleEndorse(item.id, item.tmdb_id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {tab === "following" ? "Follow someone to see their taglines." : "No taglines yet."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabText: { fontSize: 14, fontWeight: "500", color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: "10%",
    right: "10%",
    height: 2,
    backgroundColor: Colors.text,
    borderRadius: 1,
  },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
})
