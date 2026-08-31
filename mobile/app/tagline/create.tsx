import { useState, useEffect, useRef } from "react"
import {
  View, Text, TextInput, Image, StyleSheet, Pressable,
  ActivityIndicator, SafeAreaView, Alert, Dimensions,
  KeyboardAvoidingView, Platform,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { api } from "@/lib/api"
import { Colors } from "@/constants/Colors"

const FONT = "Cormorant Garamond"
const DEFAULT_BWF = 0.3
const DEFAULT_BHF = 0.15

const TEXT_COLORS = ["#ffffff", "#f5b800", "#ff4040", "#40ff8f", "#40b0ff", "#000000"]

type Step = "place" | "write"

export default function TaglineCreateScreen() {
  const { tmdb_id } = useLocalSearchParams<{ tmdb_id: string }>()
  const router = useRouter()
  const email = auth.currentUser?.email ?? ""

  const [board, setBoard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>("place")
  const [boxX, setBoxX] = useState(0.35)
  const [boxY, setBoxY] = useState(0.35)
  const [text, setText] = useState("")
  const [color, setColor] = useState("#ffffff")
  const [submitting, setSubmitting] = useState(false)
  const posterRef = useRef<View>(null)
  const [posterDims, setPosterDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    getDoc(doc(db, "tagline_boards", tmdb_id)).then(snap => {
      if (snap.exists()) setBoard(snap.data())
      setLoading(false)
    })
  }, [tmdb_id])

  function handlePosterPress(evt: { nativeEvent: { locationX: number; locationY: number } }) {
    if (posterDims.w === 0 || posterDims.h === 0) return
    const tx = evt.nativeEvent.locationX / posterDims.w
    const ty = evt.nativeEvent.locationY / posterDims.h
    setBoxX(Math.max(0, Math.min(1 - DEFAULT_BWF, tx - DEFAULT_BWF / 2)))
    setBoxY(Math.max(0, Math.min(1 - DEFAULT_BHF, ty - DEFAULT_BHF / 2)))
    setStep("write")
  }

  async function handlePost() {
    if (!text.trim()) { Alert.alert("Write something first!"); return }
    setSubmitting(true)
    try {
      await api.post("/api/taglines", {
        tmdb_id: Number(tmdb_id),
        movie_title: board?.movie_title ?? "",
        poster_path: board?.poster_path ?? null,
        x: boxX, y: boxY,
        bwf: DEFAULT_BWF, bhf: DEFAULT_BHF,
        text: text.trim(),
        html: "",
        font: FONT,
        color,
        fontSize: 0.04,
        creationBoxW: null,
      })
      router.back()
    } catch (e: any) {
      Alert.alert("Error", "Failed to post tagline. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.text} />
      </SafeAreaView>
    )
  }

  const posterPath = board?.poster_path
  const posterUri = posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : null

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => (step === "write" ? setStep("place") : router.back())}>
            <Text style={styles.backText}>{step === "write" ? "← Replace" : "← Cancel"}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {step === "place" ? "Tap where to place your tagline" : "Write your tagline"}
          </Text>
          {step === "write" && (
            <Pressable onPress={handlePost} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color={Colors.text} />
                : <Text style={styles.postBtn}>Post</Text>
              }
            </Pressable>
          )}
        </View>

        {/* Poster with placement overlay */}
        <Pressable
          ref={posterRef}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout
            setPosterDims({ w: width, h: height })
          }}
          onPress={handlePosterPress}
          style={styles.posterWrap}
        >
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, { backgroundColor: Colors.card }]} />
          )}

          {/* Box preview */}
          <View
            pointerEvents="none"
            style={[
              styles.boxOverlay,
              {
                left: `${boxX * 100}%` as any,
                top: `${boxY * 100}%` as any,
                width: `${DEFAULT_BWF * 100}%` as any,
                height: `${DEFAULT_BHF * 100}%` as any,
              },
            ]}
          >
            {step === "write" && (
              <Text
                style={[styles.overlayText, { color }]}
                numberOfLines={3}
                adjustsFontSizeToFit
              >
                {text || "Your tagline…"}
              </Text>
            )}
          </View>

          {step === "place" && (
            <View pointerEvents="none" style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to place</Text>
            </View>
          )}
        </Pressable>

        {/* Write step controls */}
        {step === "write" && (
          <View style={styles.writePanel}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Your tagline…"
              placeholderTextColor={Colors.textDim}
              multiline
              autoFocus
              maxLength={200}
            />
            <View style={styles.colorRow}>
              {TEXT_COLORS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c, borderColor: c === "#000000" ? "#555" : c },
                    color === c && styles.colorDotSelected,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backText: { fontSize: 15, color: Colors.text },
  headerTitle: { flex: 1, fontSize: 13, color: Colors.textMuted, textAlign: "center", paddingHorizontal: 8 },
  postBtn: { fontSize: 16, fontWeight: "700", color: Colors.text },
  posterWrap: {
    flex: 1,
    position: "relative",
    backgroundColor: Colors.card,
  },
  poster: { width: "100%", height: "100%" },
  boxOverlay: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  overlayText: {
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tapHint: {
    position: "absolute",
    bottom: 20,
    left: 0, right: 0,
    alignItems: "center",
  },
  tapHintText: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  writePanel: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  colorRow: { flexDirection: "row", gap: 10 },
  colorDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
  },
  colorDotSelected: {
    transform: [{ scale: 1.25 }],
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
})
