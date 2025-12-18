import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAlerts, haversineMeters } from './AlertsContext'
import { useNotifications } from './NotificationContext'

const GeoFenceContext = createContext(null)

// Default geo-fence settings
const DEFAULT_SETTINGS = {
  enabled: true,
  alertRadius: 500, // meters - radius to trigger "approaching hazard" warning
  dangerRadius: 100, // meters - radius to trigger "danger zone" warning
  updateInterval: 5000, // ms - how often to check location
}

// Alias for backwards compatibility - reuse from AlertsContext (no code duplication)
const calculateDistance = haversineMeters

export function GeoFenceProvider({ children }) {
  const { alerts } = useAlerts()
  const { showToast, notifyNewHazard, soundEnabled } = useNotifications()
  
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [userLocation, setUserLocation] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [nearbyAlerts, setNearbyAlerts] = useState([]) // Alerts within alertRadius
  const [dangerZoneAlerts, setDangerZoneAlerts] = useState([]) // Alerts within dangerRadius
  
  // Track which alerts user has been notified about (to avoid repeat notifications)
  const notifiedAlerts = useRef(new Set())
  const dangerNotifiedAlerts = useRef(new Set())
  const watchIdRef = useRef(null)

  // Start tracking user location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error')
      return false
    }

    if (watchIdRef.current !== null) {
      return true // Already tracking
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now()
        })
        setIsTracking(true)
      },
      (error) => {
        // Handle permission denied silently (user already sees UI feedback)
        if (error.code === error.PERMISSION_DENIED) {
          setIsTracking(false)
          // Don't show toast - MapPage shows a banner instead
        }
        // Silently handle other errors (timeout, unavailable) - watchPosition will retry
      },
      {
        enableHighAccuracy: false, // Use low accuracy for faster response
        timeout: 15000,            // Longer timeout
        maximumAge: 60000          // Accept cached positions up to 1 minute old
      }
    )

    return true
  }, [showToast])

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setIsTracking(false)
    }
  }, [])

  // Check if user is near any alerts (geo-fence check)
  useEffect(() => {
    if (!settings.enabled || !userLocation || !alerts.length) {
      setNearbyAlerts([])
      setDangerZoneAlerts([])
      return
    }

    const nearby = []
    const danger = []

    alerts.forEach((alert) => {
      if (!alert.lat || !alert.lng || alert.expired) return

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        alert.lat,
        alert.lng
      )

      // Check danger zone (closer)
      if (distance <= settings.dangerRadius) {
        danger.push({ ...alert, distance })

        // Trigger danger notification (if not already notified)
        if (!dangerNotifiedAlerts.current.has(alert.id)) {
          dangerNotifiedAlerts.current.add(alert.id)
          
          showToast(
            `⚠️ DANGER! You are ${Math.round(distance)}m from a ${alert.type} hazard!`,
            'error',
            10000
          )
          
          // Play alert sound via browser notification
          if (Notification.permission === 'granted') {
            new Notification(`🚨 DANGER ZONE: ${alert.type}`, {
              body: `You are only ${Math.round(distance)} meters away! ${alert.description || 'Proceed with caution.'}`,
              icon: '/favicon.ico',
              tag: `danger-${alert.id}`,
              requireInteraction: true,
              silent: false
            })
          }
        }
      }
      // Check alert zone (approaching)
      else if (distance <= settings.alertRadius) {
        nearby.push({ ...alert, distance })

        // Trigger approach notification (if not already notified)
        if (!notifiedAlerts.current.has(alert.id)) {
          notifiedAlerts.current.add(alert.id)
          
          showToast(
            `📍 ${alert.type} hazard ahead! (${Math.round(distance)}m away)`,
            'warning',
            8000
          )
          
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(`⚠️ Hazard Ahead: ${alert.type}`, {
              body: `${Math.round(distance)}m away - ${alert.severity} severity. ${alert.description || ''}`,
              icon: '/favicon.ico',
              tag: `nearby-${alert.id}`,
              silent: false
            })
          }
        }
      }
    })

    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance)
    danger.sort((a, b) => a.distance - b.distance)

    setNearbyAlerts(nearby)
    setDangerZoneAlerts(danger)
  }, [userLocation, alerts, settings, showToast])

  // Auto-start tracking when enabled
  useEffect(() => {
    if (settings.enabled) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => stopTracking()
  }, [settings.enabled, startTracking, stopTracking])

  // Clear notified alerts when they expire or are removed
  useEffect(() => {
    const currentAlertIds = new Set(alerts.map(a => a.id))
    
    notifiedAlerts.current.forEach(id => {
      if (!currentAlertIds.has(id)) {
        notifiedAlerts.current.delete(id)
      }
    })
    
    dangerNotifiedAlerts.current.forEach(id => {
      if (!currentAlertIds.has(id)) {
        dangerNotifiedAlerts.current.delete(id)
      }
    })
  }, [alerts])

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Reset notifications for an alert (useful if user leaves and re-enters)
  const resetAlertNotification = useCallback((alertId) => {
    notifiedAlerts.current.delete(alertId)
    dangerNotifiedAlerts.current.delete(alertId)
  }, [])

  // Reset all notifications
  const resetAllNotifications = useCallback(() => {
    notifiedAlerts.current.clear()
    dangerNotifiedAlerts.current.clear()
  }, [])

  // Get distance to a specific alert
  const getDistanceToAlert = useCallback((alert) => {
    if (!userLocation || !alert.lat || !alert.lng) return null
    return calculateDistance(userLocation.lat, userLocation.lng, alert.lat, alert.lng)
  }, [userLocation])

  const value = {
    // State
    settings,
    userLocation,
    isTracking,
    nearbyAlerts,
    dangerZoneAlerts,
    
    // Actions
    startTracking,
    stopTracking,
    updateSettings,
    resetAlertNotification,
    resetAllNotifications,
    getDistanceToAlert,
    
    // Utility
    calculateDistance
  }

  return (
    <GeoFenceContext.Provider value={value}>
      {children}
    </GeoFenceContext.Provider>
  )
}

export const useGeoFence = () => {
  const context = useContext(GeoFenceContext)
  if (!context) {
    throw new Error('useGeoFence must be used within GeoFenceProvider')
  }
  return context
}