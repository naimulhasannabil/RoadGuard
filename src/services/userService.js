// User Service - API calls for user management
import api from './api'
import { ENDPOINTS } from '../config/api'

const userService = {
  // Get user profile
  async getProfile() {
    try {
      const response = await api.get(ENDPOINTS.USERS.PROFILE)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put(ENDPOINTS.USERS.UPDATE_PROFILE, profileData)
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...currentUser, ...response.data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Update user preferences (notifications, radius, etc.)
  async updatePreferences(preferences) {
    try {
      const response = await api.put(ENDPOINTS.USERS.PREFERENCES, preferences)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get user by ID
  async getUserById(id) {
    try {
      const response = await api.get(ENDPOINTS.USERS.BY_ID(id))
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Upload profile photo
  async uploadProfilePhoto(file) {
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      const response = await api.post(ENDPOINTS.UPLOAD.IMAGE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
}

export default userService
