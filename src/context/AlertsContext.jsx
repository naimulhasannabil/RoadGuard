import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { broadcastAlert, addAlertListener } from '../utils/alertBroadcast'
import alertService from '../services/alertService'

const AlertsContext = createContext(null)

// Backend connection status
const API_ENABLED = import.meta.env.VITE_API_ENABLED === 'true'

const DEFAULT_TTL_MINUTES = {
  Low: 30,
  Medium: 60,
  High: 120,
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null) // { lat, lng }
  const [nearbyRadiusMeters, setNearbyRadiusMeters] = useState(500)
  const [severityTtl, setSeverityTtl] = useState(DEFAULT_TTL_MINUTES)
  const lastAlertId = useRef(0)
  
  // Track locally created alert timestamps to avoid showing notifications for own alerts
  const localAlertTimestamps = useRef(new Set())
  
  // Callback to notify about new alerts (set by App component)
  const onNewAlertRef = useRef(null)
  
  // Store comments by alert ID - persists across page navigation
  const [alertComments, setAlertComments] = useState({})

  // Fetch alerts from PostgreSQL backend on mount
  const fetchAlerts = useCallback(async () => {
    if (!API_ENABLED) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await alertService.getAllAlerts()
      if (result.success && result.data) {
        // Merge with existing alerts, avoiding duplicates
        setAlerts(prev => {
          const existingIds = new Set(prev.map(a => a.id))
          const newAlerts = (result.data.alerts || result.data || [])
            .filter(a => !existingIds.has(a.id))
          return [...newAlerts, ...prev]
        })
      } else {
        console.warn('Failed to fetch alerts:', result.error)
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch nearby alerts based on user location
  const fetchNearbyAlerts = useCallback(async (lat, lng, radius = 5000) => {
    if (!API_ENABLED) return
    
    try {
      const result = await alertService.getNearbyAlerts(lat, lng, radius)
      if (result.success && result.data) {
        setAlerts(prev => {
          const existingIds = new Set(prev.map(a => a.id))
          const newAlerts = (result.data.alerts || result.data || [])
            .filter(a => !existingIds.has(a.id))
          return [...newAlerts, ...prev]
        })
      }
    } catch (err) {
      console.error('Error fetching nearby alerts:', err)
    }
  }, [])

  // Load alerts from backend on mount
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])
  
  const getCommentsForAlert = useCallback((alertId) => {
    return alertComments[alertId] || []
  }, [alertComments])
  
  // Add comment to alert - saves to backend when enabled
  const addCommentToAlert = useCallback(async (alertId, comment) => {
    // Add to local state immediately (optimistic update)
    setAlertComments(prev => {
      const existingComments = prev[alertId] || []
      return {
        ...prev,
        [alertId]: [comment, ...existingComments]
      }
    })
    
    // Save to backend when enabled
    if (API_ENABLED) {
      try {
        await alertService.addComment(alertId, comment.text)
      } catch (err) {
        console.error('Failed to save comment to backend:', err)
      }
    }
  }, [])

  // Fetch comments for an alert from backend
  const fetchCommentsForAlert = useCallback(async (alertId) => {
    if (!API_ENABLED) return
    
    try {
      const result = await alertService.getComments(alertId)
      if (result.success && result.data) {
        setAlertComments(prev => ({
          ...prev,
          [alertId]: result.data.comments || result.data || []
        }))
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    }
  }, [])

  // Listen for alerts from other users via Firebase (real-time notifications)
  useEffect(() => {
    const handleAlert = async (data) => {
      const { type, alert } = data
      
      if (type === 'NEW_ALERT' && alert) {
        // Check if this is our own alert by matching createdAt timestamp
        const alertCreatedAt = alert.createdAt || 0
        const isOwnAlert = localAlertTimestamps.current.has(alertCreatedAt)
        
        if (isOwnAlert) {
          // Own alert - already added locally, just update firebaseKey
          setAlerts((prev) => {
            return prev.map(a => 
              a.createdAt === alertCreatedAt 
                ? { ...a, firebaseKey: alert.firebaseKey, backendId: alert.backendId }
                : a
            )
          })
          return
        }
        
        // Alert from another user
        let fullAlert = alert
        
        // If backend is enabled, fetch full alert details (with photos, voice, etc.)
        if (API_ENABLED && alert.backendId) {
          try {
            const result = await alertService.getAlertById(alert.backendId)
            if (result.success && result.data) {
              fullAlert = { ...alert, ...result.data }
            }
          } catch (err) {
            console.error('Failed to fetch full alert details:', err)
          }
        }
        
        // Add to list
        setAlerts((prev) => {
          if (prev.some(a => a.id === alert.id || a.firebaseKey === alert.firebaseKey || a.createdAt === alert.createdAt)) return prev
          return [fullAlert, ...prev]
        })
        
        // Trigger notification for alerts from OTHER users only
        window.dispatchEvent(new CustomEvent('roadguard-remote-alert', { detail: fullAlert }))
      }
    }
    
    return addAlertListener(handleAlert)
  }, [])

  // Auto-expire and verify alerts based on TTL and votes
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) => {
        const now = Date.now()
        return prev.map((a) => {
          const ttlMinutes = severityTtl[a.severity] ?? 60
          const expiresAt = new Date(a.timestamp).getTime() + ttlMinutes * 60_000
          const expired = expiresAt <= now
          // Don't override manually verified alerts
          if (a.manuallyVerified) {
            return { ...a, expired }
          }
          const score = (a.votesUp || 0) - (a.votesDown || 0)
          const verified = score >= 3
          return { ...a, verified, expired }
        })
      })
    }, 30_000)
    return () => clearInterval(interval)
  }, [severityTtl])

  // Request notification permission on mount
  const requestNotifyPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission() } catch {}
    }
  }

  useEffect(() => {
    requestNotifyPermission()
  }, [])

  // Show browser notification if alert is nearby
  const notifyIfNearby = (alert) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!userLocation) return
    const d = haversineMeters(userLocation.lat, userLocation.lng, alert.lat, alert.lng)
    if (d <= nearbyRadiusMeters) {
      new Notification('Nearby Hazard', {
        body: `${alert.type} (${alert.severity}) at ${d.toFixed(0)}m`,
        icon: '/favicon.ico',
      })
    }
  }

  const addAlert = async ({ type, severity, description, photos, lat, lng, contributor = 'You', voiceNote = null, alternateRoutes = [] }) => {
    const id = ++lastAlertId.current
    const createdAt = Date.now()
    
    // Create local blob URLs for immediate display
    const photoObjs = (photos || []).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    
    let voiceNoteUrl = null
    if (voiceNote && voiceNote instanceof Blob) {
      voiceNoteUrl = URL.createObjectURL(voiceNote)
    } else if (typeof voiceNote === 'string') {
      voiceNoteUrl = voiceNote
    }
    
    const alert = {
      id,
      type,
      severity,
      description,
      photos: photoObjs,
      lat,
      lng,
      contributor,
      timestamp: new Date().toISOString(),
      votesUp: 0,
      votesDown: 0,
      verified: false,
      voiceNote: voiceNoteUrl,
      alternateRoutes: alternateRoutes || [],
      createdAt,
    }
    
    // Track createdAt to identify own alerts when they come back from Firebase
    localAlertTimestamps.current.add(createdAt)
    
    // Add to local state immediately (optimistic update)
    setAlerts((prev) => [alert, ...prev])
    
    let backendId = null
    
    // Save to PostgreSQL backend (if enabled) - this stores photos/voice with real URLs
    if (API_ENABLED) {
      try {
        const alertData = { type, severity, description, lat, lng, contributor, createdAt }
        const result = photos?.length || voiceNote
          ? await alertService.createAlertWithFiles(alertData, photos || [], voiceNote)
          : await alertService.createAlert(alertData)
        
        if (result.success && result.data) {
          backendId = result.data.id
          // Update local alert with backend data (includes real media URLs)
          setAlerts((prev) => prev.map(a => 
            a.createdAt === createdAt 
              ? { ...a, ...result.data, backendId: result.data.id, photos: result.data.photos || photoObjs, voiceNote: result.data.voiceNote || voiceNoteUrl }
              : a
          ))
        }
      } catch (err) {
        console.error('Failed to save alert to backend:', err)
      }
    }
    
    // Broadcast to other users via Firebase (real-time notification)
    // Include backendId so other users can fetch full details
    broadcastAlert({ ...alert, backendId })
    
    // Show browser notification if nearby (geofence)
    notifyIfNearby(alert)
    
    // Trigger notification callback if set
    if (onNewAlertRef.current) {
      onNewAlertRef.current(alert)
    }
    
    return alert
  }

  const voteAlert = async (id, delta) => {
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const votesUp = (a.votesUp || 0) + (delta > 0 ? 1 : 0)
        const votesDown = (a.votesDown || 0) + (delta < 0 ? 1 : 0)
        const score = votesUp - votesDown
        return { ...a, votesUp, votesDown, verified: score >= 3 }
      })
    )
    
    // Sync with backend
    if (API_ENABLED) {
      try {
        await alertService.voteAlert(id, delta > 0 ? 'up' : 'down')
      } catch (err) {
        console.error('Failed to sync vote with backend:', err)
      }
    }
  }

  const updateAlert = async (id, patch) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    
    if (API_ENABLED) {
      try {
        await alertService.updateAlert(id, patch)
      } catch (err) {
        console.error('Failed to update alert in backend:', err)
      }
    }
  }

  const removeAlert = async (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    
    if (API_ENABLED) {
      try {
        await alertService.deleteAlert(id)
      } catch (err) {
        console.error('Failed to delete alert from backend:', err)
      }
    }
  }

  const reloadAlerts = () => {
    // Refetch from backend if enabled
    if (API_ENABLED) {
      fetchAlerts()
    } else {
      setAlerts((prev) => [...prev])
    }
  }
  
  const setOnNewAlert = (callback) => {
    onNewAlertRef.current = callback
  }

  const value = {
    alerts,
    setAlerts,
    addAlert,
    voteAlert,
    updateAlert,
    removeAlert,
    reloadAlerts,
    severityTtl,
    setSeverityTtl,
    userLocation,
    setUserLocation,
    nearbyRadiusMeters,
    setNearbyRadiusMeters,
    setOnNewAlert,
    haversineMeters,
    // Comments
    alertComments,
    getCommentsForAlert,
    addCommentToAlert,
    fetchCommentsForAlert,
    // Backend integration
    loading,
    error,
    fetchAlerts,
    fetchNearbyAlerts,
    isBackendEnabled: API_ENABLED,
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export const useAlerts = () => useContext(AlertsContext)
export { haversineMeters }