import { View, Text, Image, StyleSheet, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Colors } from "@/constants/Colors"

const TMDB_IMG = "https://image.tmdb.org/t/p/w780"

interface Tagline {
  id: string
  tmdb_id: number
  movie_title: string
  poster_path: string
  username: string
  text: string
  color?: string
  font?: string
  x: number
  y: number
  bwf: number
  bhf: number
  fontSize?: number
  endorse_count?: number
  tagline_number?: number
  created_at: string
}

interface Props {
  tagline: Tagline
  onEndorse?: () => void
  endorsed?: boolean
}

export default function TaglineCard({ tagline, onEndorse, endorsed }: Props) {
  const router = useRouter()

  return (
    <View style={styles.card}>
      {/* Poster with tagline overlay */}
      <Pressable
        onPress={() => router.push(`/movie/${tagline.tmdb_id}`)}
        style={styles.posterWrap}
      >
        <Image
          source={{ uri: `${TMDB_IMG}${tagline.poster_path}` }}
          style={styles.poster}
          resizeMode="cover"
        />
        {/* Dark scrim */}
        <View style={styles.scrim} />
        {/* Tagline text at the correct relative position */}
        <View
          style={[
            styles.taglineBox,
            {
              left: `${tagline.x * 100}%` as any,
              top: `${tagline.y * 100}%` as any,
              width: `${tagline.bwf * 100}%` as any,
              height: `${tagline.bhf * 100}%` as any,
            },
          ]}
        >
          <Text
            style={[styles.taglineText, { color: tagline.color ?? "#ffffff" }]}
            numberOfLines={4}
            adjustsFontSizeToFit
          >
            {tagline.text}
          </Text>
        </View>
      </Pressable>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Pressable onPress={() => router.push(`/profile/${tagline.username}`)}>
            <Text style={styles.username}>@{tagline.username}</Text>
          </Pressable>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {tagline.movie_title}
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Pressable onPress={onEndorse} style={styles.endorseBtn}>
            <Text style={[styles.endorseIcon, endorsed && styles.endorseIconActive]}>
              {endorsed ? "★" : "☆"}
            </Text>
            <Text style={[styles.endorseCount, endorsed && styles.endorseCountActive]}>
              {tagline.endorse_count ?? 0}
            </Text>
          </Pressable>
          {tagline.tagline_number != null && (
            <Text style={styles.taglineNum}>#{tagline.tagline_number}</Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
  },
  posterWrap: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  taglineBox: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 10,
    paddingHorizontal: 2,
  },
  footerLeft: { flex: 1, gap: 2 },
  username: { fontSize: 13, fontWeight: "600", color: Colors.text },
  movieTitle: { fontSize: 12, color: Colors.textMuted },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  endorseBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  endorseIcon: { fontSize: 18, color: Colors.textMuted },
  endorseIconActive: { color: "#f5b800" },
  endorseCount: { fontSize: 13, color: Colors.textMuted },
  endorseCountActive: { color: "#f5b800" },
  taglineNum: { fontSize: 12, color: Colors.textDim },
})
