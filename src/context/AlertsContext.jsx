import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AlertsContext = createContext(null)

const SEVERITY_TTL_MINUTES = {
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
  const lastAlertId = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) => {
        const now = Date.now()
        return prev.filter((a) => {
          const ttlMinutes = SEVERITY_TTL_MINUTES[a.severity] ?? 60
          const expiresAt = new Date(a.timestamp).getTime() + ttlMinutes * 60_000
          return expiresAt > now
        }).map((a) => {
          // Don't override manually verified alerts
          if (a.manuallyVerified) return a
          const score = (a.votesUp || 0) - (a.votesDown || 0)
          return { ...a, verified: score >= 3 }
        })
      })
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  const requestNotifyPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission() } catch {}
    }
  }

  useEffect(() => {
    requestNotifyPermission()
  }, [])

  const notifyIfNearby = (alert) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!userLocation) return
    const d = haversineMeters(userLocation.lat, userLocation.lng, alert.lat, alert.lng)
    if (d <= nearbyRadiusMeters) {
      new Notification('Nearby Hazard', {
        body: `${alert.type} (${alert.severity}) at ${d.toFixed(0)}m`,
      })
    }
  }

  const addAlert = ({ type, severity, description, photos, lat, lng, contributor = 'You' }) => {
    const id = ++lastAlertId.current
    const photoObjs = (photos || []).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
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
    }
    setAlerts((prev) => [alert, ...prev])
    notifyIfNearby(alert)
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

  const value = {
    alerts,
    setAlerts,
    addAlert,
    voteAlert,
    userLocation,
    setUserLocation,
    nearbyRadiusMeters,
    setNearbyRadiusMeters,
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export const useAlerts = () => useContext(AlertsContext)