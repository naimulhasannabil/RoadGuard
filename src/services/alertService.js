// Alert Service - API calls for alerts
import api from './api'
import { ENDPOINTS } from '../config/api'

const alertService = {
  // Get all alerts
  async getAllAlerts(params = {}) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.BASE, { params })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get nearby alerts
  async getNearbyAlerts(lat, lng, radius = 5000) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.NEARBY, {
        params: { lat, lng, radius }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get alert by ID
  async getAlertById(id) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.BY_ID(id))
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Create new alert
  async createAlert(alertData) {
    try {
      const response = await api.post(ENDPOINTS.ALERTS.BASE, alertData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Create alert with files (photos, voice)
  async createAlertWithFiles(alertData, photos = [], voiceNote = null) {
    try {
      const formData = new FormData()
      
      // Add alert data
      Object.keys(alertData).forEach(key => {
        if (alertData[key] !== undefined && alertData[key] !== null) {
          formData.append(key, alertData[key])
        }
      })
      
      // Add photos
      photos.forEach((photo, index) => {
        if (photo instanceof File || photo instanceof Blob) {
          formData.append('photos', photo, `photo_${index}.jpg`)
        }
      })
      
      // Add voice note
      if (voiceNote instanceof File || voiceNote instanceof Blob) {
        formData.append('voiceNote', voiceNote, 'voice.webm')
      }
      
      const response = await api.post(ENDPOINTS.ALERTS.BASE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Update alert
  async updateAlert(id, alertData) {
    try {
      const response = await api.put(ENDPOINTS.ALERTS.BY_ID(id), alertData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Delete alert
  async deleteAlert(id) {
    try {
      await api.delete(ENDPOINTS.ALERTS.BY_ID(id))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Vote on alert (upvote/downvote)
  async voteAlert(id, voteType) {
    try {
      const response = await api.post(ENDPOINTS.ALERTS.VOTE(id), { voteType })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Verify alert (admin)
  async verifyAlert(id, verified = true) {
    try {
      const response = await api.post(ENDPOINTS.ALERTS.VERIFY(id), { verified })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get my alerts
  async getMyAlerts() {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.MY_ALERTS)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get comments for alert
  async getComments(alertId) {
    try {
      const response = await api.get(ENDPOINTS.COMMENTS.BY_ALERT(alertId))
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Add comment to alert
  async addComment(alertId, text) {
    try {
      const response = await api.post(ENDPOINTS.COMMENTS.BY_ALERT(alertId), { text })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Delete comment
  async deleteComment(alertId, commentId) {
    try {
      await api.delete(ENDPOINTS.COMMENTS.BY_ID(alertId, commentId))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
}

export default alertService
