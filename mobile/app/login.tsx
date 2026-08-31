import { useEffect } from "react"
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native"
import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"
import { signInWithGoogleToken } from "@/lib/auth"
import { Colors } from "@/constants/Colors"
import { GOOGLE_WEB_CLIENT_ID } from "@/constants/config"

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  })

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params.id_token ?? (response.authentication?.idToken ?? "")
      if (idToken) {
        signInWithGoogleToken(idToken).catch((e) => alert(e.message))
      } else {
        alert("Sign-in failed: no ID token returned.")
      }
    }
  }, [response])

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Princeton{"\n"}USG Movies</Text>
        <Text style={styles.subtitle}>Sign in with your Princeton email to continue.</Text>

        <Pressable
          style={[styles.button, !request && styles.buttonDisabled]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          {!request ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </Pressable>

        <Text style={styles.note}>Only @princeton.edu accounts are permitted.</Text>
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
  inner: {
    width: "100%",
    maxWidth: 320,
    gap: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.bg,
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 12,
    color: Colors.textDim,
    textAlign: "center",
  },
})
