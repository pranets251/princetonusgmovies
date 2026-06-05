import { initializeApp, getApps, getApp } from "firebase/app"
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

function createAuth() {
  try {
    // Explicitly set resolver to bypass Firebase 12's FedCM auto-detection,
    // which causes immediate failures when Chrome has a personal account active.
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  } catch {
    // initializeAuth throws if auth was already initialized (e.g. HMR)
    return getAuth(app)
  }
}

export const auth = createAuth()
export const db = getFirestore(app)
