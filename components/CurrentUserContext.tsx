"use client"

import { createContext, useContext } from "react"

const CurrentUserContext = createContext<string | null>(null)

export function CurrentUserProvider({ username, children }: { username: string; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={username}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUsername() {
  return useContext(CurrentUserContext)
}
