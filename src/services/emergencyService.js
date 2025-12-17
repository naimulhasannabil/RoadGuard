// Emergency Service - API calls for emergency features
import api from './api'
import { ENDPOINTS } from '../config/api'

const emergencyService = {
  // Get emergency contacts
  async getEmergencyContacts() {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY.CONTACTS)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Get nearby emergency services (hospitals, police stations, fire stations)
  async getNearbyServices(lat, lng, type = 'all') {
    try {
      const response = await api.get(ENDPOINTS.EMERGENCY.SERVICES, {
        params: { lat, lng, type }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Report emergency
  async reportEmergency(emergencyData) {
    try {
      const response = await api.post(ENDPOINTS.EMERGENCY.REPORT, emergencyData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
}

export default emergencyService
