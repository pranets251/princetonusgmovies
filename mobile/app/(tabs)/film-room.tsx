import { useState, useEffect } from "react"
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Pressable, Image, SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import { api } from "@/lib/api"
import { Colors } from "@/constants/Colors"

const TMDB_IMG = "https://image.tmdb.org/t/p/w342"
type Period = "week" | "month" | "year" | "all"

export default function FilmRoomScreen() {
  const [period, setPeriod] = useState<Period>("week")
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function load(p: Period) {
    setLoading(true)
    try {
      const data = await api.get(`/api/leaderboard?period=${p}&limit=25`)
      setMovies(data.movies ?? [])
    } catch {
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(period) }, [period])

  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "all", label: "All time" },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Film Room</Text>

      {/* Period filter */}
      <View style={styles.filterRow}>
        {periods.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.filterBtn, period === key && styles.filterBtnActive]}
            onPress={() => { setPeriod(key); setMovies([]) }}
          >
            <Text style={[styles.filterText, period === key && styles.filterTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.text} />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={item => String(item.tmdb_id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/movie/${item.tmdb_id}`)}
            >
              <Text style={styles.rank}>#{item.rank}</Text>
              {item.poster_path ? (
                <Image
                  source={{ uri: `${TMDB_IMG}${item.poster_path}` }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.poster, styles.posterPlaceholder]} />
              )}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {item.year ? <Text style={styles.year}>{item.year}</Text> : null}
                <Text style={styles.meta}>
                  {item.endorse_count} endorse{item.endorse_count !== 1 ? "s" : ""} · {item.taglines?.length ?? 0} tagline{item.taglines?.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No movies ranked yet for this period.</Text>
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
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  filterText: { fontSize: 13, color: Colors.textMuted },
  filterTextActive: { color: Colors.bg, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.card, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  rank: { fontSize: 18, fontWeight: "700", color: Colors.textDim, width: 32, textAlign: "center" },
  poster: { width: 48, height: 72, borderRadius: 6 },
  posterPlaceholder: { backgroundColor: Colors.border },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: "600", color: Colors.text },
  year: { fontSize: 12, color: Colors.textMuted },
  meta: { fontSize: 12, color: Colors.textDim },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
})
