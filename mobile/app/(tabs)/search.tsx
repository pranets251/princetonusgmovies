import { useState, useEffect, useRef } from "react"
import {
  View, Text, TextInput, FlatList, StyleSheet,
  ActivityIndicator, Pressable, Image, SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { api } from "@/lib/api"
import { Colors } from "@/constants/Colors"

const TMDB_IMG = "https://image.tmdb.org/t/p/w342"

export default function SearchScreen() {
  const [q, setQ] = useState("")
  const [movies, setMovies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [browseMovies, setBrowseMovies] = useState<any[]>([])
  const router = useRouter()
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Preload browseable movies (all tagline boards)
  useEffect(() => {
    getDocs(query(collection(db, "tagline_boards"), limit(100))).then(snap => {
      setBrowseMovies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (!q.trim()) { setMovies([]); setUsers([]); return }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(q.trim())}`)
        setMovies(data.movies ?? [])
        setUsers(data.users ?? [])
      } catch {
        setMovies([]); setUsers([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [q])

  const showing = q.trim() ? [...users.map(u => ({ _type: "user", ...u })), ...movies.map(m => ({ _type: "movie", ...m }))] : browseMovies.map(m => ({ _type: "movie", ...m }))

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Search</Text>

      <View style={styles.inputWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.input}
          value={q}
          onChangeText={setQ}
          placeholder="Movies, users…"
          placeholderTextColor={Colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.text} />
        </View>
      ) : (
        <FlatList
          data={showing}
          keyExtractor={(item, i) => `${item._type}_${item.username ?? item.tmdb_id ?? i}`}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            if (item._type === "user") {
              return (
                <Pressable
                  style={[styles.movieCard, styles.userCard]}
                  onPress={() => router.push(`/profile/${item.username}`)}
                >
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>{(item.username ?? "?")[0].toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.movieTitle} numberOfLines={1}>@{item.username}</Text>
                </Pressable>
              )
            }
            return (
              <Pressable
                style={styles.movieCard}
                onPress={() => router.push(`/movie/${item.tmdb_id}`)}
              >
                {item.poster_path ? (
                  <Image
                    source={{ uri: `${TMDB_IMG}${item.poster_path}` }}
                    style={styles.poster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.poster, styles.posterPlaceholder]}>
                    <Text style={styles.posterPlaceholderText}>{item.movie_title?.[0]}</Text>
                  </View>
                )}
                <Text style={styles.movieTitle} numberOfLines={2}>{item.movie_title}</Text>
              </Pressable>
            )
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{q ? "No results." : "No movies with taglines yet."}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heading: {
    fontSize: 28, fontWeight: "700", color: Colors.text,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, letterSpacing: -0.5,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  searchIcon: { fontSize: 18, color: Colors.textDim },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  clearBtn: { fontSize: 14, color: Colors.textMuted, padding: 2 },
  grid: { padding: 12 },
  row: { gap: 8 },
  movieCard: {
    flex: 1, gap: 6, marginBottom: 16,
    maxWidth: "50%",
  },
  userCard: { alignItems: "center" },
  poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 8, backgroundColor: Colors.card },
  posterPlaceholder: { justifyContent: "center", alignItems: "center" },
  posterPlaceholderText: { fontSize: 24, color: Colors.textDim },
  movieTitle: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.card },
  avatarPlaceholder: { justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 24, fontWeight: "700", color: Colors.textMuted },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
})
