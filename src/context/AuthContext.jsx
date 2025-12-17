// Auth Context - Global authentication state management
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        // Create user object from Firebase data
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        }
        
        // Check if we have additional user data in localStorage (from backend)
        const storedUser = authService.getCurrentUser()
        if (storedUser && storedUser.uid === firebaseUser.uid) {
          // Merge stored data with Firebase data
          setUser({ ...userData, ...storedUser })
        } else {
          setUser(userData)
          // Store user data
          localStorage.setItem('user', JSON.stringify(userData))
        }
        setIsAuthenticated(true)
      } else {
        // User is signed out
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem('user')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true)
    const result = await authService.signInWithGoogle()
    if (result.success) {
      setUser(result.user)
      setIsAuthenticated(true)
    }
    setLoading(false)
    return result
  }

  // Sign out
  const signOut = async () => {
    setLoading(true)
    const result = await authService.signOut()
    if (result.success) {
      setUser(null)
      setIsAuthenticated(false)
    }
    setLoading(false)
    return result
  }

  // Refresh user data
  const refreshUser = async () => {
    const result = await authService.fetchCurrentUser()
    if (result.success) {
      setUser(result.user)
    }
    return result
  }

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    signInWithGoogle,
    signOut,
    refreshUser,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
