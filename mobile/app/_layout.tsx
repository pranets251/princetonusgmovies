import { useEffect, useState } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { onAuthStateChanged, User } from "firebase/auth"
import { useRouter, useSegments } from "expo-router"
import { View } from "react-native"
import { auth } from "@/lib/firebase"
import { getUserProfile } from "@/lib/auth"
import { Colors } from "@/constants/Colors"

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [hasUsername, setHasUsername] = useState<boolean | null>(null)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const profile = await getUserProfile(u.email!)
        setHasUsername(!!profile?.username)
      } else {
        setHasUsername(null)
      }
    })
  }, [])

  useEffect(() => {
    if (user === undefined) return

    const inTabs = segments[0] === "(tabs)"
    const inLogin = segments[0] === "login"
    const inUsernameSetup = segments[0] === "username-setup"

    if (!user) {
      if (!inLogin) router.replace("/login")
    } else if (hasUsername === false) {
      if (!inUsernameSetup) router.replace("/username-setup")
    } else if (hasUsername === true) {
      if (inLogin || inUsernameSetup) router.replace("/(tabs)/")
    }
  }, [user, hasUsername, segments])

  if (user === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="username-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="movie/[tmdb_id]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="tagline/create" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
