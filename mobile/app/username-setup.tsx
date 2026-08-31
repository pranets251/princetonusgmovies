import { useState } from "react"
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native"
import { auth } from "@/lib/firebase"
import { createProfile } from "@/lib/auth"
import { Colors } from "@/constants/Colors"

export default function UsernameSetupScreen() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const email = auth.currentUser?.email ?? ""
  const defaultUsername = email.split("@")[0]

  async function handleSubmit() {
    const val = username.trim() || defaultUsername
    if (!val) return
    setLoading(true)
    setError("")
    try {
      await createProfile(email, val)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Choose a username</Text>
        <Text style={styles.subtitle}>
          This is how other Princeton students will see you.
        </Text>

        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder={defaultUsername}
          placeholderTextColor={Colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Get started</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  inner: { width: "100%", maxWidth: 320, gap: 20 },
  title: { fontSize: 28, fontWeight: "700", color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textMuted, lineHeight: 22 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  error: { fontSize: 13, color: Colors.red },
  button: {
    backgroundColor: Colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: Colors.bg, fontSize: 16, fontWeight: "600" },
})
