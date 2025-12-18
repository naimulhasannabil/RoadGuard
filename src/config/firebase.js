// Firebase Configuration for Google Authentication and Realtime Database
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase, ref, push, onChildAdded, query, orderByChild, startAt, serverTimestamp } from 'firebase/database'

// Firebase config - Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // Add this to your .env
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

// Initialize Firebase Realtime Database
export const database = getDatabase(app)

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Database references
export const alertsRef = ref(database, 'alerts')

// Helper functions for realtime alerts
export const pushAlert = (alertData) => {
  return push(alertsRef, {
    ...alertData,
    createdAt: serverTimestamp()
  })
}

export const subscribeToNewAlerts = (callback, sinceTimestamp) => {
  const alertsQuery = query(
    alertsRef,
    orderByChild('createdAt'),
    startAt(sinceTimestamp)
  )
  
  return onChildAdded(alertsQuery, (snapshot) => {
    const alert = { id: snapshot.key, ...snapshot.val() }
    callback(alert)
  })
}

export { ref, onChildAdded, query, orderByChild, startAt }

export default app
