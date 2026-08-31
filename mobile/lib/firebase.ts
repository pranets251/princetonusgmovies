import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCk2Y-lMeXfJhtc69hlH8tsJ28lUyyJsjg",
  authDomain: "princeton-usg-movies.firebaseapp.com",
  projectId: "princeton-usg-movies",
  storageBucket: "princeton-usg-movies.firebasestorage.app",
  messagingSenderId: "664413054268",
  appId: "1:664413054268:web:006a5eb66396c0b2ccea39",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
