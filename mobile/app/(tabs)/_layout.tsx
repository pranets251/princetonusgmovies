import { Tabs } from "expo-router"
import { StyleSheet, View } from "react-native"
import { Colors } from "@/constants/Colors"

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconFocused]}>
      {children}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              {/* Home icon */}
              <View style={[styles.dot, { backgroundColor: color }]} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="film-room"
        options={{
          title: "Film Room",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <View style={[styles.dot, { backgroundColor: color }]} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <View style={[styles.dot, { backgroundColor: color }]} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <View style={[styles.dot, { backgroundColor: color }]} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconFocused: {
    backgroundColor: Colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
