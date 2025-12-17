// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    GOOGLE_LOGIN: '/auth/google',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
  },
  
  // Alerts
  ALERTS: {
    BASE: '/alerts',
    BY_ID: (id) => `/alerts/${id}`,
    NEARBY: '/alerts/nearby',
    MY_ALERTS: '/alerts/my-alerts',
    VERIFY: (id) => `/alerts/${id}/verify`,
    VOTE: (id) => `/alerts/${id}/vote`,
    REPORT: '/alerts/report',
  },
  
  // Comments
  COMMENTS: {
    BY_ALERT: (alertId) => `/alerts/${alertId}/comments`,
    BY_ID: (alertId, commentId) => `/alerts/${alertId}/comments/${commentId}`,
  },
  
  // Admin
  ADMIN: {
    DASHBOARD_STATS: '/admin/stats',
    ALL_ALERTS: '/admin/alerts',
    USERS: '/admin/users',
    BAN_USER: (id) => `/admin/users/${id}/ban`,
    WARN_USER: (id) => `/admin/users/${id}/warn`,
    DELETE_ALERT: (id) => `/admin/alerts/${id}`,
    UPDATE_ALERT: (id) => `/admin/alerts/${id}`,
    SETTINGS: '/admin/settings',
  },
  
  // Emergency
  EMERGENCY: {
    CONTACTS: '/emergency/contacts',
    REPORT: '/emergency/report',
    SERVICES: '/emergency/services',
  },
  
  // Geofence
  GEOFENCE: {
    BASE: '/geofence',
    CHECK: '/geofence/check',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    VOICE: '/upload/voice',
  },
}
