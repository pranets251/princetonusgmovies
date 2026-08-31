import { useState, useEffect } from "react"
import {
  View, Text, Image, FlatList, StyleSheet,
  ActivityIndicator, Pressable, SafeAreaView,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import {
  collection, query, where, getDocs,
  doc, getDoc, setDoc, deleteDoc,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Colors } from "@/constants/Colors"

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const router = useRouter()
  const myEmail = auth.currentUser?.email ?? ""

  const [profile, setProfile] = useState<any>(null)
  const [taglines, setTaglines] = useState<any[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    async function load() {
      // Find profile by username
      const profilesSnap = await getDocs(
        query(collection(db, "profiles"), where("username", "==", username))
      )
      if (profilesSnap.empty) { setLoading(false); return }
      const profileDoc = profilesSnap.docs[0]
      const profileData = { email: profileDoc.id, ...profileDoc.data() }
      setProfile(profileData)

      const [taglinesSnap, followersSnap, followingSnap, myFollowSnap] = await Promise.all([
        getDocs(query(collection(db, "taglines"), where("username", "==", username))),
        getDocs(query(collection(db, "follows"), where("following_email", "==", profileData.email))),
        getDocs(query(collection(db, "follows"), where("follower_email", "==", profileData.email))),
        getDoc(doc(db, "follows", `${myEmail}_${profileData.email}`)),
      ])

      setTaglines(
        taglinesSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1))
      )
      setFollowersCount(followersSnap.size)
      setFollowingCount(followingSnap.size)
      setIsFollowing(myFollowSnap.exists())
      setLoading(false)
    }
    load()
  }, [username])

  async function handleFollow() {
    if (!profile) return
    setFollowLoading(true)
    const followId = `${myEmail}_${profile.email}`
    const ref = doc(db, "follows", followId)
    if (isFollowing) {
      await deleteDoc(ref)
      setIsFollowing(false)
      setFollowersCount(c => Math.max(0, c - 1))
    } else {
      await setDoc(ref, {
        follower_email: myEmail,
        following_email: profile.email,
        created_at: new Date().toISOString(),
      })
      setIsFollowing(true)
      setFollowersCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.text} />
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.notFound}>User not found.</Text>
      </SafeAreaView>
    )
  }

  const isMe = profile.email === myEmail

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <FlatList
        data={taglines}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            {profile.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{(profile.username ?? "?")[0].toUpperCase()}</Text>
              </View>
            )}

            <Text style={styles.usernameText}>@{profile.username}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{taglines.length}</Text>
                <Text style={styles.statLabel}>taglines</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{followersCount}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{followingCount}</Text>
                <Text style={styles.statLabel}>following</Text>
              </View>
            </View>

            {!isMe && (
              <Pressable
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </Pressable>
            )}

            <Text style={styles.sectionLabel}>Taglines</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <Pressable
              style={styles.gridPoster}
              onPress={() => router.push(`/movie/${item.tmdb_id}`)}
            >
              {item.poster_path ? (
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }}
                  style={{ width: "100%", height: "100%", borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : null}
            </Pressable>
            <Text style={styles.gridTaglineText} numberOfLines={2}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No taglines yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontSize: 15, color: Colors.text },
  notFound: { fontSize: 16, color: Colors.textMuted },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: Colors.card, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: Colors.textMuted },
  usernameText: { fontSize: 22, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  bio: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 24, marginVertical: 16 },
  stat: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  followBtn: {
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10,
    backgroundColor: Colors.text, alignItems: "center", marginBottom: 20,
    alignSelf: "flex-start",
  },
  followingBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: Colors.border },
  followBtnText: { fontSize: 14, fontWeight: "600", color: Colors.bg },
  followingBtnText: { color: Colors.text },
  sectionLabel: {
    fontSize: 13, fontWeight: "600", color: Colors.textMuted,
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12,
  },
  list: { paddingBottom: 24 },
  row: { paddingHorizontal: 12, gap: 8 },
  gridItem: { flex: 1, maxWidth: "50%", paddingHorizontal: 4 },
  gridPoster: { width: "100%", aspectRatio: 2 / 3, marginBottom: 4, borderRadius: 8, overflow: "hidden", backgroundColor: Colors.card },
  gridTaglineText: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  emptyWrap: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
})
