// Admin Service - API calls for admin operations
import api from './api'
import { ENDPOINTS } from '../config/api'

const adminService = {
  // Get dashboard stats
  async getDashboardStats() {
    try {
      const response = await api.get(ENDPOINTS.ADMIN.DASHBOARD_STATS)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get all alerts (admin view with more details)
  async getAllAlerts(params = {}) {
    try {
      const response = await api.get(ENDPOINTS.ADMIN.ALL_ALERTS, { params })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Update alert (admin)
  async updateAlert(id, alertData) {
    try {
      const response = await api.put(ENDPOINTS.ADMIN.UPDATE_ALERT(id), alertData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Delete alert (admin)
  async deleteAlert(id) {
    try {
      await api.delete(ENDPOINTS.ADMIN.DELETE_ALERT(id))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get all users
  async getAllUsers(params = {}) {
    try {
      const response = await api.get(ENDPOINTS.ADMIN.USERS, { params })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Ban user
  async banUser(userId, reason = '') {
    try {
      const response = await api.post(ENDPOINTS.ADMIN.BAN_USER(userId), { reason })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Warn user
  async warnUser(userId, reason = '') {
    try {
      const response = await api.post(ENDPOINTS.ADMIN.WARN_USER(userId), { reason })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get admin settings
  async getSettings() {
    try {
      const response = await api.get(ENDPOINTS.ADMIN.SETTINGS)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Update admin settings (TTL, etc.)
  async updateSettings(settings) {
    try {
      const response = await api.put(ENDPOINTS.ADMIN.SETTINGS, settings)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Export report
  async exportReport(format = 'csv', filters = {}) {
    try {
      const response = await api.get(`${ENDPOINTS.ADMIN.ALL_ALERTS}/export`, {
        params: { format, ...filters },
        responseType: 'blob'
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
}

export default adminService
