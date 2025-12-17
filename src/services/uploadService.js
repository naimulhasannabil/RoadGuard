// Upload Service - File upload handling
import api from './api'
import { ENDPOINTS } from '../config/api'

const uploadService = {
  // Upload single image
  async uploadImage(file) {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await api.post(ENDPOINTS.UPLOAD.IMAGE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Upload multiple images
  async uploadImages(files) {
    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append('images', file)
      })
      
      const response = await api.post(ENDPOINTS.UPLOAD.IMAGE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Upload voice note
  async uploadVoice(file) {
    try {
      const formData = new FormData()
      formData.append('voice', file)
      
      const response = await api.post(ENDPOINTS.UPLOAD.VOICE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },
  
  // Convert blob to file
  blobToFile(blob, filename) {
    return new File([blob], filename, { type: blob.type })
  },
}

export default uploadService
