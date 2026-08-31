import { useState, useEffect } from "react"
import {
  View, Text, Image, FlatList, StyleSheet,
  ActivityIndicator, Pressable, SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { signOut } from "@/lib/auth"
import TaglineCard from "@/components/TaglineCard"
import { Colors } from "@/constants/Colors"

export default function MyProfileScreen() {
  const router = useRouter()
  const email = auth.currentUser?.email ?? ""
  const [profile, setProfile] = useState<any>(null)
  const [taglines, setTaglines] = useState<any[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [profileSnap, taglinesSnap, followersSnap, followingSnap] = await Promise.all([
        getDoc(doc(db, "profiles", email)),
        getDocs(query(collection(db, "taglines"), where("user_email", "==", email))),
        getDocs(query(collection(db, "follows"), where("following_email", "==", email))),
        getDocs(query(collection(db, "follows"), where("follower_email", "==", email))),
      ])
      setProfile(profileSnap.exists() ? profileSnap.data() : null)
      setTaglines(
        taglinesSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1))
      )
      setFollowersCount(followersSnap.size)
      setFollowingCount(followingSnap.size)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.text} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={taglines}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Avatar */}
            {profile?.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {(profile?.username ?? "?")[0].toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.username}>@{profile?.username ?? email.split("@")[0]}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

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

            <View style={styles.actionRow}>
              <Pressable style={styles.settingsBtn} onPress={() => router.push("/settings")}>
                <Text style={styles.settingsBtnText}>Settings</Text>
              </Pressable>
              <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
                <Text style={styles.signOutBtnText}>Sign out</Text>
              </Pressable>
            </View>

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
              ) : (
                <View style={styles.gridPosterPlaceholder} />
              )}
            </Pressable>
            <Text style={styles.gridTaglineText} numberOfLines={2}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No taglines yet. Go write one!</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: "center", alignItems: "center", flex: 1, paddingVertical: 40 },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: Colors.card, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: Colors.textMuted },
  username: { fontSize: 22, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  bio: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 24, marginVertical: 16 },
  stat: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  settingsBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  settingsBtnText: { fontSize: 14, fontWeight: "500", color: Colors.text },
  signOutBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  signOutBtnText: { fontSize: 14, fontWeight: "500", color: Colors.textMuted },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: Colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  list: { paddingBottom: 24 },
  row: { paddingHorizontal: 12, gap: 8 },
  gridItem: { flex: 1, maxWidth: "50%", paddingHorizontal: 4 },
  gridPoster: { width: "100%", aspectRatio: 2 / 3, marginBottom: 4, borderRadius: 8, overflow: "hidden", backgroundColor: Colors.card },
  gridPosterPlaceholder: { flex: 1, backgroundColor: Colors.border },
  gridTaglineText: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
})
