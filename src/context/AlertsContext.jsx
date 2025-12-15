import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AlertsContext = createContext(null)

// BroadcastChannel for cross-tab alert sync
const alertChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('roadguard-alerts')
  : null

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
  const [userLocation, setUserLocation] = useState(null) // { lat, lng }
  const [nearbyRadiusMeters, setNearbyRadiusMeters] = useState(500)
  const [severityTtl, setSeverityTtl] = useState(DEFAULT_TTL_MINUTES)
  const lastAlertId = useRef(0)
  
  // Track locally created alert IDs to avoid showing notifications for own alerts
  const localAlertIds = useRef(new Set())
  
  // Callback to notify about new alerts (set by App component)
  const onNewAlertRef = useRef(null)

  // Listen for alerts from other tabs via BroadcastChannel
  useEffect(() => {
    if (!alertChannel) return
    
    const handleMessage = (event) => {
      const { type, alert } = event.data
      if (type === 'NEW_ALERT' && alert && alert.id) {
        // Skip if this is our own alert
        if (localAlertIds.current.has(alert.id)) {
          return
        }
        
        setAlerts((prev) => {
          // Avoid duplicates
          if (prev.some(a => a.id === alert.id)) {
            return prev
          }
          return [alert, ...prev]
        })
        
        // Dispatch event for notification listener (only for alerts from OTHER tabs)
        window.dispatchEvent(new CustomEvent('roadguard-remote-alert', { detail: alert }))
      }
    }
    
    alertChannel.onmessage = handleMessage
    return () => {
      alertChannel.onmessage = null
    }
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

  const addAlert = ({ type, severity, description, photos, lat, lng, contributor = 'You', voiceNote = null, alternateRoutes = [] }) => {
    const id = ++lastAlertId.current
    const photoObjs = (photos || []).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    
    // Convert voiceNote Blob to URL if it exists
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
    }
    
    // Track this as a local alert so we don't show notification for it
    localAlertIds.current.add(id)
    
    setAlerts((prev) => [alert, ...prev])
    
    // Broadcast to other tabs
    if (alertChannel) {
      // Create a serializable version (no Blob URLs)
      const broadcastAlert = {
        ...alert,
        photos: [], // Can't serialize blob URLs
        voiceNote: null, // Can't serialize blob URLs
      }
      alertChannel.postMessage({ type: 'NEW_ALERT', alert: broadcastAlert })
    }
    
    // Show browser notification if nearby
    notifyIfNearby(alert)
    
    // Trigger notification callback if set
    if (onNewAlertRef.current) {
      onNewAlertRef.current(alert)
    }
    
    return alert
  }

  const voteAlert = (id, delta) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const votesUp = (a.votesUp || 0) + (delta > 0 ? 1 : 0)
        const votesDown = (a.votesDown || 0) + (delta < 0 ? 1 : 0)
        const score = votesUp - votesDown
        return { ...a, votesUp, votesDown, verified: score >= 3 }
      })
    )
  }

  const updateAlert = (id, patch) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const reloadAlerts = () => {
    setAlerts((prev) => [...prev])
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
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export const useAlerts = () => useContext(AlertsContext)
export { haversineMeters }