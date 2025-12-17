// Authentication Service - Google Auth with Firebase
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import api from './api'
import { ENDPOINTS } from '../config/api'

const authService = {
  // Google Sign In
  async signInWithGoogle() {
    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      // Get Firebase ID token
      const idToken = await user.getIdToken()
      
      // Create user data from Firebase response
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      }
      
      // Store user data locally (Firebase handles the session)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Try to sync with backend (optional - don't fail if backend is down)
      try {
        const response = await api.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, {
          idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
        })
        
        // If backend responds, store additional tokens
        if (response.data) {
          const { accessToken, refreshToken, user: backendUser } = response.data
          if (accessToken) localStorage.setItem('accessToken', accessToken)
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
          if (backendUser) localStorage.setItem('user', JSON.stringify(backendUser))
        }
      } catch (backendError) {
        // Backend not available - continue with Firebase auth only
        console.log('Backend sync skipped (not available):', backendError.message)
      }
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('Google Sign In Error:', error)
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign in cancelled' }
      }
      if (error.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Sign in cancelled' }
      }
      if (error.code === 'auth/user-cancelled') {
        return { success: false, error: 'Sign in cancelled' }
      }
      if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your connection.' }
      }
      
      return { 
        success: false, 
        error: error.message || 'Sign in failed' 
      }
    }
  },
  
  // Sign Out
  async signOut() {
    try {
      // Sign out from Firebase
      await signOut(auth)
      
      // Call backend logout (optional - invalidate refresh token)
      try {
        await api.post(ENDPOINTS.AUTH.LOGOUT)
      } catch (e) {
        // Ignore backend logout errors
      }
      
      // Clear local storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      return { success: true }
    } catch (error) {
      console.error('Sign Out Error:', error)
      // Clear storage anyway
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      return { success: true }
    }
  },
  
  // Get current user from storage
  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('accessToken')
  },
  
  // Get current user from backend
  async fetchCurrentUser() {
    try {
      const response = await api.get(ENDPOINTS.AUTH.ME)
      const user = response.data
      localStorage.setItem('user', JSON.stringify(user))
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // Get access token
  getAccessToken() {
    return localStorage.getItem('accessToken')
  },
}

export default authService
