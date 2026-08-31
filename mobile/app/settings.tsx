import { useState, useEffect } from "react"
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, SafeAreaView, Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Colors } from "@/constants/Colors"

export default function SettingsScreen() {
  const router = useRouter()
  const email = auth.currentUser?.email ?? ""
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDoc(doc(db, "profiles", email)).then(snap => {
      if (snap.exists()) setBio(snap.data().bio ?? "")
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, "profiles", email), { bio })
      Alert.alert("Saved", "Profile updated.")
      router.back()
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.text} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.inner}>
        <Text style={styles.heading}>Settings</Text>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about yourself…"
          placeholderTextColor={Colors.textDim}
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={styles.charCount}>{bio.length}/200</Text>

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.bg} /> : (
            <Text style={styles.saveBtnText}>Save changes</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: "center", alignItems: "center" },
  backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontSize: 15, color: Colors.text },
  inner: { padding: 20, gap: 12 },
  heading: { fontSize: 28, fontWeight: "700", color: Colors.text, letterSpacing: -0.5, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textMuted, letterSpacing: 0.3, textTransform: "uppercase" },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text, textAlignVertical: "top", minHeight: 100,
  },
  charCount: { fontSize: 12, color: Colors.textDim, textAlign: "right" },
  saveBtn: {
    backgroundColor: Colors.text, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { color: Colors.bg, fontSize: 16, fontWeight: "600" },
})
